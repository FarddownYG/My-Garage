import React, { useState } from 'react';
import { ArrowLeft, Plus, Lock, Trash2, Edit } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddProfileModal } from './AddProfileModal';

interface ProfileManagementProps {
  onBack: () => void;
}

export function ProfileManagement({ onBack }: ProfileManagementProps) {
  const { profiles, deleteProfile } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter out admin profiles (they don't appear in management)
  const userProfiles = profiles.filter(p => !p.isAdmin);

  const handleDeleteProfile = (id: string, name: string) => {
    if (confirm(`Supprimer le profil "${name}" ?`)) {
      deleteProfile(id);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl text-white mb-2">Gestion des profils</h1>
        <p className="text-zinc-500">{userProfiles.length} profil{userProfiles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-6 py-6 space-y-3">
        {userProfiles.map((profile) => (
          <Card key={profile.id} className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-2xl relative">
                {profile.avatar}
                {profile.isPinProtected && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-black">
                    <Lock className="w-3 h-3 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{profile.firstName} {profile.lastName}</h3>
                <div className="flex gap-2 mt-1">
                  {profile.isPinProtected && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      Protégé par PIN
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteProfile(profile.id, profile.name)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-28 right-6">
        <Button
          onClick={() => setShowAddModal(true)}
          className="floating-action-button w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {showAddModal && (
        <AddProfileModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}