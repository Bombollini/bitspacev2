
import React from 'react';
import { TaskStatus, TaskPriority } from '../types';

interface BadgeProps {
  type: 'status' | 'priority' | 'role';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const getColors = () => {
    switch (value) {
      case TaskStatus.DONE: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case TaskStatus.REVIEW: return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case TaskStatus.TODO: return 'bg-slate-500/10 text-slate-300 border border-slate-500/30';
      case TaskStatus.BACKLOG: return 'bg-slate-500/5 text-slate-400 border border-slate-500/20';
      
      case TaskPriority.HIGH: return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case TaskPriority.MEDIUM: return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case TaskPriority.LOW: return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';

      case 'OWNER': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'SUPERADMIN': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'DEVELOPER': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getColors()}`}>
      {value.replace('_', ' ')}
    </span>
  );
};
