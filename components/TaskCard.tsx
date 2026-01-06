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
      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group animate-in fade-in duration-300"
      onClick={() => onSelect(task)}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
    >
      <div className="flex justify-between items-start mb-2">
        <Badge type="priority" value={task.priority} />
      </div>
      
      <h4 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <Calendar size={12} />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}</span>
          </div>
        </div>
        
        {task.assignee && (
          <img 
            src={task.assignee.avatarUrl} 
            alt={task.assignee.name}
            title={task.assignee.name}
            className="w-6 h-6 rounded-full border-2 border-white"
          />
        )}
      </div>
    </div>
  );
};
