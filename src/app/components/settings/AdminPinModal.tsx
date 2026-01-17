import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AdminPinModalProps {
  onClose: () => void;
}

export function AdminPinModal({ onClose }: AdminPinModalProps) {
  const { adminPin, updateAdminPin } = useApp();
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.currentPin !== adminPin) {
      setError('❌ PIN actuel incorrect');
      return;
    }

    if (formData.newPin.length !== 4) {
      setError('❌ Le nouveau PIN doit contenir 4 chiffres');
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      setError('❌ Les PINs ne correspondent pas');
      return;
    }

    try {
      await updateAdminPin(formData.newPin);
      alert('✅ PIN administrateur modifié avec succès !');
      onClose();
    } catch (error) {
      setError('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
      console.error('Erreur modification PIN:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl text-white">Modifier le PIN admin</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="currentPin" className="text-zinc-400">PIN actuel *</Label>
            <Input
              id="currentPin"
              type="password"
              value={formData.currentPin}
              onChange={(e) => setFormData({ ...formData, currentPin: e.target.value })}
              placeholder="••••"
              maxLength={6}
              className="bg-zinc-800 border-zinc-700 text-white text-center tracking-widest"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="newPin" className="text-zinc-400">Nouveau PIN (4 chiffres) *</Label>
            <Input
              id="newPin"
              type="password"
              value={formData.newPin}
              onChange={(e) => setFormData({ ...formData, newPin: e.target.value })}
              placeholder="••••"
              maxLength={4}
              pattern="[0-9]{4}"
              className="bg-zinc-800 border-zinc-700 text-white text-center tracking-widest"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPin" className="text-zinc-400">Confirmer le nouveau PIN *</Label>
            <Input
              id="confirmPin"
              type="password"
              value={formData.confirmPin}
              onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
              placeholder="••••"
              maxLength={4}
              pattern="[0-9]{4}"
              className="bg-zinc-800 border-zinc-700 text-white text-center tracking-widest"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Modifier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}