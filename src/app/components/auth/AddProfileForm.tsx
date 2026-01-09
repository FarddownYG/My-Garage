import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Lock } from 'lucide-react';

interface AddProfileFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AVATAR_OPTIONS = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', '🧔', '👱‍♂️', '👱‍♀️', '🧑‍🦱'];

export function AddProfileForm({ onClose, onSuccess }: AddProfileFormProps) {
  const { addProfile } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (isPinProtected) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setError('Le code PIN doit contenir 4 chiffres');
        return;
      }
      if (pin !== confirmPin) {
        setError('Les codes PIN ne correspondent pas');
        return;
      }
    }

    // Create profile
    const newProfile = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      avatar: selectedAvatar,
      isPinProtected,
      pin: isPinProtected ? pin : undefined,
      isAdmin: false,
    };

    addProfile(newProfile);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">Nouveau Profil</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 pt-24 pb-12 px-6 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Avatar</label>
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ${
                    selectedAvatar === emoji
                      ? 'bg-blue-600 scale-110'
                      : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-zinc-400 mb-2">
              Prénom
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Jean"
              autoComplete="off"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-zinc-400 mb-2">
              Nom
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Dupont"
              autoComplete="off"
            />
          </div>

          {/* PIN Protection Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setIsPinProtected(!isPinProtected)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isPinProtected ? 'bg-blue-600' : 'bg-zinc-800'
                }`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Verrouillage par code PIN</div>
                  <div className="text-sm text-zinc-400">Protection facultative</div>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-all ${
                isPinProtected ? 'bg-blue-600' : 'bg-zinc-700'
              }`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  isPinProtected ? 'left-6' : 'left-1'
                }`} />
              </div>
            </button>
          </div>

          {/* PIN Input (if protected) */}
          {isPinProtected && (
            <div className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-zinc-400 mb-2">
                  Code PIN (4 chiffres)
                </label>
                <input
                  type="password"
                  id="pin"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium text-zinc-400 mb-2">
                  Confirmer le code PIN
                </label>
                <input
                  type="password"
                  id="confirmPin"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center tracking-widest"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl py-4 font-medium active:scale-95 transition-all"
          >
            Créer le Profil
          </button>
        </form>
      </div>
    </div>
  );
}
