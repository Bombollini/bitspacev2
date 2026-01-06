
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
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
          <p className="text-slate-500">Manage your account settings and personal information.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="px-8 pb-8">
             <div className="relative -mt-12 mb-6 group inline-block">
                <img 
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name}`} 
                  className="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover" 
                  alt="Profile" 
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera size={24} />
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                </label>
             </div>
             
             <div className="space-y-6">
                <div>
                   <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
                   <div className="mt-1">
                      <Badge type="role" value={user?.role || 'DEVELOPER'} />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Mail size={18} />
                      </div>
                      <div>
                         <p className="text-xs font-semibold text-slate-400 uppercase">Email Address</p>
                         <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Shield size={18} />
                      </div>
                      <div>
                         <p className="text-xs font-semibold text-slate-400 uppercase">Current Role</p>
                         <p className="text-sm font-medium text-slate-900">{user?.role}</p>
                      </div>
                   </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                   <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      Edit Profile
                   </button>
                   <button 
                    onClick={logout}
                    className="px-6 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                   >
                      <LogOut size={18} />
                      Log Out
                   </button>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 flex items-start gap-4">
           <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Shield size={20} />
           </div>
           <div>
              <h4 className="text-sm font-bold text-amber-900 mb-1">Security Notice</h4>
              <p className="text-sm text-amber-700">Your account is currently using standard password authentication. For better security, consider enabling Two-Factor Authentication (2FA).</p>
           </div>
        </div>
      </div>
    </Layout>
  );
};
