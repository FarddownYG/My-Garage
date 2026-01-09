import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const { adminPin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === adminPin) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 rounded-full mb-6">
            <Lock className="w-10 h-10 text-zinc-400" />
          </div>
          <h1 className="text-3xl text-white mb-2">Valcar</h1>
          <p className="text-zinc-500">Gestion de véhicules personnelle</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-pin" className="block text-sm text-zinc-400 mb-2">
              PIN Administrateur
            </label>
            <Input
              id="admin-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Entrez votre PIN"
              className={`bg-zinc-900 border-zinc-800 text-white text-center tracking-widest ${
                error ? 'border-red-500 animate-shake' : ''
              }`}
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">PIN incorrect</p>
            )}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Se connecter
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">PIN par défaut : 1234</p>
        </div>
      </div>
    </div>
  );
}
