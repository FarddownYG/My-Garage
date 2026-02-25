import React from 'react';
import { Car } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Chargement de vos données...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0e0e16] via-[#0a0a0f] to-[#0e0e16] flex items-center justify-center z-50">
      <div className="text-center px-6">
        {/* Logo animé */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Cercle extérieur tournant */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-spin" 
               style={{ borderTopColor: 'rgb(34 211 238)', animationDuration: '1.5s' }} />
          
          {/* Cercle intérieur pulsant */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 animate-pulse" />
          
          {/* Icône voiture */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Valcar
        </h2>
        <p className="text-slate-400 text-lg mb-6">
          {message}
        </p>

        {/* Barre de progression animée */}
        <div className="w-64 h-2 mx-auto bg-[#1a1a2e] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 animate-loading-bar" />
        </div>

        {/* Points animés */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Info sécurité */}
        <div className="mt-8 text-xs text-slate-600">
          Connexion sécurisée • Données cryptées
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}