
import React from 'react';
import { useAuth } from '../services/authStore';
import { Layout } from '../components/Layout';
import { User as UserIcon, Mail, Shield, LogOut, Camera } from 'lucide-react';
import { Badge } from '../components/Badge';
import { api } from '../services/apiClient';
import { useState } from 'react';

export const ProfilePage: React.FC = () => {
  const { user, logout, checkAuth } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await api.profiles.uploadAvatar(file);
      await checkAuth();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">My Profile</h2>
          <p className="text-slate-400 mt-1">Manage your account settings and personal information.</p>
        </div>

        <div className="glass-panel rounded-2xl border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-neon-blue/20 via-purple-600/20 to-neon-pink/20 relative">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          </div>
          <div className="px-8 pb-8">
             <div className="relative -mt-16 mb-6 group inline-block">
                <div className="absolute inset-0 bg-neon-blue blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                <img 
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}&background=00f3ff&color=000`} 
                  className="w-32 h-32 rounded-2xl border-4 border-[#0f1020] shadow-2xl object-cover relative z-10" 
                  alt="Profile" 
                />
                <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm border-4 border-transparent">
                  {isUploading ? (
                    <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                        <Camera size={24} className="text-neon-blue" />
                        <span className="text-xs font-bold uppercase tracking-wider">Change</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                </label>
             </div>
             
             <div className="space-y-8">
                <div>
                   <h3 className="text-2xl font-bold text-white font-display tracking-tight">{user?.name}</h3>
                   <div className="mt-2 flex items-center gap-3">
                      <Badge type="role" value={user?.role || 'DEVELOPER'} />
                      <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">ID: {user?.id?.substring(0,8)}</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                   <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue group-hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all duration-300">
                         <Mail size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                         <p className="text-sm font-medium text-white group-hover:text-neon-blue transition-colors">{user?.email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple group-hover:shadow-[0_0_15px_rgba(188,19,254,0.3)] transition-all duration-300">
                         <Shield size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Security Level</p>
                         <p className="text-sm font-medium text-white group-hover:text-neon-purple transition-colors">{user?.role} Access</p>
                      </div>
                   </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                   <button className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10 transition-all active:scale-95 flex-1 sm:flex-none text-center">
                      Edit Profile
                   </button>
                   <button 
                    onClick={logout}
                    className="px-6 py-3 bg-rose-500/10 text-rose-400 font-bold rounded-xl border border-rose-500/30 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(251,113,133,0.2)] transition-all flex items-center justify-center gap-2 active:scale-95 sm:ml-auto"
                   >
                      <LogOut size={18} />
                      Terminate Session
                   </button>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-6 flex items-start gap-4 backdrop-blur-sm">
           <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Shield size={20} />
           </div>
           <div>
              <h4 className="text-sm font-bold text-amber-500 mb-1 font-display tracking-wide">Security Protocol</h4>
              <p className="text-sm text-slate-400 leading-relaxed">Your account is currently using standard password authentication. For enhanced security, consider enabling Two-Factor Authentication (2FA).</p>
           </div>
        </div>
      </div>
    </Layout>
  );
};
