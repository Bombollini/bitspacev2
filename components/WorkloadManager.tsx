import React, { useMemo } from 'react';
import { Task, User, TaskPriority, MemberWorkload as MemberWorkloadType } from '../types';
import { AlertTriangle, CheckCircle, UserPlus, Sparkles, TrendingUp } from 'lucide-react';

interface WorkloadManagerProps {
  tasks: Task[];
  members: User[];
  onAssignTask?: (taskId: string, userId: string) => void;
}

export const WorkloadManager: React.FC<WorkloadManagerProps> = ({ tasks, members, onAssignTask }) => {
  // Calculate workload for each member
  const memberWorkloads: MemberWorkloadType[] = useMemo(() => {
    return members.map(member => {
      const assignedTasks = tasks.filter(t => t.assigneeId === member.id);
      const completed = assignedTasks.filter(t => t.status === 'DONE').length;
      const inProgress = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const overdue = assignedTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'DONE';
      }).length;
      
      const total = assignedTasks.length;
      const workloadPercentage = Math.min(total * 15, 100); // 15% per task, max 100%
      const riskLevel = workloadPercentage >= 80 ? 'HIGH' : workloadPercentage >= 50 ? 'MEDIUM' : 'LOW';
      
      return {
        userId: member.id,
        user: member,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        totalHours: total * 4, // Estimated 4 hours per task
        workloadPercentage,
        riskLevel,
      };
    });
  }, [tasks, members]);

  // Find unassigned tasks
  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => !t.assigneeId && t.status !== 'DONE');
  }, [tasks]);

  // Smart assignment recommendations
  const getRecommendations = (task: Task) => {
    // Simple heuristic: find member with lowest workload
    const sortedMembers = [...memberWorkloads].sort((a, b) => 
      a.workloadPercentage - b.workloadPercentage
    );
    
    return sortedMembers.slice(0, 3).map(mw => ({
      member: mw.user,
      currentLoad: mw.workloadPercentage,
      reason: mw.workloadPercentage < 30 ? 'Beban rendah' : 'Tersedia',
    }));
  };

  // Get workload color
  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return 'text-rose-400 bg-rose-500/20 border-rose-500/50';
    if (percentage >= 50) return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return <AlertTriangle size={16} className="text-rose-400" />;
      case 'MEDIUM': return <AlertTriangle size={16} className="text-amber-400" />;
      default: return <CheckCircle size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workload Overview */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-neon-purple" size={24} />
          <h3 className="text-xl font-bold text-white font-display">Manajemen Beban Kerja</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberWorkloads.map((mw) => (
            <div
              key={mw.userId}
              className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={mw.user.avatarUrl}
                    alt={mw.user.name}
                    className="w-10 h-10 rounded-full border border-white/10"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{mw.user.name}</p>
                    <p className="text-xs text-slate-500">{mw.user.email}</p>
                  </div>
                </div>
                {getRiskIcon(mw.riskLevel)}
              </div>

              <div className="space-y-3">
                {/* Workload bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Beban Kerja</span>
                    <span className={`font-bold ${getWorkloadColor(mw.workloadPercentage).split(' ')[0]}`}>
                      {mw.workloadPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mw.workloadPercentage >= 80 ? 'bg-rose-500' :
                        mw.workloadPercentage >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${mw.workloadPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Task counts */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{mw.totalTasks}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <p className="text-lg font-bold text-emerald-400">{mw.completedTasks}</p>
                    <p className="text-xs text-slate-500">Selesai</p>
                  </div>
                  {mw.overdueTasks > 0 && (
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                      <p className="text-lg font-bold text-rose-400">{mw.overdueTasks}</p>
                      <p className="text-xs text-slate-500">Terlambat</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {memberWorkloads.some(mw => mw.riskLevel === 'HIGH') && (
        <div className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-rose-400 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="text-lg font-bold text-rose-400 mb-2">Peringatan Beban Kerja Tinggi</h4>
              <p className="text-slate-400 text-sm mb-3">
                {memberWorkloads.filter(mw => mw.riskLevel === 'HIGH').map(mw => mw.user.name).join(', ')}
                {memberWorkloads.filter(mw => mw.riskLevel === 'HIGH').length > 1 ? ' memiliki' : ' memiliki'} beban kerja yang terlalu tinggi.
                Pertimbangkan untuk mendistribusikan tugas ke anggota lain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Assignment */}
      {unassignedTasks.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-neon-blue" size={24} />
            <h3 className="text-xl font-bold text-white font-display">Rekomendasi Penugasan AI</h3>
          </div>

          <div className="space-y-4">
            {unassignedTasks.slice(0, 5).map((task) => {
              const recommendations = getRecommendations(task);
              
              return (
                <div key={task.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-white mb-1">{task.title}</h5>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                        task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {task.priority === 'HIGH' ? 'Prioritas Tinggi' :
                         task.priority === 'MEDIUM' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">Rekomendasi penugasan:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec) => (
                      <button
                        key={rec.member.id}
                        onClick={() => onAssignTask?.(task.id, rec.member.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-neon-blue/10 border border-neon-blue/30 rounded-lg hover:bg-neon-blue/20 transition-colors group"
                      >
                        <img
                          src={rec.member.avatarUrl}
                          alt={rec.member.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="text-left">
                          <p className="text-sm text-white font-medium">{rec.member.name}</p>
                          <p className="text-xs text-slate-400">
                            {rec.reason} · {rec.currentLoad}% beban
                          </p>
                        </div>
                        <UserPlus size={14} className="text-neon-blue ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {unassignedTasks.length > 5 && (
              <p className="text-center text-slate-500 text-sm">
                +{unassignedTasks.length - 5} tugas lainnya belum ditugaskan
              </p>
            )}
          </div>
        </div>
      )}

      {unassignedTasks.length === 0 && memberWorkloads.every(mw => mw.riskLevel === 'LOW') && (
        <div className="glass-panel rounded-2xl p-8 border border-emerald-500/30 bg-emerald-500/5 text-center">
          <CheckCircle className="text-emerald-400 mx-auto mb-4" size={48} />
          <h4 className="text-lg font-bold text-emerald-400 mb-2">Distribusi Tugas Optimal</h4>
          <p className="text-slate-400">Semua tugas telah terdistribusi dengan baik dan beban kerja tim seimbang.</p>
        </div>
      )}
    </div>
  );
};