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

    console.log('🔍 Début soumission formulaire', { mode, email });

    // Validations pour inscription
    if (mode === 'signup') {
      console.log('🔍 Validation inscription...');
      
      if (email !== emailConfirm) {
        console.log('❌ Emails ne correspondent pas');
        setError('Les adresses email ne correspondent pas');
        return;
      }
      
      if (password !== passwordConfirm) {
        console.log('❌ Mots de passe ne correspondent pas');
        setError('Les mots de passe ne correspondent pas');
        return;
      }
      
      console.log('✅ Validations OK');
    }

    setIsLoading(true);
    console.log('⏳ Appel API...');

    try {
      if (mode === 'signin') {
        console.log('🔐 Tentative de connexion...');
        await signIn(email, password);
        console.log('✅ Connexion réussie, appel onSuccess() pour recharger l\'état');
        onSuccess();
      } else {
        console.log('📝 Tentative d\'inscription...', { email, fullName });
        const result: any = await signUp(email, password, fullName);
        console.log('✅ Inscription réussie', result);
        
        // Vérifier si une confirmation email est nécessaire
        if (result && result.needsEmailConfirmation) {
          console.log('📧 Confirmation email requise - pas de session');
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
          console.log('🎉 Inscription avec session - connecté automatiquement');
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur auth:', err);
      console.error('❌ Message:', err.message);
      
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
      } else if (err.message === 'Invalid login credentials') {
        setError('Email ou mot de passe incorrect');
      } else if (err.message?.includes('User already registered')) {
        setError('Un compte avec cet email existe déjà');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
      } else if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch')) {
        setError('❌ Impossible de joindre Supabase. Vérifiez : 1) Votre connexion internet, 2) Que les scripts SQL sont exécutés (voir /TODO_SUPABASE.md)');
      } else if (err.message?.includes('confirm')) {
        setError('Veuillez vérifier votre boîte mail pour confirmer votre compte.');
      } else {
        console.log('❌ Erreur non gérée:', err.message);
        setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      console.log('🏁 Fin du processus, setIsLoading(false)');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚗</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {mode === 'signin' 
              ? 'Accédez à vos véhicules et entretiens' 
              : 'Sécurisez vos données avec un compte'}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Dupont"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Confirmer l'email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  placeholder="Confirmez votre email"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Tapez à nouveau votre email (copier-coller désactivé)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-xs text-zinc-500 mt-1">
                Minimum 6 caractères
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-sm text-blue-400 hover:text-blue-300"
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
