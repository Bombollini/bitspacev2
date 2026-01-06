
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiClient';
import { Project, Task, TaskStatus, User, UserRole, Activity } from '../types';
import { Layout } from '../components/Layout';
import { TaskCard } from '../components/TaskCard';
import { Badge } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';
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
  Trash2
} from 'lucide-react';
import { 
    generateProjectSummaryPDF, 
    generateTaskListPDF, 
    generateMemberWorkloadPDF, 
    generateOverdueReportPDF, 
    generateActivityLogPDF 
} from '../utils/pdfGenerator';

import { InviteMemberModal } from '../components/InviteMemberModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user: currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'overview' | 'members' | 'activity'>('tasks');
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false); // Export Dropdown State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projData, tasksData, membersData, activityData] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.list(projectId),
        api.projects.members(projectId),
        api.activity.list(projectId)
      ]);
      setProject(projData);
      setTasks(tasksData);
      setMembers(membersData);
      setActivities(activityData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      await api.tasks.update(taskId, { status: newStatus });
      setActivities(prev => [
          {
             id: Math.random().toString(), project_id: projectId!, userId: currentUser?.id || '', action: 'updated', entityType: 'task', entityId: taskId, createdAt: new Date().toISOString()
          } as any, 
          ...prev
      ]);
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
          // We can use window.location or navigate from router
          // Since navigate is not imported in component (only useParams), let's fix imports first or use window.location
          window.location.href = '#/dashboard';
      } catch (err) {
          console.error(err);
          alert('Failed to delete project');
      }
  };

  /* Export Handlers */
  const handleExport = (type: string) => {
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
        case 'overdue':
            generateOverdueReportPDF(project, tasks, members);
            break;
        case 'activity':
            generateActivityLogPDF(project, activities);
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

  if (isLoading && !project) return <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></Layout>;
  if (!project) return <Layout><div className="text-center py-20">Project not found.</div></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
               <span className="flex items-center gap-1.5"><LayoutGrid size={16}/> {project.status}</span>
               <span className="flex items-center gap-1.5"><Users size={16}/> {members.length} members</span>
               <span className="flex items-center gap-1.5"><ActivityIcon size={16}/> {completionPercentage}% complete</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {/* Export Dropdown */}
             <div className="relative">
                 <button
                     onClick={() => setIsExportOpen(!isExportOpen)}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                 >
                     <Download size={18} />
                     Reports
                     <ChevronDown size={14} />
                 </button>
                 {isExportOpen && (
                     <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                         <div className="p-2 space-y-1">
                             <button onClick={() => handleExport('summary')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <FileText size={16} className="text-blue-500"/> Project Summary
                             </button>
                             <button onClick={() => handleExport('tasks')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <FileText size={16} className="text-emerald-500"/> Task List
                             </button>
                             <button onClick={() => handleExport('workload')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <FileText size={16} className="text-purple-500"/> Member Workload
                             </button>
                             <button onClick={() => handleExport('overdue')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <FileText size={16} className="text-rose-500"/> Overdue Tasks
                             </button>
                             <button onClick={() => handleExport('activity')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                                 <FileText size={16} className="text-amber-500"/> Activity Log
                             </button>
                         </div>
                     </div>
                 )}
             </div>
             <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 shadow-sm"
                />
             </div>
             <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95"
             >
                <Plus size={18} />
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">New</span>
             </button>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
          {['tasks', 'overview', 'members', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-slate-100 text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
          {activeTab === 'tasks' && (
            <div className="flex gap-6 overflow-x-auto pb-6">
              {columns.map(col => (
                <div key={col.status} className="flex-none w-80">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                       {col.title}
                       <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                          {tasks.filter(t => t.status === col.status).length}
                       </span>
                    </h3>
                  </div>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.status)}
                    className="space-y-3 min-h-[200px]"
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
                        <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                 {/* ... existing description ... */}
                 
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Project Description</h3>
                    <p className="text-slate-600 leading-relaxed">{project.description}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                       <h4 className="text-blue-600 text-xs font-bold uppercase mb-1">Created At</h4>
                       <p className="text-blue-900 font-semibold">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                       <h4 className="text-emerald-600 text-xs font-bold uppercase mb-1">Total Completion</h4>
                       <p className="text-emerald-900 font-semibold">
                         {completedTasks}/{totalTasks} tasks
                       </p>
                    </div>
                 </div>

                 {/* Delete Project Zone */}
                 {currentUser?.role === UserRole.OWNER && (
                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
                         <div>
                             <h4 className="text-rose-700 font-bold mb-1">Danger Zone</h4>
                             <p className="text-sm text-rose-600/80">permanently delete this project and all its data.</p>
                         </div>
                         <button 
                             onClick={handleDeleteProject}
                             className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                         >
                             <Trash2 size={18} />
                             Delete Project
                         </button>
                    </div>
                 )}
              </div>
              
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Team Stats</h3>
                    <div className="space-y-4">
                       {memberStats.map(stat => (
                           <div key={stat.id} className="flex items-center gap-3">
                              <img src={stat.avatarUrl} className="w-10 h-10 rounded-full bg-slate-100 object-cover" alt="" />
                              <div className="flex-1">
                                 <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span>{stat.name}</span>
                                    <span className="text-blue-600">{stat.completed} / {stat.totalAssigned} tasks</span>
                                 </div>
                                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                        style={{ width: `${stat.totalAssigned > 0 ? (stat.completed / stat.totalAssigned) * 100 : 0}%` }}
                                     ></div>
                                 </div>
                              </div>
                           </div>
                       ))}
                       {memberStats.length === 0 && (
                           <p className="text-sm text-slate-400 text-center py-4">No members yet.</p>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold">Team Members</h3>
                {canManageMembers && (
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-semibold"
                  >
                    <UserPlus size={16} />
                    Invite
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {members.map(member => (
                  <div key={member.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={member.avatarUrl} className="w-10 h-10 rounded-full" alt={member.name} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge type="role" value={member.role} />
                      {canManageMembers && member.id !== currentUser?.id && (
                        <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 rounded hover:bg-rose-50 transition-colors"
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
             <div className="max-w-2xl mx-auto space-y-6">
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
                      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200"></div>}
                      <img 
                        src={activity.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activity.user?.name || 'Unknown'}`} 
                        className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" 
                        alt={activity.user?.name}
                      />
                      <div className="flex flex-col pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">{activity.user?.name || 'Unknown User'}</span>
                          <span className="text-xs text-slate-400">{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {actionText} <span className="font-semibold text-slate-900">{targetText}</span>
                        </p>
                        {activity.action === 'TASK_UPDATED' && meta.changes && (
                            <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                Changed: {meta.changes}
                            </div>
                        )}
                      </div>
                   </div>
                   );
                })}
                {activities.length === 0 && (
                    <p className="text-center text-slate-400 py-10">No recent activity.</p>
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
