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

  const canEdit = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN || task.assigneeId === currentUser?.id;
  const canDelete = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex-1 pr-8">
            {isEditing ? (
              <input 
                className="w-full text-2xl font-bold text-slate-900 border-b-2 border-blue-100 focus:border-blue-600 outline-none pb-1 bg-transparent"
                value={editedTask.title}
                onChange={e => setEditedTask({...editedTask, title: e.target.value})}
              />
            ) : (
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{task.title}</h2>
                    <Badge type="status" value={task.status} />
                </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                        {isEditing ? (
                            <textarea 
                                className="w-full h-40 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
                                value={editedTask.description || ''}
                                onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                            />
                        ) : (
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {task.description || <span className="text-slate-400 italic">No description provided.</span>}
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
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={editedTask.status}
                                onChange={e => setEditedTask({...editedTask, status: e.target.value as TaskStatus})}
                            >
                                {Object.values(TaskStatus).map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        ) : (
                           <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${
                                    task.status === TaskStatus.DONE ? 'bg-emerald-500' : 
                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'
                                }`}></div>
                                <span className="text-sm font-medium text-slate-700">{task.status.replace('_', ' ')}</span>
                           </div>
                        )}
                    </div>

                    {/* Assignee */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignee</h3>
                         {isEditing ? (
                            <select 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
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
                                            <img src={assignee.avatarUrl} className="w-8 h-8 rounded-full" alt={assignee.name} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{assignee.name.charAt(0)}</div>
                                        )}
                                        <span className="text-sm font-medium text-slate-700">{assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-slate-400 italic flex items-center gap-1">
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
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                                onChange={e => setEditedTask({...editedTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Calendar size={16} className="text-slate-400" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            {canDelete ? (
                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-semibold"
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
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 rounded-xl transition-all shadow-sm font-semibold text-sm"
                        >
                            <Edit2 size={16} />
                            Edit Task
                        </button>
                    ) : (
                         <>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all font-semibold text-sm"
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
