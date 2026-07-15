import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/apiClient";
import { Project, User, UserRole, Meeting } from "../types";
import { useAuth } from "../services/authStore";
import { Layout } from "../components/Layout";
import { Users, Briefcase, Calendar, Shield, Trash2, Loader2, ChevronRight, CheckCircle2, Clock } from "lucide-react";

type ActiveTab = "users" | "projects" | "meetings";

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const didInitialFetch = useRef(false);

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [usersData, projectsData, meetingsData] = await Promise.all([api.admin.getAllUsers(), api.admin.getAllProjects(), api.admin.getAllMeetings()]);
      setUsers(usersData);
      setProjects(projectsData);
      setMeetings(meetingsData);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      api.admin.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error("Failed to update user role", err);
      alert("Failed to update user role");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.admin.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error("Failed to delete project", err);
      alert("Failed to delete project");
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await api.admin.deleteMeeting(meetingId);
      setMeetings(meetings.filter((m) => m.id !== meetingId));
    } catch (err) {
      console.error("Failed to delete meeting", err);
      alert("Failed to delete meeting");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.admin.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user");
    }
  };

  const isAdmin = currentUser?.role === UserRole.OWNER || currentUser?.role === UserRole.ADMIN;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Admin Dashboard</h2>
          <p className="text-slate-400 max-w-2xl">Manage all users, projects, and meetings across the platform.</p>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 w-fit backdrop-blur-sm mx-auto lg:mx-0 overflow-x-auto">
          {[
            { id: "users" as ActiveTab, label: "Users", icon: Users },
            { id: "projects" as ActiveTab, label: "Projects", icon: Briefcase },
            { id: "meetings" as ActiveTab, label: "Meetings", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id ? "bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]" : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "users" && (
          <div className="glass-panel rounded-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <Shield size={20} className="text-neon-purple" />
                All Users
              </h3>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Loading users...
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} className="w-12 h-12 rounded-full border border-white/10" alt="" />
                      <div>
                        <p className="text-sm font-bold text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserRole)}
                        className="bg-black/20 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neon-blue"
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              [0, 1].map((i) => <div key={i} className="h-56 glass-panel animate-pulse rounded-2xl bg-white/5"></div>)
            ) : projects.length === 0 ? (
              <div className="col-span-full py-16 text-center glass-panel rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="text-slate-500" size={32} />
                </div>
                <p className="text-slate-400 text-lg">No projects in the system.</p>
              </div>
            ) : (
              projects.map((project, index) => (
                <div key={project.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-neon-purple relative overflow-hidden" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex justify-between items-start mb-6">
                    <Link to={`/projects/${project.id}`} className="w-14 h-14 bg-gradient-to-br from-white/10 to-transparent rounded-2xl border border-white/10 flex items-center justify-center hover:border-neon-purple/50 transition-colors">
                      <Briefcase className="text-slate-400 hover:text-neon-purple" size={24} />
                    </Link>
                    <button onClick={() => handleDeleteProject(project.id)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <Link to={`/projects/${project.id}`}>
                    <h4 className="text-xl font-bold text-white mb-2 font-display tracking-tight hover:text-neon-purple transition-colors">{project.name}</h4>
                  </Link>
                  <p className="text-sm text-slate-400 mb-8 line-clamp-2 h-10">{project.description}</p>
                  <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Progress</span>
                      <span className="text-white">{Math.round(((project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full" style={{ width: `${((project.stats?.completedTasks || 0) / (project.stats?.totalTasks || 1)) * 100}%` }}></div>
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
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="glass-panel rounded-2xl border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <Calendar size={20} className="text-neon-blue" />
                All Meetings
              </h3>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Loading meetings...
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neon-blue/10 rounded-2xl border border-neon-blue/20 flex items-center justify-center">
                        <Calendar className="text-neon-blue" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{meeting.title}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(meeting.meetingDate).toLocaleDateString()} at {new Date(meeting.meetingDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDeleteMeeting(meeting.id)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
