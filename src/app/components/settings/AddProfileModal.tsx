import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

interface AddProfileModalProps {
  onClose: () => void;
}

const avatars = ['👤', '👨', '👩', '👦', '👧', '🧑', '👴', '👵', '🚗', '🏍️', '🚙', '🚕', '🏎️', '🚌', '🛵', '🚲', '⚙️', '🔧', '🛠️', '💼', '🎯', '⭐', '🔥', '💎', '🎨', '🌟', '✨', '💫', '🌈'];

export function AddProfileModal({ onClose }: AddProfileModalProps) {
  const { addProfile } = useApp();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatar: '👤',
    isPinProtected: false,
    pin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation : seul le prénom est obligatoire
    if (!formData.firstName.trim()) {
      setError('❌ Le prénom est obligatoire');
      return;
    }
    
    if (formData.isPinProtected) {
      if (!formData.pin || formData.pin.length !== 4) {
        setError('Le PIN doit contenir 4 chiffres');
        return;
      }
      if (formData.pin !== formData.confirmPin) {
        setError('Les codes PIN ne correspondent pas');
        return;
      }
    }

    // Construire le nom complet (avec ou sans nom de famille)
    const name = formData.lastName.trim() 
      ? `${formData.firstName.trim()} ${formData.lastName.trim()}`
      : formData.firstName.trim();

    addProfile({
      id: Date.now().toString(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(), // Passer une chaîne vide, pas undefined
      name,
      avatar: formData.avatar,
      isPinProtected: formData.isPinProtected,
      pin: formData.isPinProtected ? formData.pin : undefined,
    });

    onClose();
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${modalBg} w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Nouveau profil</h2>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <Label className={`${labelColor} mb-3 block`}>Avatar</Label>
            <div className={`grid grid-cols-10 gap-2 rounded-lg p-3 max-h-48 overflow-y-auto ${cardBg}`}>
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    formData.avatar === avatar
                      ? 'bg-cyan-500 scale-110 shadow-lg'
                      : `${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} active:scale-95`
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="firstName" className={labelColor}>Prénom *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Ex: Marie"
              className={inputBg}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="lastName" className={labelColor}>
              Nom de famille <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>(facultatif)</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Ex: Dupont (optionnel)"
              className={inputBg}
            />
          </div>

          <div className={`flex items-center justify-between p-4 rounded-xl ${cardBg}`}>
            <div>
              <p className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Protection par PIN</p>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Sécuriser l'accès à ce profil</p>
            </div>
            <Switch
              checked={formData.isPinProtected}
              onCheckedChange={(checked) => setFormData({ ...formData, isPinProtected: checked })}
            />
          </div>

          {formData.isPinProtected && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin" className={labelColor}>PIN (4 chiffres) *</Label>
                <Input
                  id="pin"
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  className={`${inputBg} text-center tracking-widest`}
                />
              </div>
              <div>
                <Label htmlFor="confirmPin" className={labelColor}>Confirmer le PIN *</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  className={`${inputBg} text-center tracking-widest`}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white">
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}