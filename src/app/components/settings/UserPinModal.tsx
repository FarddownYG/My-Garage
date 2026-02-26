import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Profile } from '../../types';

interface UserPinModalProps {
  profile: Profile;
  onClose: () => void;
}

export function UserPinModal({ profile, onClose }: UserPinModalProps) {
  const { updateProfile } = useApp();
  const { isDark } = useTheme();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Vérifier que le PIN actuel est correct
    if (currentPin !== profile.pin) {
      setError('❌ Code PIN actuel incorrect');
      return;
    }

    // Vérifier que le nouveau PIN a 4 chiffres
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('❌ Le nouveau code doit contenir exactement 4 chiffres');
      return;
    }

    // Vérifier que les deux nouveaux PINs correspondent
    if (newPin !== confirmPin) {
      setError('❌ Les codes ne correspondent pas');
      return;
    }

    // Vérifier que le nouveau PIN est différent de l'ancien
    if (newPin === currentPin) {
      setError('❌ Le nouveau code doit être différent de l\'ancien');
      return;
    }

    // Mettre à jour le profil avec le nouveau PIN
    updateProfile(profile.id, { pin: newPin });
    alert('✅ Code PIN modifié avec succès !');
    onClose();
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const eyeBtn = isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${modalBg} w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Modifier le code PIN</h2>
          </div>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-sm text-cyan-400">
              Vous allez modifier votre code PIN de connexion. Assurez-vous de bien mémoriser le nouveau code.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Code PIN actuel */}
          <div>
            <Label htmlFor="currentPin" className={labelColor}>Code PIN actuel *</Label>
            <div className="relative">
              <Input
                id="currentPin"
                type={showCurrentPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`${inputBg} pr-12 text-center text-2xl tracking-widest`}
                maxLength={4}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtn} transition-colors`}
              >
                {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nouveau code PIN */}
          <div>
            <Label htmlFor="newPin" className={labelColor}>Nouveau code PIN *</Label>
            <div className="relative">
              <Input
                id="newPin"
                type={showNewPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`${inputBg} pr-12 text-center text-2xl tracking-widest`}
                maxLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtn} transition-colors`}
              >
                {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>4 chiffres uniquement</p>
          </div>

          {/* Confirmer le nouveau code PIN */}
          <div>
            <Label htmlFor="confirmPin" className={labelColor}>Confirmer le nouveau code *</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className={`${inputBg} pr-12 text-center text-2xl tracking-widest`}
                maxLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtn} transition-colors`}
              >
                {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white"
              disabled={!currentPin || !newPin || !confirmPin || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
            >
              Modifier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}