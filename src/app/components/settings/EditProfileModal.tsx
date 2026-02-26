import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Profile } from '../../types';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👴', '👵', '🚗', '🏎️', '🚙', '🚕', '🚌', '🏍️', '🛵', '🚲', '⚙️', '🔧', '🛠️', '💼', '🎯', '⭐', '🔥', '💎', '🎨', '🌟', '✨', '💫', '🌈'];

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const { updateProfile } = useApp();
  const { isDark } = useTheme();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [avatar, setAvatar] = useState(profile.avatar);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation : prénom obligatoire
    if (!firstName.trim()) {
      setError('❌ Le prénom est obligatoire');
      return;
    }

    // Construction du nom complet
    const name = lastName.trim() 
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    // Mise à jour du profil
    updateProfile(profile.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim() || '',  // Passer une chaîne vide au lieu d'undefined
      name,
      avatar
    });

    alert('✅ Profil modifié avec succès !');
    onClose();
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${modalBg} w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Modifier mon profil</h2>
          </div>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Avatar */}
          <div>
            <Label className={`${labelColor} mb-3 block`}>Avatar</Label>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-3xl">
                {avatar}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Sélectionnez un emoji</p>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Choisissez votre avatar</p>
              </div>
            </div>
            <div className={`grid grid-cols-10 gap-2 rounded-lg p-3 max-h-48 overflow-y-auto ${cardBg}`}>
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    avatar === emoji 
                      ? 'bg-cyan-500 scale-110 shadow-lg' 
                      : `${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} active:scale-95`
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Prénom */}
          <div>
            <Label htmlFor="firstName" className={labelColor}>Prénom *</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              className={inputBg}
              required
              autoFocus
            />
          </div>

          {/* Nom de famille */}
          <div>
            <Label htmlFor="lastName" className={labelColor}>
              Nom de famille <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>(facultatif)</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom (optionnel)"
              className={inputBg}
            />
          </div>

          {/* Aperçu */}
          <div className={`${cardBg} rounded-lg p-4 border ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
            <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>APERÇU</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xl">
                {avatar}
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {firstName.trim() || 'Prénom'} {lastName.trim()}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                  {lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim() || 'Votre nom complet'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white"
              disabled={!firstName.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}