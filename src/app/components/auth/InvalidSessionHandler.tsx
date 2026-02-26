import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

/**
 * Gestionnaire d'erreurs de session invalide
 * Affiche un message convivial et nettoie la session
 */
export function InvalidSessionHandler() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Compte à rebours avant rechargement automatique
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#12121a]/80 backdrop-blur-xl border-white/[0.06] p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Session expirée
        </h1>

        {/* Message */}
        <p className="text-slate-400 mb-6">
          Votre session a expiré. Reconnexion en cours...
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-500">{countdown}</span>
          </div>
        </div>

        {/* Button */}
        <Button
          onClick={handleReload}
          className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400"
        >
          Recharger maintenant
        </Button>

        {/* Info */}
        <p className="text-slate-500 text-sm mt-4">
          Vous serez redirigé vers l'écran de connexion
        </p>
      </Card>
    </div>
  );
}