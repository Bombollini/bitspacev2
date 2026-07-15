import React, { useState, useMemo } from 'react';
import { GanttTask, GanttMilestone, Task, Milestone, User } from '../types';
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttChartProps {
  tasks: Task[];
  milestones: Milestone[];
  members: User[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, milestones, members }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState<'week' | 'month'>('month');

  // Convert tasks to GanttTask format
  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks.map((task) => {
      const progress = task.status === 'DONE' ? 100 : task.status === 'REVIEW' ? 80 : task.status === 'IN_PROGRESS' ? 50 : task.status === 'TODO' ? 20 : 0;
      
      // Set start and end dates (use created date and due date if available, else estimate)
      const startDate = task.createdAt;
      const endDate = task.dueDate || new Date(new Date(task.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get assignee name
      const assignee = members.find(m => m.id === task.assigneeId)?.name;
      
      // Determine color based on priority
      let color = '#6B7280'; // gray
      if (task.priority === 'HIGH') color = '#EF4444'; // red
      else if (task.priority === 'MEDIUM') color = '#F59E0B'; // amber
      else if (task.priority === 'LOW') color = '#10B981'; // green

      return {
        id: `task-${task.id}`,
        taskId: task.id,
        title: task.title,
        startDate,
        endDate,
        progress,
        assignee,
        priority: task.priority,
        status: task.status,
        parentId: task.parentTaskId ? `task-${task.parentTaskId}` : undefined,
        milestoneId: task.milestoneId,
        color,
      };
    });
  }, [tasks, members]);

  // Convert milestones to GanttMilestone format
  const ganttMilestones: GanttMilestone[] = useMemo(() => {
    return milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      milestoneId: milestone.id,
      title: milestone.title,
      date: milestone.dueDate || milestone.createdAt,
      status: milestone.status,
      progress: milestone.progress || 0,
    }));
  }, [milestones]);

  // Get date range for the chart
  const { startDate, endDate, dateRange } = useMemo(() => {
    const allDates = [
      ...ganttTasks.map(t => new Date(t.startDate)),
      ...ganttTasks.map(t => new Date(t.endDate)),
      ...ganttMilestones.map(m => new Date(m.date)),
    ];
    
    if (allDates.length === 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: start, endDate: end, dateRange: [] };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    // Generate date range
    const range: Date[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      range.push(new Date(current));
      if (zoomLevel === 'week') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }

    return { startDate: minDate, endDate: maxDate, dateRange: range };
  }, [ganttTasks, ganttMilestones, zoomLevel]);

  // Calculate position for a date on the timeline
  const getXPosition = (date: Date) => {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const taskDuration = date.getTime() - startDate.getTime();
    return (taskDuration / totalDuration) * 100;
  };

  // Calculate width between two dates
  const getWidth = (start: Date, end: Date) => {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const taskDuration = end.getTime() - start.getTime();
    return Math.max((taskDuration / totalDuration) * 100, 2);
  };

  const formatDate = (date: Date) => {
    if (zoomLevel === 'week') {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } else {
      return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-neon-blue';
      case 'REVIEW': return 'bg-neon-purple';
      case 'TODO': return 'bg-amber-500';
      case 'BACKLOG': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-neon-blue" size={24} />
          <h3 className="text-xl font-bold text-white font-display">Gantt Chart - Timeline Proyek</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoomLevel(zoomLevel === 'week' ? 'month' : 'week')}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {zoomLevel === 'week' ? <ZoomIn size={16} /> : <ZoomOut size={16} />}
            {zoomLevel === 'week' ? 'Mingguan' : 'Bulanan'}
          </button>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex border-b border-white/10 pb-2 mb-4">
            <div className="w-64 flex-shrink-0 px-4 py-2 text-sm font-semibold text-slate-400">
              Tugas / Milestone
            </div>
            <div className="flex-1 flex">
              {dateRange.map((date, index) => (
                <div
                  key={index}
                  className="flex-1 text-center text-xs text-slate-400 px-1"
                  style={{ minWidth: zoomLevel === 'week' ? 80 : 120 }}
                >
                  {formatDate(date)}
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {ganttMilestones.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-semibold text-neon-purple mb-2 px-4">Milestone</div>
              {ganttMilestones.map((milestone) => {
                const milestoneDate = new Date(milestone.date);
                const xPos = getXPosition(milestoneDate);
                
                return (
                  <div key={milestone.id} className="flex items-center py-2 hover:bg-white/5 rounded-lg">
                    <div className="w-64 flex-shrink-0 px-4 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${milestone.status === 'CLOSED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-sm text-white truncate">{milestone.title}</span>
                    </div>
                    <div className="flex-1 relative h-8">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ left: `${Math.min(Math.max(xPos, 0), 98)}%` }}
                      >
                        <div className={`w-4 h-4 rotate-45 ${milestone.status === 'CLOSED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tasks */}
          <div>
            <div className="text-sm font-semibold text-neon-blue mb-2 px-4">Tugas</div>
            {ganttTasks.map((task) => {
              const taskStart = new Date(task.startDate);
              const taskEnd = new Date(task.endDate);
              const xPos = getXPosition(taskStart);
              const width = getWidth(taskStart, taskEnd);
              
              return (
                <div key={task.id} className="flex items-center py-2 hover:bg-white/5 rounded-lg">
                  <div className="w-64 flex-shrink-0 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{task.title}</span>
                      {task.assignee && (
                        <span className="text-xs text-slate-500">({task.assignee})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded-full overflow-hidden"
                      style={{
                        left: `${Math.min(Math.max(xPos, 0), 98)}%`,
                        width: `${Math.min(width, 100 - Math.max(xPos, 0))}%`,
                        backgroundColor: task.color,
                        opacity: 0.8,
                      }}
                    >
                      <div
                        className="h-full bg-white/30 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full"
                      style={{
                        left: `${Math.min(Math.max(xPos, 0), 98)}%`,
                        width: `${Math.min((task.progress / 100) * width, 100 - Math.max(xPos, 0))}%`,
                        backgroundColor: task.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-6 px-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">Selesai</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-blue" />
                <span className="text-xs text-slate-400">Dikerjakan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-purple" />
                <span className="text-xs text-slate-400">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">Todo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-xs text-slate-400">Backlog</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {ganttTasks.length === 0 && ganttMilestones.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>Belum ada tugas atau milestone untuk ditampilkan di timeline</p>
        </div>
      )}
    </div>
  );
};