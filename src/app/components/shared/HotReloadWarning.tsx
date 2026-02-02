import { RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

/**
 * Composant affiché quand le hot-reload casse le Context React
 * Solution : CTRL + SHIFT + R
 */
export function HotReloadWarning() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-8">
        {/* Icon */}
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-10 h-10 text-yellow-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white text-center mb-4">
          Rechargement requis
        </h1>

        {/* Description */}
        <div className="space-y-3 mb-6">
          <p className="text-zinc-400 text-center text-sm">
            Le hot-reload de développement a temporairement cassé le Context React.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400 mb-2">
              <strong>Solution :</strong>
            </p>
            <p className="text-sm text-zinc-300">
              Appuyez sur <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">CTRL</kbd> + <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">SHIFT</kbd> + <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">R</kbd>
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              (ou <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">⌘</kbd> + <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">⇧</kbd> + <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono">R</kbd> sur Mac)
            </p>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Cette erreur est normale en développement et n'apparaît pas en production.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleRefresh}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recharger maintenant
        </Button>
      </Card>
    </div>
  );
}
