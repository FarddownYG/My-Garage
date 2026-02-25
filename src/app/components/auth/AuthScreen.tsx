import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { signIn, signUp } from '../../utils/auth';

interface AuthScreenProps {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitSeconds(null);

    // Validations pour inscription
    if (mode === 'signup') {
      if (email !== emailConfirm) {
        setError('Les adresses email ne correspondent pas');
        return;
      }
      
      if (password !== passwordConfirm) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onSuccess();
      } else {
        const result: any = await signUp(email, password, fullName);
        
        // Vérifier si une confirmation email est nécessaire
        if (result && result.needsEmailConfirmation) {
          setIsLoading(false);
          setError('✅ Compte créé ! Connectez-vous maintenant avec vos identifiants.');
          setTimeout(() => {
            setMode('signin');
            setPassword('');
            setEmailConfirm('');
            setPasswordConfirm('');
          }, 2000);
          return; // Ne pas appeler onSuccess() car pas encore connecté
        } else {
          onSuccess();
        }
      }
    } catch (err: any) {
      // Extraire le temps d'attente du message d'erreur
      const rateLimitMatch = err.message?.match(/after (\d+) seconds/);
      if (rateLimitMatch) {
        const seconds = parseInt(rateLimitMatch[1]);
        setRateLimitSeconds(seconds);
        setError(`Trop de tentatives. Veuillez attendre ${seconds} secondes avant de réessayer.`);
        
        // Countdown
        let remaining = seconds;
        const interval = setInterval(() => {
          remaining--;
          if (remaining <= 0) {
            clearInterval(interval);
            setRateLimitSeconds(null);
            setError('');
          } else {
            setRateLimitSeconds(remaining);
            setError(`Trop de tentatives. Veuillez attendre ${remaining} secondes avant de réessayer.`);
          }
        }, 1000);
      } else if (err.message === 'Invalid login credentials' || err.message === 'Email ou mot de passe incorrect') {
        setError('Email ou mot de passe incorrect');
      } else if (err.message?.includes('User already registered')) {
        setError('Un compte avec cet email existe déjà');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
      } else if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch')) {
        setError('❌ Impossible de joindre Supabase. Vérifiez votre connexion internet.');
      } else {
        setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e0e16] via-[#0a0a0f] to-[#0e0e16] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#12121a]/90 backdrop-blur-xl border-white/[0.06] p-6 sm:p-8 rounded-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <span className="text-4xl">🚗</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-slate-400 text-sm">
            {mode === 'signin' 
              ? 'Accédez à vos véhicules et entretiens' 
              : 'Sécurisez vos données avec un compte'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Dupont"
                  className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Confirmer l'email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  placeholder="Confirmez votre email"
                  className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tapez à nouveau votre email (copier-coller désactivé)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-slate-500 mt-1">
                Minimum 6 caractères
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a2e] border border-white/[0.06] rounded-xl pl-11 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tapez à nouveau votre mot de passe (copier-coller désactivé)
              </p>
            </div>
          )}

          {error && (
            <div className={`border rounded-lg p-3 text-sm ${
              error.startsWith('✅')
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : rateLimitSeconds !== null 
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || rateLimitSeconds !== null}
            className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 h-12 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-cyan-500/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Se connecter
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Créer le compte
              </>
            )}
          </Button>
        </form>

        {/* Toggle signin/signup */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setEmailConfirm('');
              setPasswordConfirm('');
            }}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            {mode === 'signin' 
              ? "Pas encore de compte ? Créer un compte" 
              : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </Card>
    </div>
  );
}