import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';
import { Badge } from './Badge';
import { X, Calendar, User as UserIcon, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  members: User[];
  currentUser: User | null;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onUpdate,
  onDelete,
  members,
  currentUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        status: task.status,
        assigneeId: task.assigneeId,
        priority: task.priority,
        dueDate: task.dueDate
      });
      setIsEditing(false); // Reset edit mode on new task open
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const canEdit = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.MEMBER || task.assigneeId === currentUser?.id;
  const canDelete = currentUser?.role === UserRole.OWNER;

  const handleSave = async () => {
    try {
      await onUpdate(task.id, editedTask);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save changes');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
        setIsDeleting(true);
        try {
            await onDelete(task.id);
            onClose();
        } catch(e) {
            alert('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    }
  };

  const assignee = members.find(m => m.id === (isEditing ? editedTask.assigneeId : task.assigneeId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 rounded-2xl animate-scale-up scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex-1 pr-8">
            {isEditing ? (
              <input 
                className="w-full text-2xl font-bold text-white border-b-2 border-neon-blue focus:border-neon-purple outline-none pb-1 bg-transparent placeholder-slate-600 transition-all font-display tracking-tight"
                value={editedTask.title}
                onChange={e => setEditedTask({...editedTask, title: e.target.value})}
              />
            ) : (
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white leading-tight font-display tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{task.title}</h2>
                    <Badge type="status" value={task.status} />
                </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column (Description) */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-neon-blue uppercase tracking-wider mb-2 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">Description</h3>
                        {isEditing ? (
                            <textarea 
                                className="w-full h-40 p-4 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none text-slate-300 placeholder-slate-600 transition-all"
                                value={editedTask.description || ''}
                                onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                                placeholder="Add a description..."
                            />
                        ) : (
                            <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">
                                {task.description || <span className="text-slate-600 italic">No description provided.</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column (Meta) */}
                <div className="space-y-6">
                    {/* Status Select */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</h3>
                         {isEditing ? (
                            <select 
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all [&>option]:bg-slate-900"
                                value={editedTask.status}
                                onChange={e => setEditedTask({...editedTask, status: e.target.value as TaskStatus})}
                            >
                                {Object.values(TaskStatus).map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        ) : (
                           <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full shadow-[0_0_5px_currentColor] ${
                                    task.status === TaskStatus.DONE ? 'bg-emerald-500 text-emerald-500' : 
                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-neon-blue text-neon-blue' : 'bg-slate-500 text-slate-500'
                                }`}></div>
                                <span className="text-sm font-medium text-slate-300">{task.status.replace('_', ' ')}</span>
                           </div>
                        )}
                    </div>

                    {/* Assignee */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignee</h3>
                         {isEditing ? (
                            <select 
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all [&>option]:bg-slate-900"
                                value={editedTask.assigneeId || ''}
                                onChange={e => setEditedTask({...editedTask, assigneeId: e.target.value || null})}
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-2">
                                {assignee ? (
                                    <>
                                        {assignee.avatarUrl ? (
                                            <img src={assignee.avatarUrl} className="w-8 h-8 rounded-full border border-white/10" alt={assignee.name} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue font-bold text-xs border border-neon-blue/30">{assignee.name.charAt(0)}</div>
                                        )}
                                        <span className="text-sm font-medium text-slate-300">{assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-slate-500 italic flex items-center gap-1">
                                        <UserIcon size={14} /> Unassigned
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</h3>
                        {isEditing ? (
                            <input 
                                type="date"
                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all [color-scheme:dark]"
                                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                                onChange={e => setEditedTask({...editedTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Calendar size={16} className="text-slate-500" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 bg-white/5 border-t border-white/10">
            {canDelete ? (
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-sm font-semibold border border-transparent hover:border-rose-500/30"
                >
                    <Trash2 size={16} />
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                </button>
            ) : <div></div>}

            <div className="flex items-center gap-3">
                {canEdit && (
                    !isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-white rounded-xl transition-all shadow-sm font-semibold text-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        >
                            <Edit2 size={16} />
                            Edit Task
                        </button>
                    ) : (
                         <>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2.5 bg-neon-blue hover:bg-white text-black rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all font-semibold text-sm active:scale-95"
                            >
                                <Check size={16} />
                                Save Changes
                            </button>
                         </>
                    )
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
