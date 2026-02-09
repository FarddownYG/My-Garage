import React from 'react';
import { Car } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Chargement de vos données...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center z-50">
      <div className="text-center px-6">
        {/* Logo animé */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Cercle extérieur tournant */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-spin" 
               style={{ borderTopColor: 'rgb(59 130 246)', animationDuration: '1.5s' }} />
          
          {/* Cercle intérieur pulsant */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
          
          {/* Icône voiture */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Valcar
        </h2>
        <p className="text-zinc-400 text-lg mb-6">
          {message}
        </p>

        {/* Barre de progression animée */}
        <div className="w-64 h-2 mx-auto bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-loading-bar" />
        </div>

        {/* Points animés */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Info sécurité */}
        <div className="mt-8 text-xs text-zinc-600">
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
