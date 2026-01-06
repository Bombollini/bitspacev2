
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/apiClient';
import { Project, UserRole } from '../types';
import { useAuth } from '../services/authStore';
import { Layout } from '../components/Layout';
import { Briefcase, CheckCircle2, AlertCircle, Clock, ChevronRight, Plus } from 'lucide-react';
import { NewProjectModal } from '../components/NewProjectModal';

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
        setTimeout(() => reject(new Error('Fetch timed out - potential RLS loop')), 5000)
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

  const stats = [
    { name: 'Active Projects', value: projects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Total Tasks', value: projects.reduce((acc, p) => acc + (p.stats?.totalTasks || 0), 0), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Completed', value: projects.reduce((acc, p) => acc + (p.stats?.completedTasks || 0), 0), icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Overdue', value: projects.reduce((acc, p) => acc + (p.stats?.overdueTasks || 0), 0), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Overview</h2>
          <p className="text-slate-500">Track your team's progress across all active developments.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Recent Projects</h3>
          {currentUser?.role === UserRole.OWNER && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                <Plus size={18} /> New Project
            </button>
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
             [1,2].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-2xl"></div>)
          ) : projects.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">No projects found. Start by creating one!</p>
            </div>
          ) : projects.map(project => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <Briefcase className="text-slate-400 group-hover:text-blue-600 transition-colors" size={24} />
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-600" size={20} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{project.name}</h4>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{project.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>Progress</span>
                  <span>{Math.round(((project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                    style={{ width: `${(project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1) * 100}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                   <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {project.stats?.completedTasks} Done
                   </div>
                   <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock size={12} className="text-blue-500" />
                      {project.stats?.totalTasks} Total
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
