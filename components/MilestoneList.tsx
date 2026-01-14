
import React, { useEffect, useState } from 'react';
import { Project, Milestone, Task, TaskStatus } from '../types';
import { api } from '../services/apiClient';

import { Flag, Calendar, Trash2, Plus, X, Search } from 'lucide-react';

interface MilestoneListProps {
  projectId: string;
  tasks?: Task[];
  onTaskUpdate?: () => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({ projectId, tasks = [], onTaskUpdate }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Assign Task State
  const [assigningMilestoneId, setAssigningMilestoneId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const data = await api.milestones.list(projectId);
      setMilestones(data);
    } catch (error) {
      console.error('Failed to fetch milestones', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.milestones.create({
        projectId,
        title,
        description,
        dueDate: dueDate || undefined,
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchMilestones();
    } catch (error) {
      console.error('Failed to create milestone', error);
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm('Are you sure you want to delete this milestone?')) return;
      try {
          await api.milestones.delete(id);
          fetchMilestones();
      } catch (error) {
          console.error("Failed to delete", error);
      }
  }

  const handleAssignTask = async (taskId: string, milestoneId: string) => {
      try {
          await api.tasks.update(taskId, { milestoneId });
          if (onTaskUpdate) {
            onTaskUpdate();
          }
          // Close assignment mode
          setAssigningMilestoneId(null);
          setTaskSearch('');
      } catch (error) {
          console.error("Failed to assign task", error);
      }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading milestones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-400" />
            Milestones
        </h3>

        <div className="flex gap-2">
            <button 
                onClick={() => setIsCreating(!isCreating)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
            >
                <Plus className="w-4 h-4" />
                New Milestone
            </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Sprint 1"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Optional description"
                        rows={2}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Due Date</label>
                    <input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                        Create
                    </button>
                </div>
            </div>
        </form>
      )}

      <div className="grid gap-4">
        {milestones.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <Flag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No milestones yet. Create one to get started!</p>
            </div>
        ) : (
            milestones.map((milestone) => {
                // Ensure unique tasks and avoid duplication in display if backend returns weirdly
                const milestoneTasks = tasks.filter(t => t.milestoneId === milestone.id);
                // Filter available tasks (unassigned or assigned to other milestones?) Usually unassigned.
                const availableTasks = tasks.filter(t => !t.milestoneId);
                const filteredAvailable = availableTasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()));

                return (
                    <div key={milestone.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-medium text-white mb-1">{milestone.title}</h4>
                                {milestone.description && <p className="text-sm text-slate-400">{milestone.description}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${milestone.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {milestone.status}
                                </span>
                                <button onClick={() => handleDelete(milestone.id)} className="text-slate-500 hover:text-red-400 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span>{milestone.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                        style={{ width: `${milestone.progress}%` }}
                                    />
                                </div>
                            </div>

                            {milestone.dueDate && (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due {new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            )}
                            
                            {/* Tasks List */}
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                     <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks ({milestoneTasks.length})</h5>
                                     <button 
                                        onClick={() => {
                                            if (assigningMilestoneId === milestone.id) {
                                                setAssigningMilestoneId(null);
                                            } else {
                                                setAssigningMilestoneId(milestone.id);
                                                setTaskSearch('');
                                            }
                                        }}
                                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                     >
                                         {assigningMilestoneId === milestone.id ? <X size={12} /> : <Plus size={12} />}
                                         {assigningMilestoneId === milestone.id ? 'Cancel' : 'Assign Task'}
                                     </button>
                                </div>
                                
                                {assigningMilestoneId === milestone.id && (
                                    <div className="mb-4 bg-slate-900/80 p-3 rounded-lg border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                                        <div className="relative mb-2">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={taskSearch}
                                                onChange={e => setTaskSearch(e.target.value)}
                                                placeholder="Search unassigned tasks..."
                                                className="w-full bg-black/40 border border-slate-700 rounded px-2 py-1.5 pl-7 text-xs text-white focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                            {filteredAvailable.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center py-2">No unassigned tasks found.</p>
                                            ) : (
                                                filteredAvailable.map(t => (
                                                    <button 
                                                        key={t.id}
                                                        onClick={() => handleAssignTask(t.id, milestone.id)}
                                                        className="w-full text-left px-2 py-1.5 hover:bg-white/5 rounded text-xs text-slate-300 truncate"
                                                    >
                                                        {t.title}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {milestoneTasks.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic">No tasks assigned.</p>
                                    ) : (
                                        milestoneTasks.map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        task.status === TaskStatus.DONE ? 'bg-emerald-500' :
                                                        task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-500'
                                                    }`} />
                                                    <span className={`text-sm ${task.status === TaskStatus.DONE ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded">
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
