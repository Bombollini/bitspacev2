import React from 'react';
import { Task, TaskStatus } from '../types';
import { Badge } from './Badge';
import { Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect, onDragStart }) => {
  return (
    <div 
      className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-neon-purple/50 shadow-sm hover:shadow-[0_0_15px_rgba(188,19,254,0.2)] transition-all cursor-grab active:cursor-grabbing group animate-scale-up backdrop-blur-sm"
      onClick={() => onSelect(task)}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge type="priority" value={task.priority} />
      </div>
      
      <h4 className="text-sm font-semibold text-white mb-3 line-clamp-2 group-hover:text-neon-purple transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Calendar size={12} className="text-neon-blue"/>
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}</span>
          </div>
        </div>
        
        {task.assignee && (
          <img 
            src={task.assignee.avatarUrl} 
            alt={task.assignee.name}
            title={task.assignee.name}
            className="w-7 h-7 rounded-full border border-white/10 group-hover:border-neon-purple/50 transition-colors"
          />
        )}
      </div>
    </div>
  );
};
