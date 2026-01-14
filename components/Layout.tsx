
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authStore';
import { api } from '../services/apiClient';
import { Project, Task } from '../types';
import { 
  LayoutDashboard, 
  FolderKanban, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Bell,
  Search
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ projects: Project[], tasks: Task[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced Search Effect
  React.useEffect(() => {
      if (searchQuery.length < 2) {
          setSearchResults(null);
          return;
      }

      const timeoutId = setTimeout(async () => {
          setIsSearching(true);
          try {
              const results = await api.search.global(searchQuery);
              setSearchResults(results);
          } catch (error) {
              console.error('Search failed:', error);
          } finally {
              setIsSearching(false);
              setShowResults(true);
          }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile', icon: UserIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex text-slate-200 font-sans">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r-0 border-white/10 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-surface/95 lg:bg-glass`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-md shadow-[0_0_8px_rgba(0,243,255,0.4)]" />
              <span className="text-xl font-bold text-white tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Bitspace</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/10 border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'animate-pulse-glow' : ''} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-lg bg-surface border border-white/5">
              <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}&background=00f3ff&color=000`} className="w-8 h-8 rounded-full border border-neon-blue/50" alt="User" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/50 border border-transparent rounded-lg transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 glass-panel border-b-0 m-4 mb-0 rounded-xl flex items-center justify-between px-4 lg:px-6 sticky top-4 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-surface/50 px-3 py-2 rounded-lg border border-white/10 focus-within:border-neon-purple/50 focus-within:shadow-[0_0_10px_rgba(188,19,254,0.2)] transition-all w-full max-w-md relative">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects or tasks..." 
                className="bg-transparent text-sm border-none focus:ring-0 outline-none w-full text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length === 0) {
                        setSearchResults(null);
                        setShowResults(false);
                    }
                }}
                onFocus={() => setShowResults(true)}
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchQuery.length > 1 && (searchResults || isSearching) && (
                  <div className="absolute top-full left-0 right-0 mt-3 glass-panel bg-[#0f1020] rounded-xl border border-white/10 py-2 z-50 max-h-96 overflow-y-auto shadow-2xl animate-fade-in">
                      {isSearching ? (
                          <div className="p-4 text-center text-slate-400 text-sm animate-pulse">Searching vector database...</div>
                      ) : (
                          <>
                              {(!searchResults?.projects.length && !searchResults?.tasks.length) ? (
                                  <div className="p-4 text-center text-slate-500 text-sm">No signals found.</div>
                              ) : (
                                  <>
                                    {searchResults.projects.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-1 text-xs font-semibold text-neon-blue uppercase tracking-wider mb-1">Projects</div>
                                            {searchResults.projects.map(project => (
                                                <button 
                                                    key={project.id}
                                                    onClick={() => {
                                                        navigate(`/project/${project.id}`);
                                                        setShowResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 transition-colors border-l-2 border-transparent hover:border-neon-blue"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
                                                        <FolderKanban size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{project.name}</div>
                                                        <div className="text-xs text-slate-400 truncate max-w-[200px]">{project.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {searchResults.tasks.length > 0 && (
                                        <div>
                                            <div className="px-4 py-1 text-xs font-semibold text-neon-purple uppercase tracking-wider mb-1">Tasks</div>
                                            {searchResults.tasks.map(task => (
                                                <button 
                                                    key={task.id}
                                                    onClick={() => {
                                                        navigate(`/projects/${task.projectId}`);
                                                        setShowResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 transition-colors border-l-2 border-transparent hover:border-neon-purple"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                                        task.priority === 'HIGH' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                                        task.priority === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                    }`}>
                                                        <LayoutDashboard size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{task.title}</div>
                                                        <div className="text-xs text-slate-400">In Project #{task.projectId.substring(0,6)}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                  </>
                              )}
                          </>
                      )}
                  </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            <button className="p-2 text-slate-400 hover:text-neon-pink hover:bg-white/5 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_5px_#ff00ff]"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};
