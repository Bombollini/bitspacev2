
import React from 'react';
import { TaskStatus, TaskPriority } from '../types';

interface BadgeProps {
  type: 'status' | 'priority' | 'role';
  value: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  const getColors = () => {
    switch (value) {
      case TaskStatus.DONE: return 'bg-emerald-100 text-emerald-700';
      case TaskStatus.REVIEW: return 'bg-purple-100 text-purple-700';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case TaskStatus.TODO: return 'bg-slate-100 text-slate-700';
      case TaskStatus.BACKLOG: return 'bg-slate-50 text-slate-500';
      
      case TaskPriority.URGENT: return 'bg-rose-100 text-rose-700';
      case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700';
      case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-700';
      case TaskPriority.LOW: return 'bg-slate-100 text-slate-600';

      case 'OWNER': return 'bg-amber-100 text-amber-800';
      case 'SUPERADMIN': return 'bg-red-100 text-red-800';
      case 'DEVELOPER': return 'bg-blue-100 text-blue-800';
      
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getColors()}`}>
      {value.replace('_', ' ')}
    </span>
  );
};
