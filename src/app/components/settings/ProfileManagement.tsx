import React, { useState } from 'react';
import { ArrowLeft, Plus, Lock, Trash2, Edit } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddProfileModal } from './AddProfileModal';
import { copyToClipboardWithFeedback } from '../../utils/clipboard';

interface ProfileManagementProps {
  onBack: () => void;
}

export function ProfileManagement({ onBack }: ProfileManagementProps) {
  const { profiles, deleteProfile } = useApp();
  const { isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState<string | null>(null);

  // Filter out admin profiles (they don't appear in management)
  const userProfiles = profiles.filter(p => !p.isAdmin);

  const handleDeleteProfile = (id: string, name: string) => {
    if (confirm(`Supprimer le profil "${name}" ?`)) {
      deleteProfile(id);
    }
  };

  const copyPinToClipboard = async (pin: string | undefined, name: string) => {
    if (pin) {
      await copyToClipboardWithFeedback(
        pin,
        `Code PIN de ${name} copié : ${pin}`,
        `Code PIN de ${name} : ${pin}\n\n(Veuillez copier manuellement ce code)`
      );
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      <div className={`px-6 pt-12 pb-8 ${isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-white border-b border-gray-200'}`}>
        <button onClick={onBack} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors mb-6`}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestion des profils</h1>
        <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>{userProfiles.length} profil{userProfiles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-6 py-6 space-y-3">
        {userProfiles.map((profile) => (
          <Card key={profile.id} className={`p-4 ${isDark ? 'bg-[#12121a] border-white/5' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-2xl relative">
                {profile.avatar}
                {profile.isPinProtected && (
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${isDark ? 'bg-[#1a1a2e] border-[#0a0a0f]' : 'bg-gray-100 border-white'}`}>
                    <Lock className="w-3 h-3 text-cyan-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.firstName} {profile.lastName}</h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {profile.isPinProtected && (
                    <>
                      <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                        Protégé par PIN
                      </span>
                      {profile.pin && (
                        <button
                          onClick={() => copyPinToClipboard(profile.pin, profile.name)}
                          className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 transition-colors"
                        >
                          Code: {profile.pin}
                        </button>
                      )}
                    </>
                  )}
                  {!profile.isPinProtected && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                      Sans protection
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteProfile(profile.id, profile.name)}
                  className={`p-2 transition-colors ${isDark ? 'text-slate-400 hover:text-red-500' : 'text-gray-400 hover:text-red-500'}`}
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
          className="floating-action-button w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-xl"
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