import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AddProfileForm } from './AddProfileForm';
import { AdminLogin } from './AdminLogin';
import { Settings } from 'lucide-react';
import type { Profile } from '../../types';

interface WelcomeScreenProps {
  onProfileSelect: (profile: Profile) => void;
  onAdminAccess: () => void;
}

export function WelcomeScreen({ onProfileSelect, onAdminAccess }: WelcomeScreenProps) {
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with Admin Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <div className="w-10" /> {/* Spacer for centering */}
          <h1 className="font-semibold">Mes Profils</h1>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all"
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
            <h2 className="text-xl font-semibold mb-2">Bienvenue</h2>
            <p className="text-zinc-400 text-center mb-8">
              Créez votre premier profil pour commencer à gérer vos véhicules
            </p>
            <button
              onClick={() => setShowAddProfile(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-medium active:scale-95 transition-all"
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
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:bg-zinc-800 active:scale-95 transition-all flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-2xl">
                    {profile.avatar}
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{profile.firstName}</div>
                    <div className="text-sm text-zinc-400">{profile.lastName}</div>
                    {profile.isPinProtected && (
                      <div className="mt-1 text-xs text-blue-400 flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Protégé
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Add Profile Button */}
            <button
              onClick={() => setShowAddProfile(true)}
              className="w-full bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl p-6 hover:bg-zinc-800 hover:border-zinc-600 active:scale-95 transition-all flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="font-medium text-zinc-300">Ajouter un Profil</div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
