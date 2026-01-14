
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { supabase } from '../services/supabaseClient';
import { Project, Task, TaskStatus, User, UserRole, Activity, CreateProjectDto } from '../types';
import { Layout } from '../components/Layout';
import { TaskCard } from '../components/TaskCard';
import { Badge } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';
import { MilestoneList } from '../components/MilestoneList';
import { NewProjectModal } from '../components/NewProjectModal';
import { useAuth } from '../services/authStore';
import { 
  Plus, 
  Users,  
  Activity as ActivityIcon, 
  LayoutGrid, 
  Info,
  Search,
  Filter,
  UserPlus,
  FileText,
  ChevronDown,
  Download,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
    generateProjectSummaryPDF, 
    generateTaskListPDF, 
    generateMemberWorkloadPDF, 
    generateActivityLogPDF,
    generateMilestoneReportPDF
} from '../utils/pdfGenerator';

import { InviteMemberModal } from '../components/InviteMemberModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'overview' | 'members' | 'activity' | 'milestones'>('tasks');
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false); // Export Dropdown State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    // 1. Fetch Project Details first (Critical for UI skeleton)
    try {
      setIsLoading(true);
      const projData = await api.projects.get(projectId);
      setProject(projData);
    } catch (err) {
      console.error('Failed to fetch project:', err);
      // If project fails, we can't really do anything
      setIsLoading(false);
      return; 
    }

    // 2. Fetch other data in parallel
    try {
        const [tasksData, membersData, activityData] = await Promise.all([
            api.tasks.list(projectId),
            api.projects.members(projectId),
            api.activity.list(projectId)
        ]);
        setTasks(tasksData);
        setMembers(membersData);
        setActivities(activityData);
    } catch (error) {
        console.error("Failed to fetch secondary data", error);
    } finally {
        setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime Subscription for Activities
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('project_activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          try {
             // Fetch full detail to get user info
             const newActivity = await api.activity.get(payload.new.id);
             setActivities(prev => [newActivity, ...prev]);
          } catch (err) {
             console.error('Error fetching new activity:', err);
          }
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update for Task only
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await api.tasks.update(taskId, { status: newStatus });
      // Activity is now handled by Realtime subscription
    } catch (err) {
        console.error(err);
        alert('Failed to update status');
        fetchData(); // Revert on error
    }
  };
  
  const handleTaskUpdate = async (taskId: string, data: Partial<Task>) => {
      try {
          const updated = await api.tasks.update(taskId, data);
          setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
          setSelectedTask(updated); // Update modal view
      } catch (e) {
          throw e;
      }
  };
  
  const handleTaskDelete = async (taskId: string) => {
      try {
          await api.tasks.delete(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
          setSelectedTask(null);
      } catch (e) {
          throw e;
      }
  };

  const handleCreateTask = async (data: any) => {
    try {
      const newTask = await api.tasks.create(data);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      alert('Failed to create task');
    }
  };
  
  const handleInviteSuccess = () => {
      fetchData(); // Refresh members list
  };

  const handleTaskClick = (task: Task) => {
      setSelectedTask(task);
  };
  
  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      if (taskId) {
         const task = tasks.find(t => t.id === taskId);
         if (task && task.status !== status) {
             handleStatusChange(taskId, status);
         }
      }
  };


  const canManageMembers = currentUser?.role === UserRole.OWNER;

  /* New Handler */
  const handleRemoveMember = async (userId: string) => {
      // Permission check
      if (currentUser?.role !== UserRole.OWNER) {
          alert('Only owners can remove members');
          return;
      }
      if (!confirm('Are you sure you want to remove this member?')) return;
      try {
          await api.projects.removeMember(projectId!, userId);
          setMembers(prev => prev.filter(m => m.id !== userId));
      } catch (err) {
          console.error(err);
          alert('Failed to remove member');
      }
  };

  const handleDeleteProject = async () => {
      if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
      try {
          await api.projects.remove(projectId!);
          // Navigate to dashboard after delete
          navigate('/dashboard');
      } catch (err) {
          console.error(err);
          alert('Failed to delete project');
      }
  };

  const handleUpdateProject = async (data: CreateProjectDto) => {
      try {
          const updated = await api.projects.update(projectId!, data);
          setProject(prev => prev ? { ...prev, ...updated } : updated);
      } catch (err) {
          console.error('Failed to update project', err);
          alert('Failed to update project');
      }
  };

  /* Export Handlers */
  const handleExport = async (type: string) => {
    if (!project) return;
    setIsExportOpen(false);

    switch (type) {
        case 'summary':
            generateProjectSummaryPDF(project, members);
            break;
        case 'tasks':
            generateTaskListPDF(tasks, project, members);
            break;
        case 'workload':
            generateMemberWorkloadPDF(project, members, tasks);
            break;
        case 'activity':
            generateActivityLogPDF(project, activities);
            break;
        case 'milestones':
            try {
                // Fetch milestones specifically for report
                const milestonesData = await api.milestones.list(project.id);
                generateMilestoneReportPDF(project, milestonesData);
            } catch (e) {
                console.error('Failed to fetch milestones for report', e);
                alert('Could not generate milestone report.');
            }
            break;
    }
  };

  /* Stats Calculation */
  const memberStats = members.map(m => {
      const assignedTasks = tasks.filter(t => t.assigneeId === m.id);
      const completed = assignedTasks.filter(t => t.status === TaskStatus.DONE).length;
      return {
          ...m,
          totalAssigned: assignedTasks.length,
          completed: completed
      };
  }).sort((a, b) => b.completed - a.completed);

  // Calculate stats dynamically from current tasks state
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const columns = [
    { title: 'Backlog', status: TaskStatus.BACKLOG },
    { title: 'To Do', status: TaskStatus.TODO },
    { title: 'In Progress', status: TaskStatus.IN_PROGRESS },
    { title: 'Review', status: TaskStatus.REVIEW },
    { title: 'Done', status: TaskStatus.DONE },
  ];

  if (isLoading && !project) return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div></div></Layout>;
  if (!project) return <Layout><div className="text-center py-20 text-slate-400">Project not found.</div></Layout>;

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-white tracking-tight font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{project.name}</h1>
                {currentUser?.role === UserRole.OWNER && (
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/20"
                            title="Edit Project"
                         >
                            <Edit2 size={18} />
                         </button>
                         <button 
                            onClick={handleDeleteProject}
                            className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                            title="Delete Project"
                         >
                            <Trash2 size={18} />
                         </button>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
               <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10"><LayoutGrid size={14} className="text-neon-blue"/> {project.status}</span>
               <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10"><Users size={14} className="text-neon-purple"/> {members.length} members</span>
               <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10"><ActivityIcon size={14} className="text-neon-pink"/> {completionPercentage}% complete</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {/* Export Dropdown */}
             <div className="relative">
                 <button
                     onClick={() => setIsExportOpen(!isExportOpen)}
                     className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 text-slate-300 font-bold rounded-xl hover:bg-white/5 hover:text-white hover:border-white/50 transition-all text-sm"
                 >
                     <Download size={18} />
                     Reports
                     <ChevronDown size={14} />
                 </button>
                 {isExportOpen && (
                     <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden transform origin-top-right transition-all animate-fade-in bg-[#0f1020]">
                         <div className="p-2 space-y-1">
                             <button onClick={() => handleExport('summary')} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                                 <FileText size={16} className="text-neon-blue"/> Project Summary
                             </button>
                             <button onClick={() => handleExport('tasks')} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                                 <FileText size={16} className="text-emerald-400"/> Task List
                             </button>
                             <button onClick={() => handleExport('workload')} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                                 <FileText size={16} className="text-neon-purple"/> Member Workload
                             </button>

                             <button onClick={() => handleExport('activity')} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                                 <FileText size={16} className="text-amber-400"/> Activity Log
                             </button>
                             <button onClick={() => handleExport('milestones')} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                                 <FileText size={16} className="text-indigo-400"/> Milestone Report
                             </button>
                         </div>
                     </div>
                 )}
             </div>
             <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue focus:border-neon-blue w-full sm:w-64 text-white placeholder-slate-600 transition-all"
                />
             </div>
             <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/50 font-bold rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.2)] hover:bg-neon-blue/30 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all active:scale-95 group"
             >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">New</span>
             </button>
          </div>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 w-fit backdrop-blur-sm mx-auto lg:mx-0">
          {['milestones', 'tasks', 'overview', 'members', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'milestones' && (
         <div className="max-w-4xl animate-fade-in">
            <MilestoneList projectId={projectId!} tasks={tasks} onTaskUpdate={fetchData} />
         </div>
      )}

      <div className="mb-8">
          {activeTab === 'tasks' && (
            <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-6 animate-fade-in scrollbar-thin">
              {columns.map(col => (
                <div key={col.status} className="flex-none w-72 lg:w-auto lg:flex-1 min-w-[250px] group">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-white flex items-center gap-2 font-display tracking-wide text-sm">
                       {col.title}
                       <span className="bg-white/10 text-neon-blue px-2 py-0.5 rounded-full text-xs font-mono border border-neon-blue/20">
                          {tasks.filter(t => t.status === col.status).length}
                       </span>
                    </h3>
                  </div>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.status)}
                    className="space-y-3 min-h-[200px] h-full rounded-2xl transition-all"
                  >
                    {tasks
                        .filter(t => t.status === col.status)
                        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(task => (
                            <div 
                                key={task.id} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, task)}
                                onClick={() => handleTaskClick(task)}
                            >
                                <TaskCard task={task} />
                            </div>
                        ))
                    }
                    {tasks.filter(t => t.status === col.status).length === 0 && (
                        <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-slate-500 text-sm font-medium bg-white/5 group-hover:border-white/20 transition-colors">
                            No tasks
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>



      {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                 
                 <div className="glass-panel p-6 rounded-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                    <h3 className="text-lg font-bold mb-4 text-white font-display">Project Description</h3>
                    <p className="text-slate-400 leading-relaxed">{project.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neon-blue/5 p-6 rounded-2xl border border-neon-blue/20 backdrop-blur-sm">
                       <h4 className="text-neon-blue text-xs font-bold uppercase mb-1 tracking-wider">Created At</h4>
                       <p className="text-white font-semibold text-lg drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                       <h4 className="text-emerald-400 text-xs font-bold uppercase mb-1 tracking-wider">Total Completion</h4>
                       <p className="text-emerald-100 font-semibold text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                         {completedTasks}/{totalTasks} tasks
                       </p>
                    </div>
                 </div>

                 {/* Delete Project Zone */}
                 {currentUser?.role === UserRole.OWNER && (
                    <div className="bg-rose-500/5 p-6 rounded-2xl border border-rose-500/20 flex items-center justify-between backdrop-blur-sm">
                         <div>
                             <h4 className="text-rose-400 font-bold mb-1 font-display">Danger Zone</h4>
                             <p className="text-sm text-rose-300/70">Permanently delete this project and all its data.</p>
                         </div>
                         <button 
                             onClick={handleDeleteProject}
                             className="flex items-center gap-2 px-4 py-2 bg-transparent text-rose-400 font-bold rounded-xl border border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all"
                         >
                             <Trash2 size={18} />
                             Delete Project
                         </button>
                    </div>
                 )}
              </div>
              
              <div className="space-y-6">
                 <div className="glass-panel p-6 rounded-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                    <h3 className="text-lg font-bold mb-4 text-white font-display">Team Stats</h3>
                    <div className="space-y-4">
                       {memberStats.map(stat => (
                           <div key={stat.id} className="flex items-center gap-3">
                              <img src={stat.avatarUrl} className="w-10 h-10 rounded-full bg-slate-800 object-cover border border-white/10" alt="" />
                              <div className="flex-1">
                                 <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-200">{stat.name}</span>
                                    <span className="text-neon-blue">{stat.completed} / {stat.totalAssigned} tasks</span>
                                 </div>
                                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                     <div 
                                        className="h-full bg-neon-blue rounded-full transition-all duration-500 shadow-[0_0_10px_#00f3ff]" 
                                        style={{ width: `${stat.totalAssigned > 0 ? (stat.completed / stat.totalAssigned) * 100 : 0}%` }}
                                     ></div>
                                 </div>
                              </div>
                           </div>
                       ))}
                       {memberStats.length === 0 && (
                           <p className="text-sm text-slate-500 text-center py-4">No members yet.</p>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="glass-panel rounded-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-lg font-bold text-white font-display">Team Members</h3>
                {canManageMembers && (
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neon-purple/10 text-neon-purple border border-neon-purple/30 rounded-lg hover:bg-neon-purple/20 hover:shadow-[0_0_10px_rgba(188,19,254,0.3)] text-sm font-semibold transition-all"
                  >
                    <UserPlus size={16} />
                    Invite
                  </button>
                )}
              </div>
              <div className="divide-y divide-white/5">
                {members.map(member => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={member.avatarUrl} className="w-10 h-10 rounded-full border border-white/10" alt={member.name} />
                      <div>
                        <p className="text-sm font-bold text-white">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge type="role" value={member.role} />
                      {canManageMembers && member.id !== currentUser?.id && (
                        <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-400 hover:underline px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                        >
                            Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                {activities.map((activity, idx) => {
                   const isLast = idx === activities.length - 1;
                   const meta = activity.metadata || {};
                   let actionText = '';
                   let targetText = '';

                   switch (activity.action) {
                       case 'TASK_CREATED':
                           actionText = 'created task';
                           targetText = meta.title || `Task #${activity.targetId}`;
                           break;
                       case 'TASK_UPDATED':
                           actionText = 'updated task';
                           targetText = meta.title || `Task #${activity.targetId}`;
                           break;
                       case 'TASK_DELETED':
                           actionText = 'deleted task';
                           targetText = meta.title || `Task #${activity.targetId}`;
                           break;
                       case 'MEMBER_ADDED':
                           actionText = 'added member';
                           const addedMember = members.find(m => m.id === activity.targetId);
                           targetText = addedMember ? addedMember.name : `User #${activity.targetId.substring(0,8)}...`;
                           if (meta.role) targetText += ` as ${meta.role}`;
                           break;
                       case 'MEMBER_REMOVED':
                           actionText = 'removed member';
                           targetText = `User #${activity.targetId.substring(0,8)}...`; 
                           break;
                       default:
                           actionText = activity.action.toLowerCase().replace('_', ' ');
                           targetText = `${activity.targetType} #${activity.targetId}`;
                   }

                   return (
                   <div key={activity.id} className="relative pl-12 pb-8 last:pb-0">
                      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-px bg-white/10"></div>}
                      <img 
                        src={activity.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activity.user?.name || 'Unknown'}`} 
                        className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-[#0f1020] shadow-[0_0_10px_rgba(0,0,0,0.5)] object-cover bg-slate-800" 
                        alt={activity.user?.name}
                      />
                      <div className="flex flex-col pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{activity.user?.name || 'Unknown User'}</span>
                          <span className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {actionText} <span className="font-semibold text-neon-blue">{targetText}</span>
                        </p>
                        {activity.action === 'TASK_UPDATED' && meta.changes && (
                            <div className="mt-2 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/10 font-mono">
                                Changed: <span className="text-neon-purple">{meta.changes}</span>
                            </div>
                        )}
                      </div>
                   </div>
                   );
                })}
                {activities.length === 0 && (
                    <p className="text-center text-slate-500 py-10">No recent activity.</p>
                )}
             </div>
          )}


      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        onSubmit={handleCreateTask}
        members={members}
        projectId={projectId!}
      />
      
      {/* Edit Project Modal */}
      {project && (
        <NewProjectModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleUpdateProject}
            initialData={{ name: project.name, description: project.description }}
            mode="edit"
        />
      )}
      
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        members={members}
        currentUser={currentUser}
      />
      
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={projectId!}
        currentMembers={members}
        onInvite={handleInviteSuccess}
      />
    </Layout>
  );
};
