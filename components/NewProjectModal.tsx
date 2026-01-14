import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateProjectDto } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDto) => void;
  initialData?: { name: string; description?: string };
  mode?: 'create' | 'edit';
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  mode = 'create' 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
    } else if (isOpen && mode === 'create') {
      setName('');
      setDescription('');
    }
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
    });
    if (mode === 'create') {
        setName('');
        setDescription('');
    }
    onClose();
  };

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg overflow-hidden animate-scale-up border border-neon-blue/20 shadow-[0_0_50px_rgba(0,243,255,0.1)] rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-bold text-white font-display tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-blue rounded-full shadow-[0_0_5px_#00f3ff]"></span>
            {isEdit ? 'Update Protocol' : 'Initialize New Protocol'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Project Identifier</label>
            <input 
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none text-white placeholder-slate-600 transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Neural Network V2"
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Mission Parameters</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none text-white placeholder-slate-600 transition-all resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Define the primary objectives..."
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Abort
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-black bg-neon-blue hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] rounded-xl transition-all duration-300"
            >
              {isEdit ? 'Save Changes' : 'Initialize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
