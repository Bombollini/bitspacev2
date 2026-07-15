import React, { useMemo } from 'react';
import { Task, Milestone, User, TaskStatus } from '../types';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

interface AnalyticsChartsProps {
  tasks: Task[];
  milestones: Milestone[];
  members: User[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ tasks, milestones, members }) => {
  // Calculate task statistics
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const backlogTasks = tasks.filter(t => t.status === 'BACKLOG').length;
    const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;
    
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'DONE';
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Member workload
    const memberStats = members.map(member => {
      const assignedTasks = tasks.filter(t => t.assigneeId === member.id);
      const completed = assignedTasks.filter(t => t.status === 'DONE').length;
      const inProgress = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const total = assignedTasks.length;
      const memberCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        member,
        assignedTasks: total,
        completed,
        inProgress,
        completionRate: memberCompletionRate,
        workload: Math.min(total * 20, 100), // Simple workload estimation
      };
    });

    // Milestone stats
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'CLOSED').length;
    const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Weekly trends (last 7 days)
    const weeklyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const tasksOnDate = tasks.filter(t => {
        const createdDate = new Date(t.createdAt).toISOString().split('T')[0];
        return createdDate <= dateStr;
      });
      
      const completedOnDate = tasks.filter(t => {
        if (t.status !== 'DONE') return false;
        const updatedDate = new Date(t.updatedAt).toISOString().split('T')[0];
        return updatedDate === dateStr;
      });
      
      weeklyTrends.push({
        date: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        total: tasksOnDate.length,
        completed: completedOnDate.length,
      });
    }

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      backlogTasks,
      reviewTasks,
      overdueTasks,
      completionRate,
      memberStats,
      totalMilestones,
      completedMilestones,
      milestoneCompletionRate,
      weeklyTrends,
    };
  }, [tasks, milestones, members]);

  // Get color for task status
  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'DONE': return '#10B981';
      case 'IN_PROGRESS': return '#00F3FF';
      case 'REVIEW': return '#BC13FE';
      case 'TODO': return '#F59E0B';
      case 'BACKLOG': return '#6B7280';
      default: return '#6B7280';
    }
  };

  // Get workload color
  const getWorkloadColor = (percentage: number): string => {
    if (percentage >= 80) return '#EF4444';
    if (percentage >= 50) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neon-blue/20 rounded-xl">
              <BarChart3 className="text-neon-blue" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats.completionRate}%</span>
          </div>
          <p className="text-slate-400 text-sm">Tingkat Penyelesaian</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.completedTasks} dari {stats.totalTasks} tugas selesai
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{stats.completedTasks}</span>
          </div>
          <p className="text-slate-400 text-sm">Tugas Selesai</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.inProgressTasks} sedang dikerjakan
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-neon-purple/20 rounded-xl">
              <Users className="text-neon-purple" size={24} />
            </div>
            <span className="text-2xl font-bold text-white">{members.length}</span>
          </div>
          <p className="text-slate-400 text-sm">Anggota Tim</p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.memberStats.filter(m => m.workload > 50).length} dengan beban tinggi
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-500/20 rounded-xl">
              <Clock className="text-rose-500" size={24} />
            </div>
            <span className="text-2xl font-bold text-rose-400">{stats.overdueTasks}</span>
          </div>
          <p className="text-slate-400 text-sm">Tugas Terlambat</p>
          <p className="text-xs text-slate-500 mt-1">
            Perlu perhatian segera
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 font-display">Distribusi Status Tugas</h3>
          <div className="space-y-4">
            {[
              { status: 'DONE' as TaskStatus, label: 'Selesai', count: stats.completedTasks },
              { status: 'IN_PROGRESS' as TaskStatus, label: 'Dikerjakan', count: stats.inProgressTasks },
              { status: 'REVIEW' as TaskStatus, label: 'Review', count: stats.reviewTasks },
              { status: 'TODO' as TaskStatus, label: 'Todo', count: stats.todoTasks },
              { status: 'BACKLOG' as TaskStatus, label: 'Backlog', count: stats.backlogTasks },
            ].map((item) => {
              const width = stats.totalTasks > 0 ? (item.count / stats.totalTasks) * 100 : 0;
              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: getStatusColor(item.status),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Workload */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 font-display">Beban Kerja Anggota</h3>
          <div className="space-y-4">
            {stats.memberStats.slice(0, 5).map((stat) => (
              <div key={stat.member.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{stat.member.name}</span>
                  <span className="text-white font-semibold">{stat.assignedTasks} tugas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${stat.workload}%`,
                        backgroundColor: getWorkloadColor(stat.workload),
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">
                    {stat.workload}%
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {stat.completed} selesai · {stat.inProgress} berlangsung
                </div>
              </div>
            ))}
            {stats.memberStats.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                Belum ada anggota tim
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 font-display">Trend Mingguan</h3>
        <div className="h-48 flex items-end gap-2 px-4">
          {stats.weeklyTrends.map((day, index) => {
            const maxTotal = Math.max(...stats.weeklyTrends.map(d => d.total), 1);
            const totalHeight = (day.total / maxTotal) * 100;
            const completedHeight = day.total > 0 ? (day.completed / day.total) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-32 flex flex-col justify-end gap-1">
                  {/* Total bar background */}
                  <div
                    className="w-full bg-white/10 rounded-t relative"
                    style={{ height: `${totalHeight}%` }}
                  >
                    {/* Completed bar */}
                    {day.completed > 0 && (
                      <div
                        className="w-full bg-emerald-500/80 rounded-t absolute bottom-0"
                        style={{ height: `${completedHeight}%` }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{day.date}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-xs text-slate-400">Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/10 rounded" />
            <span className="text-xs text-slate-400">Total</span>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      {stats.totalMilestones > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 font-display">Progress Milestone</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">
                {stats.completedMilestones} dari {stats.totalMilestones} milestone selesai
              </span>
              <span className="text-white font-bold">{stats.milestoneCompletionRate}%</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-purple rounded-full transition-all duration-500"
                style={{ width: `${stats.milestoneCompletionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
