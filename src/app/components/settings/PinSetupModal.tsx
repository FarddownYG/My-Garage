import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PinSetupModalProps {
  onClose: () => void;
}

export function PinSetupModal({ onClose }: PinSetupModalProps) {
  const { currentProfile, updateProfile } = useApp();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProfile) return;

    // Validation
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('Le PIN doit contenir exactement 4 chiffres');
      return;
    }

    if (pin !== confirmPin) {
      setError('Les PINs ne correspondent pas');
      return;
    }

    try {
      await updateProfile(currentProfile.id, {
        isPinProtected: true,
        pin: pin
      });
      console.log('✅ PIN configuré avec succès');
      onClose();
    } catch (error) {
      console.error('❌ Erreur configuration PIN:', error);
      setError('Erreur lors de la configuration du PIN');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl text-white">Configurer le PIN</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              Créez un code PIN à 4 chiffres pour protéger votre profil
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="pin" className="text-zinc-400">Nouveau PIN *</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="4 chiffres"
              className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="confirmPin" className="text-zinc-400">Confirmer le PIN *</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="4 chiffres"
              className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="outline" 
              className="flex-1 bg-transparent border-zinc-700 text-zinc-400"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Activer le verrouillage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
