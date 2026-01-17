import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl text-white">Modifier mon profil</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
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
            <Label className="text-zinc-400 mb-3 block">Avatar</Label>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-3xl">
                {avatar}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Sélectionnez un emoji</p>
                <p className="text-sm text-zinc-500">Choisissez votre avatar</p>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-2 bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    avatar === emoji 
                      ? 'bg-blue-600 scale-110 shadow-lg' 
                      : 'bg-zinc-700 hover:bg-zinc-600 active:scale-95'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Prénom */}
          <div>
            <Label htmlFor="firstName" className="text-zinc-400">Prénom *</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
              autoFocus
            />
          </div>

          {/* Nom de famille */}
          <div>
            <Label htmlFor="lastName" className="text-zinc-400">
              Nom de famille <span className="text-zinc-600 text-xs">(facultatif)</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom (optionnel)"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Aperçu */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2">APERÇU</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-xl">
                {avatar}
              </div>
              <div>
                <p className="text-white font-medium">
                  {firstName.trim() || 'Prénom'} {lastName.trim()}
                </p>
                <p className="text-sm text-zinc-500">
                  {lastName.trim() ? `${firstName.trim()} ${lastName.trim()}` : firstName.trim() || 'Votre nom complet'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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