import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">Nouveau profil</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <Label className="text-zinc-400 mb-3 block">Avatar</Label>
            <div className="grid grid-cols-10 gap-2 bg-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                    formData.avatar === avatar
                      ? 'bg-blue-600 scale-110 shadow-lg'
                      : 'bg-zinc-700 hover:bg-zinc-600 active:scale-95'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="firstName" className="text-zinc-400">Prénom *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Ex: Marie"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-zinc-400">
              Nom de famille <span className="text-zinc-600 text-xs">(facultatif)</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Ex: Dupont (optionnel)"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
            <div>
              <p className="text-white mb-1">Protection par PIN</p>
              <p className="text-sm text-zinc-500">Sécuriser l'accès à ce profil</p>
            </div>
            <Switch
              checked={formData.isPinProtected}
              onCheckedChange={(checked) => setFormData({ ...formData, isPinProtected: checked })}
            />
          </div>

          {formData.isPinProtected && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin" className="text-zinc-400">PIN (4 chiffres) *</Label>
                <Input
                  id="pin"
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  className="bg-zinc-800 border-zinc-700 text-white text-center tracking-widest"
                />
              </div>
              <div>
                <Label htmlFor="confirmPin" className="text-zinc-400">Confirmer le PIN *</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  className="bg-zinc-800 border-zinc-700 text-white text-center tracking-widest"
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
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}