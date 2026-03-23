import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CreateMeetingDto, Project } from '../types';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMeetingDto) => void;
  projects: Project[];
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects
}) => {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProjectId(projects.length > 0 ? projects[0].id : '');
      setTitle('');
      
      // Default date to next closest hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      now.setSeconds(0);
      now.setMilliseconds(0);
      
      // format to YYYY-MM-DDThh:mm for datetime-local
      const tzoffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
      setMeetingDate(localISOTime);
      
      setMeetingLink('');
    }
  }, [isOpen, projects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
        alert("Please select a project.");
        return;
    }
    onSubmit({
      projectId,
      title,
      meetingDate: new Date(meetingDate).toISOString(), // Convert back to UTC for DB
      meetingLink,
      retrospective: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-lg overflow-hidden animate-scale-up border border-neon-purple/20 shadow-[0_0_50px_rgba(188,19,254,0.1)] rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h3 className="text-xl font-bold text-white font-display tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_5px_#bc13fe]"></span>
            Schedule Meeting
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Project</label>
              <select 
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white transition-all appearance-none"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                <option value="" disabled>Select a project</option>
                {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Topic / Title</label>
              <input 
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white placeholder-slate-500 transition-all"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What will be discussed?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date & Time</label>
                  <input 
                    type="datetime-local"
                    required
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white transition-all appearance-none"
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Meeting Link</label>
                  <input 
                    type="url"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none text-white placeholder-slate-500 transition-all"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-neon-purple hover:bg-neon-purple/80 shadow-[0_0_15px_rgba(188,19,254,0.3)] hover:shadow-[0_0_20px_rgba(188,19,254,0.5)] rounded-xl transition-all duration-300"
            >
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
