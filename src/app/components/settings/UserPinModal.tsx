import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl text-white">Modifier le code PIN</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              🔐 Vous allez modifier votre code PIN de connexion. Assurez-vous de bien mémoriser le nouveau code.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Code PIN actuel */}
          <div>
            <Label htmlFor="currentPin" className="text-zinc-400">Code PIN actuel *</Label>
            <div className="relative">
              <Input
                id="currentPin"
                type={showCurrentPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="bg-zinc-800 border-zinc-700 text-white pr-12 text-center text-2xl tracking-widest"
                maxLength={4}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Nouveau code PIN */}
          <div>
            <Label htmlFor="newPin" className="text-zinc-400">Nouveau code PIN *</Label>
            <div className="relative">
              <Input
                id="newPin"
                type={showNewPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="bg-zinc-800 border-zinc-700 text-white pr-12 text-center text-2xl tracking-widest"
                maxLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">4 chiffres uniquement</p>
          </div>

          {/* Confirmer le nouveau code PIN */}
          <div>
            <Label htmlFor="confirmPin" className="text-zinc-400">Confirmer le nouveau code *</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="bg-zinc-800 border-zinc-700 text-white pr-12 text-center text-2xl tracking-widest"
                maxLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
