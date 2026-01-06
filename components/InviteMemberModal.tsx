import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/apiClient';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentMembers: User[];
  onInvite: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  currentMembers,
  onInvite
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isOpen) {
        loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
      setIsSearching(true);
      try {
        const results = await api.profiles.search('');
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
  };

  const filteredUsers = searchResults.filter(u => {
      if (currentMembers.find(m => m.id === u.id)) return false;
      if (!query) return true;
      const lowerQuery = query.toLowerCase();
      return u.name.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery);
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      // Default to EDITOR role as per schema (OWNER, EDITOR, VIEWER)
      await api.projects.addMember(projectId, selectedUser.id, 'EDITOR');
      onInvite();
      onClose();
      // Reset state
      setQuery('');
      setSearchResults([]);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert('Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Invite Member</h3>
            <p className="text-xs text-slate-500 mt-1">Select a user to add to this project</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={query}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
            {isSearching ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading users...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                      : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                      alt="" 
                      className="w-10 h-10 rounded-full bg-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  {selectedUser?.id === user.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))
            ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                    No users found matching "{query}"
                </div>
            )}
          </div>

          {/* Submit */}
          {selectedUser && (
            <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-bottom-2 fade-in">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <UserPlus size={18} />
                        Add Member
                    </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
