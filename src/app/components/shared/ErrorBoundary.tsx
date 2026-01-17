import React, { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ErrorBoundary a capturé une erreur:', error, errorInfo);
  }

  handleReload = () => {
    // Hard refresh to clear any stale state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isHotReloadError = this.state.error?.message?.includes('useApp must be used within AppProvider');

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl text-white mb-2">
              {isHotReloadError ? '🔄 Actualisation nécessaire' : '⚠️ Erreur détectée'}
            </h1>
            
            <p className="text-zinc-400 mb-6">
              {isHotReloadError 
                ? 'Le hot-reload a causé une erreur temporaire. Veuillez actualiser la page pour continuer.'
                : 'Une erreur inattendue s\'est produite. Veuillez actualiser la page.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-red-400 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser la page
            </button>

            <p className="text-xs text-zinc-600 mt-4">
              Raccourci clavier : <kbd className="px-2 py-1 bg-zinc-800 rounded">Ctrl+Shift+R</kbd> (Windows/Linux) ou <kbd className="px-2 py-1 bg-zinc-800 rounded">Cmd+Shift+R</kbd> (Mac)
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
