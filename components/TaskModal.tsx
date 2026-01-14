
import React, { useState } from 'react';
import { TaskStatus, TaskPriority, User, CreateTaskDto } from '../types';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto) => void;
  members: User[];
  projectId: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, members, projectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(TaskStatus.TODO);
  const [priority, setPriority] = useState(TaskPriority.MEDIUM);
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      projectId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-bold text-white font-display tracking-tight">Create New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Task Title</label>
            <input 
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Fix navigation bug"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white placeholder-slate-600 transition-all resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail out the issue..."
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Priority Level</label>
              <select 
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white transition-all [&>option]:bg-slate-900"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Assign To</label>
              <select 
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white transition-all [&>option]:bg-slate-900"
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
              >
                <option value="">Select Member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Due Date</label>
            <input 
              type="date"
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue text-white transition-all [color-scheme:dark]"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-white/10 mt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-black bg-neon-blue hover:bg-white rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all active:scale-95"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
