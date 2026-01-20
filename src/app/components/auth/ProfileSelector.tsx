import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AddProfileForm } from './AddProfileForm';
import { AdminLogin } from './AdminLogin';
import { Settings, ArrowLeft } from 'lucide-react';
import type { Profile } from '../../types';

interface ProfileSelectorProps {
  onProfileSelect: (profile: Profile) => void;
  onAdminAccess: () => void;
}

export function ProfileSelector({ onProfileSelect, onAdminAccess }: ProfileSelectorProps) {
  const { profiles } = useApp();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Filter out admin profile
  const userProfiles = profiles.filter(p => !p.isAdmin);

  const handleAdminSuccess = () => {
    setShowAdminLogin(false);
    onAdminAccess();
  };

  const handleProfileAdded = () => {
    setShowAddProfile(false);
  };

  if (showAdminLogin) {
    return <AdminLogin onSuccess={handleAdminSuccess} />;
  }

  if (showAddProfile) {
    return <AddProfileForm onClose={() => setShowAddProfile(false)} onSuccess={handleProfileAdded} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col animate-fade-in">
      {/* Header with Admin Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 shadow-lg">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <div className="w-10" /> {/* Spacer for centering */}
          <h1 className="font-semibold">Sélectionner un Profil</h1>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 backdrop-blur-sm"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-12 px-6 max-w-md mx-auto w-full">
        {userProfiles.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center mb-6">
              <span className="text-5xl">👤</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Aucun profil</h2>
            <p className="text-zinc-400 text-center mb-8">
              Créez votre premier profil pour commencer
            </p>
            <button
              onClick={() => setShowAddProfile(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-medium active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              Ajouter un Profil
            </button>
          </div>
        ) : (
          /* Profile List */
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {userProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => onProfileSelect(profile)}
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700/50 active:scale-95 transition-all flex flex-col items-center gap-3 relative overflow-hidden group"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                    {profile.avatar}
                  </div>
                  
                  <div className="text-center relative">
                    <div className="font-medium">{profile.firstName}</div>
                    <div className="text-sm text-zinc-400">{profile.lastName}</div>
                    {profile.isPinProtected && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-blue-400 font-medium">Protégé</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Add Profile Button */}
            <button
              onClick={() => setShowAddProfile(true)}
              className="w-full bg-zinc-900/50 backdrop-blur-xl border-2 border-dashed border-zinc-700/50 rounded-2xl p-6 hover:bg-zinc-800/50 hover:border-zinc-600/50 active:scale-95 transition-all flex flex-col items-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              
              <div className="font-medium text-zinc-300 relative">Ajouter un Profil</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}