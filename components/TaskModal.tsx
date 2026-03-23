
import React, { useState } from 'react';
import { TaskStatus, TaskPriority, User, CreateTaskDto } from '../types';
import { X, Sparkles, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/apiClient';

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
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateAI = async () => {
    if (!title) return alert("Please enter a task title first.");
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: { action: 'generate_task_description', title }
      });
      if (error) throw error;
      setDescription(data?.result || "AI generation failed.");
    } catch (err) {
      console.error(err);
      alert("Failed to generate description with AI");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let attachmentUrl = undefined;
      if (file) {
        attachmentUrl = await api.tasks.uploadAttachment(file);
      }
      
      await onSubmit({
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        projectId,
        attachmentUrl,
      });
      setFile(null);
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Error saving task: " + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-300">Description</label>
              <button 
                type="button" 
                onClick={handleGenerateAI}
                disabled={isGenerating || !title}
                className="flex items-center gap-1.5 text-xs font-bold text-neon-blue hover:text-white bg-neon-blue/10 hover:bg-neon-blue/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-neon-blue/20"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Generate with AI
              </button>
            </div>
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
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5 flex items-center gap-2">
              <ImageIcon size={16} className="text-neon-purple" />
              Attachment (Image)
            </label>
            <div className={`relative flex items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all ${file ? 'border-neon-purple bg-neon-purple/5' : 'border-white/10 bg-black/40 hover:border-white/30'}`}>
              <input 
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => setFile(e.target.files && e.target.files.length > 0 ? e.target.files[0] : null)}
              />
              <div className="flex flex-col items-center gap-2 text-slate-400 pointer-events-none">
                {file ? (
                  <>
                    <ImageIcon size={24} className="text-neon-purple" />
                    <span className="text-sm font-medium text-white truncate max-w-xs">{file.name}</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    <span className="text-sm">Click to upload or drag and drop</span>
                  </>
                )}
              </div>
            </div>
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
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-black bg-neon-blue hover:bg-white rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
