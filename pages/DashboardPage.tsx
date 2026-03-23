import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/apiClient";
import { Project } from "../types";
import { Layout } from "../components/Layout";
import { Briefcase, CheckCircle2, AlertCircle, Clock, LayoutDashboard } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const didInitialFetch = useRef(false);

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { name: "Active Projects", value: projects.length, icon: Briefcase, color: "text-neon-blue", bg: "bg-neon-blue/10 border-neon-blue/30" },
    { name: "Total Tasks", value: projects.reduce((acc, p) => acc + (p.stats?.totalTasks || 0), 0), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
    { name: "Completed", value: projects.reduce((acc, p) => acc + (p.stats?.completedTasks || 0), 0), icon: Clock, color: "text-neon-purple", bg: "bg-neon-purple/10 border-neon-purple/30" },
    { name: "Overdue", value: projects.reduce((acc, p) => acc + (p.stats?.overdueTasks || 0), 0), icon: AlertCircle, color: "text-neon-pink", bg: "bg-neon-pink/10 border-neon-pink/30" },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Dashboard Overview</h2>
          <p className="text-slate-400 max-w-2xl">Track your team's progress across all active developments in the neural network. Select a specific project from the left sidebar to dive into the task details.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`${stat.bg} ${stat.color} p-4 rounded-xl border group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={24} className="drop-shadow-[0_0_5px_currentColor]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-white font-display tracking-wide">{isLoading ? '-' : stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center mt-12 bg-white/5 border-dashed border-2 border-white/10 min-h-[300px]">
          <div className="w-20 h-20 bg-neon-blue/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
             <LayoutDashboard className="text-neon-blue" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 font-display tracking-tight">System Status Optimal</h3>
          <p className="text-slate-400 max-w-md">All remote nodes and AI subsystems are fully functional and synchronized with the latest directives.</p>
        </div>
      </div>
    </Layout>
  );
};
