
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
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
              <span className="text-xl font-bold text-white tracking-tight">SoftHouse</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 mb-4">
              <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-8 h-8 rounded-full" alt="User" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500">
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 relative">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search projects or tasks..." 
                className="bg-transparent text-sm border-none focus:ring-0 outline-none w-64"
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
                      {isSearching ? (
                          <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                      ) : (
                          <>
                              {(!searchResults?.projects.length && !searchResults?.tasks.length) ? (
                                  <div className="p-4 text-center text-slate-500 text-sm">No results found.</div>
                              ) : (
                                  <>
                                    {searchResults.projects.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</div>
                                            {searchResults.projects.map(project => (
                                                <button 
                                                    key={project.id}
                                                    onClick={() => {
                                                        navigate(`/project/${project.id}`);
                                                        setShowResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <FolderKanban size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{project.name}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{project.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {searchResults.tasks.length > 0 && (
                                        <div>
                                            <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasks</div>
                                            {searchResults.tasks.map(task => (
                                                <button 
                                                    key={task.id}
                                                    onClick={() => {
                                                        navigate(`/projects/${task.projectId}`);
                                                        setShowResults(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                        task.priority === 'HIGH' ? 'bg-rose-100 text-rose-600' :
                                                        task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        <LayoutDashboard size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{task.title}</div>
                                                        <div className="text-xs text-slate-500">In Project #{task.projectId.substring(0,6)}</div>
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
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
