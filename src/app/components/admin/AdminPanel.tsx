import { useState, useEffect } from 'react';
import { Shield, Mail, Trash2, Ban, RefreshCw, UserX, CheckCircle, AlertTriangle, X, Lock, Users, Activity, ChevronLeft } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/app/utils/supabase';
import { SecurityDashboard } from './SecurityDashboard';

interface SupabaseAuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  user_metadata: {
    full_name?: string;
  };
}

interface BannedEmail {
  id: string;
  email: string;
  banned_at: string;
  banned_by: string;
  reason?: string;
}

type AdminTab = 'overview' | 'users' | 'security' | 'banned';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<SupabaseAuthUser[]>([]);
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [banEmail, setBanEmail] = useState('');
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loadUsers();
      await loadBannedEmails();
    } catch (err: any) {
      console.error('❌ Erreur chargement admin:', err);
      setError('Impossible de charger les données admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'is', null)
        .eq('is_admin', false);

      if (profilesError) {
        setUsers([]);
        return;
      }

      const uniqueUserIds = [...new Set(profiles?.map(p => p.user_id).filter(Boolean))] as string[];

      const usersData: SupabaseAuthUser[] = uniqueUserIds.map(userId => {
        const userProfiles = profiles?.filter(p => p.user_id === userId) || [];
        const firstProfile = userProfiles[0];
        return {
          id: userId,
          email: `ID: ${userId.slice(0, 8)}...`,
          created_at: firstProfile?.created_at || new Date().toISOString(),
          last_sign_in_at: firstProfile?.updated_at || firstProfile?.created_at || new Date().toISOString(),
          user_metadata: {
            full_name: firstProfile?.name || firstProfile?.first_name || 'Utilisateur',
          },
        };
      });

      setUsers(usersData);
    } catch (err) {
      setUsers([]);
    }
  };

  const loadBannedEmails = async () => {
    const { data, error } = await supabase
      .from('banned_emails')
      .select('*')
      .order('banned_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      setBannedEmails([]);
    } else {
      setBannedEmails(data || []);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (showConfirmDelete !== userId) {
      setShowConfirmDelete(userId);
      return;
    }
    try {
      setError('');
      setSuccessMessage('');
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      setSuccessMessage(`✅ Profils de ${userName} supprimés avec succès`);
      setShowConfirmDelete(null);
      await loadUsers();
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleBanEmail = async () => {
    if (!banEmail.trim()) {
      setError('Veuillez entrer un email à bannir');
      return;
    }
    try {
      setError('');
      setSuccessMessage('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour bannir un email');
        return;
      }
      const { error } = await supabase.from('banned_emails').insert({
        email: banEmail.toLowerCase().trim(),
        banned_by: user.id,
        reason: banReason.trim() || null,
      });
      if (error) throw error;
      setSuccessMessage(`✅ Email ${banEmail} banni avec succès`);
      setBanEmail('');
      setBanReason('');
      await loadBannedEmails();
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleUnbanEmail = async (id: string, email: string) => {
    try {
      setError('');
      setSuccessMessage('');
      const { error } = await supabase.from('banned_emails').delete().eq('id', id);
      if (error) throw error;
      setSuccessMessage(`✅ Email ${email} débanni avec succès`);
      await loadBannedEmails();
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: typeof Shield; badge?: number }[] = [
    { id: 'overview', label: 'Aperçu', icon: Activity },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'users', label: 'Utilisateurs', icon: Users, badge: users.length },
    { id: 'banned', label: 'Bannis', icon: Lock, badge: bannedEmails.length },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header gradient */}
      <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500 rounded-full blur-3xl" />
        </div>
        <div className="relative p-6 pb-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-red-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-red-500/30">
              <Shield className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Panneau d'Administration</h1>
              <p className="text-red-200/70 text-xs">Gestion & Sécurité</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { label: 'Utilisateurs', value: users.length, color: 'blue' },
              { label: 'Bannis', value: bannedEmails.length, color: 'orange' },
              { label: 'Score sécu', value: '—', color: 'emerald' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center">
                <p className="text-white/50 text-xs">{stat.label}</p>
                <p className="text-white font-bold text-lg">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-black/20 rounded-t-xl p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1 rounded-full min-w-[16px] text-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Messages globaux */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Erreur</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── TAB: OVERVIEW ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Résumé */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('users')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left hover:bg-zinc-800/80 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Utilisateurs actifs</p>
              </button>
              <button
                onClick={() => setActiveTab('banned')}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left hover:bg-zinc-800/80 transition-colors"
              >
                <Lock className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-2xl font-bold text-white">{bannedEmails.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Emails bannis</p>
              </button>
            </div>

            {/* Accès rapide sécurité */}
            <button
              onClick={() => setActiveTab('security')}
              className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 text-left hover:from-blue-500/15 hover:to-purple-500/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium text-sm">Audit de Sécurité</p>
                    <p className="text-zinc-500 text-xs">Vérifier RLS, policies, fonctions SQL</p>
                  </div>
                </div>
                <span className="text-zinc-500 text-xs">→</span>
              </div>
            </button>

            {/* Note admin */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-400/80">
                  <p className="font-semibold text-amber-300 mb-1">Fonctionnalités admin limitées</p>
                  <p>La suppression complète des comptes auth nécessite une fonction SQL avec Service Role. Consultez la documentation Supabase.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SECURITY ─────────────────────────────────────── */}
        {activeTab === 'security' && (
          <SecurityDashboard />
        )}

        {/* ── TAB: USERS ────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Utilisateurs ({users.length})</h2>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-400">
              ℹ️ Les emails ne sont pas accessibles sans Service Role. Les utilisateurs sont identifiés par leur nom.
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun utilisateur avec profil lié</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-sm font-medium text-blue-300">
                            {(user.user_metadata?.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <p className="text-white font-medium text-sm">
                            {user.user_metadata?.full_name || 'Utilisateur'}
                          </p>
                        </div>
                        <div className="flex gap-3 text-xs text-zinc-500 ml-10">
                          <span>ID: {user.id.slice(0, 8)}...</span>
                          <span>Créé: {new Date(user.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.user_metadata?.full_name || 'Utilisateur')}
                        variant="outline"
                        size="sm"
                        className={`text-xs ${
                          showConfirmDelete === user.id
                            ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                            : 'border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {showConfirmDelete === user.id ? 'Confirmer ?' : 'Supprimer'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: BANNED ───────────────────────────────────────── */}
        {activeTab === 'banned' && (
          <div className="space-y-4">
            {/* Form bannir */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-medium">Bannir un email</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={banEmail}
                    onChange={(e) => setBanEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Raison (optionnel)</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Ex: Abus, spam..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <button
                  onClick={handleBanEmail}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Bannir cet email
                </button>
              </div>
            </div>

            {/* Liste bannis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserX className="w-4 h-4 text-orange-400" />
                <h3 className="text-white font-medium text-sm">Emails bannis ({bannedEmails.length})</h3>
              </div>

              {bannedEmails.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun email banni</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bannedEmails.map((banned) => (
                    <div
                      key={banned.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{banned.email}</p>
                        <div className="flex gap-2 text-xs text-zinc-500 mt-0.5">
                          {banned.reason && <span>• {banned.reason}</span>}
                          <span>• {new Date(banned.banned_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnbanEmail(banned.id, banned.email)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                        Débannir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
