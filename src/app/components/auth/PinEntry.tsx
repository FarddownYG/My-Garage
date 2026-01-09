import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Profile } from '../../types';

interface PinEntryProps {
  profile: Profile;
  onSuccess: () => void;
  onBack: () => void;
}

export function PinEntry({ profile, onSuccess, onBack }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === profile.pin) {
            onSuccess();
          } else {
            setError(true);
            setTimeout(() => {
              setError(false);
              setPin('');
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm text-center mb-12">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-5xl border-2 border-zinc-700 mx-auto mb-6">
          {profile.avatar}
        </div>
        <h2 className="text-2xl text-white mb-2">{profile.name}</h2>
        <p className="text-zinc-500">Entrez votre PIN</p>
      </div>

      <div className={`flex gap-4 mb-12 transition-all ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              pin.length > i
                ? error
                  ? 'bg-red-500'
                  : 'bg-blue-500'
                : 'bg-zinc-800 border border-zinc-700'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="w-full aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-white text-2xl"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleNumberClick('0')}
          className="w-full aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-white text-2xl"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-full aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 text-white text-xl"
        >
          ⌫
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-6">PIN incorrect</p>
      )}
    </div>
  );
}
