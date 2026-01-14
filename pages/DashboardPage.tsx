
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiClient';
import { Project, UserRole, CreateProjectDto } from '../types';
import { useAuth } from '../services/authStore';
import { Layout } from '../components/Layout';
import { Briefcase, CheckCircle2, AlertCircle, Clock, ChevronRight, Plus, FileText } from 'lucide-react';
import { NewProjectModal } from '../components/NewProjectModal';
import { generateAllProjectsReportPDF } from '../utils/pdfGenerator';

export const DashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Add a safeguard timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timed out - potential RLS loop')), 15000)
      );

      const data = await Promise.race([
        api.projects.list(),
        timeoutPromise
      ]) as Project[];
      
      setProjects(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      // If it's a timeout, it's likely the RLS recursion bug
      if (err.message?.includes('timed out')) {
          console.error('CRITICAL: Infinite recursion detected in RLS policies.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (data: CreateProjectDto) => {
    try {
      const newProject = await api.projects.create(data);
      setProjects([...projects, newProject]);
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    if (!currentUser || currentUser.role !== UserRole.OWNER) return;
    setIsGeneratingReport(true);
    try {
        const ownedProjects = projects.filter(p => p.ownerId === currentUser.id);
        
        // Fetch members for each project
        const data = await Promise.all(ownedProjects.map(async (project) => {
            const members = await api.projects.members(project.id);
            return { project, members };
        }));

        generateAllProjectsReportPDF(data);
    } catch (err) {
        console.error('Failed to generate report', err);
        alert('Failed to generate report');
    } finally {
        setIsGeneratingReport(false);
    }
  };

  const stats = [
    { name: 'Active Projects', value: projects.length, icon: Briefcase, color: 'text-neon-blue', bg: 'bg-neon-blue/10 border-neon-blue/30' },
    { name: 'Total Tasks', value: projects.reduce((acc, p) => acc + (p.stats?.totalTasks || 0), 0), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
    { name: 'Completed', value: projects.reduce((acc, p) => acc + (p.stats?.completedTasks || 0), 0), icon: Clock, color: 'text-neon-purple', bg: 'bg-neon-purple/10 border-neon-purple/30' },
    { name: 'Overdue', value: projects.reduce((acc, p) => acc + (p.stats?.overdueTasks || 0), 0), icon: AlertCircle, color: 'text-neon-pink', bg: 'bg-neon-pink/10 border-neon-pink/30' },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Project Overview</h2>
          <p className="text-slate-400 max-w-2xl">Track your team's progress across all active developments in the neural network.</p>
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
                <p className="text-2xl font-bold text-white font-display tracking-wide">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span className="w-1 h-6 bg-neon-blue rounded-full shadow-[0_0_10px_#00f3ff]"></span>
            Recent Projects
          </h3>
          {currentUser?.role === UserRole.OWNER && (
            <div className="flex items-center gap-3">
                <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 text-slate-300 rounded-lg hover:bg-white/5 hover:text-white hover:border-white/50 transition-all text-sm font-medium disabled:opacity-50"
                >
                    <FileText size={18} />
                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-blue/20 text-neon-blue border border-neon-blue/50 rounded-lg hover:bg-neon-blue/30 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all text-sm font-medium group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> New Project
                </button>
            </div>
          )}
        </div>

        <NewProjectModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProject}
        />

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
             [0, 1].map(i => <div key={i} className="h-56 glass-panel animate-pulse rounded-2xl bg-white/5"></div>)
          ) : projects.length === 0 ? (
            <div className="col-span-full py-16 text-center glass-panel rounded-3xl border border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Briefcase className="text-slate-500" size={32} />
              </div>
              <p className="text-slate-400 text-lg">No projects found in the system.</p>
              <p className="text-slate-600 text-sm mt-2">Initialize a new project to begin.</p>
            </div>
          ) : projects.map((project, index) => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="glass-panel p-6 rounded-2xl group hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(188,19,254,0.15)] transition-all duration-300 border-l-4 border-l-transparent hover:border-l-neon-purple relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ChevronRight className="text-neon-purple" size={24} />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-transparent rounded-2xl border border-white/10 flex items-center justify-center group-hover:border-neon-purple/50 transition-colors shadow-inner">
                  <Briefcase className="text-slate-400 group-hover:text-neon-purple transition-colors duration-300" size={24} />
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-white mb-2 font-display tracking-tight group-hover:text-neon-purple transition-colors">{project.name}</h4>
              <p className="text-sm text-slate-400 mb-8 line-clamp-2 h-10">{project.description}</p>
              
              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Progress</span>
                  <span className="text-white">{Math.round(((project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1)) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,243,255,0.5)]" 
                    style={{ width: `${(project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-4 pt-1 border-t border-white/5 mt-2">
                   <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-emerald-100">{project.stats?.completedTasks}</span> Done
                   </div>
                   <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                      <Clock size={14} className="text-blue-400" />
                      <span className="text-blue-100">{project.stats?.totalTasks}</span> Total
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};
