import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/apiClient";
import { Project } from "../types";
import { Layout } from "../components/Layout";
import { Briefcase, CheckCircle2, AlertCircle, Clock, LayoutDashboard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

  // Data for Project Progress Bar Chart
  const projectProgressData = projects.slice(0, 5).map((project) => {
    const total = project.stats?.totalTasks || 1;
    const completed = project.stats?.completedTasks || 0;
    return {
      name: project.name.length > 15 ? project.name.slice(0, 15) + "..." : project.name,
      completed: completed,
      total: total,
      progress: Math.round((completed / total) * 100),
    };
  });

  // Data for Task Status Pie Chart
  const taskStatusData = [
    { name: "Completed", value: projects.reduce((acc, p) => acc + (p.stats?.completedTasks || 0), 0), color: "#10b981" },
    { name: "In Progress", value: projects.reduce((acc, p) => acc + Math.max(0, (p.stats?.totalTasks || 0) - (p.stats?.completedTasks || 0) - (p.stats?.overdueTasks || 0)), 0), color: "#06b6d4" },
    { name: "Overdue", value: projects.reduce((acc, p) => acc + (p.stats?.overdueTasks || 0), 0), color: "#f43f5e" },
  ].filter((item) => item.value > 0);

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
                <p className="text-2xl font-bold text-white font-display tracking-wide">{isLoading ? "-" : stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress Bar Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6 font-display tracking-tight">Project Progress</h3>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} />
                    <Bar dataKey="progress" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Progress (%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Task Status Pie Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-6 font-display tracking-tight">Task Status</h3>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {!isLoading && (
              <div className="flex justify-center gap-6 mt-4">
                {taskStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
