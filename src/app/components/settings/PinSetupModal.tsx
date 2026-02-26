import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PinSetupModalProps {
  onClose: () => void;
}

export function PinSetupModal({ onClose }: PinSetupModalProps) {
  const { currentProfile, updateProfile } = useApp();
  const { isDark } = useTheme();
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

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${modalBg} w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Configurer le PIN</h2>
          </div>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
            <p className="text-sm text-cyan-400">
              Créez un code PIN à 4 chiffres pour protéger votre profil
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="pin" className={labelColor}>Nouveau PIN *</Label>
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
              className={`${inputBg} text-center text-2xl tracking-widest`}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="confirmPin" className={labelColor}>Confirmer le PIN *</Label>
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
              className={`${inputBg} text-center text-2xl tracking-widest`}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="outline" 
              className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white"
            >
              Activer le verrouillage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}