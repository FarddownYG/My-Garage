import { useState, useEffect } from 'react';
import { Shield, Mail, Trash2, Ban, RefreshCw, UserX, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/app/utils/supabase';

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

export function AdminPanel() {
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
      // Charger les utilisateurs (nécessite accès admin)
      await loadUsers();
      
      // Charger les emails bannis
      await loadBannedEmails();
    } catch (err: any) {
      console.error('❌ Erreur chargement admin:', err);
      setError('Impossible de charger les données admin. Êtes-vous connecté avec un compte administrateur ?');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Chargement des utilisateurs...');
      
      // Charger les profils pour obtenir les user_id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('user_id', 'is', null)
        .eq('is_admin', false);

      if (profilesError) {
        console.error('❌ Erreur chargement profils:', profilesError);
        setUsers([]);
        return;
      }

      console.log(`✅ ${profiles?.length || 0} profils trouvés`);

      // Extraire les user_id uniques
      const uniqueUserIds = [...new Set(profiles?.map(p => p.user_id).filter(Boolean))] as string[];
      
      console.log(`👥 ${uniqueUserIds.length} utilisateurs uniques`);
      
      // Créer une structure d'utilisateurs basée sur les profils
      const usersData: SupabaseAuthUser[] = uniqueUserIds.map(userId => {
        const userProfiles = profiles?.filter(p => p.user_id === userId) || [];
        const firstProfile = userProfiles[0];
        
        console.log(`👤 User ${userId.slice(0, 8)}: ${userProfiles.length} profils`);
        
        return {
          id: userId,
          email: `ID: ${userId.slice(0, 8)}...`, // On ne peut pas récupérer l'email sans Service Role
          created_at: firstProfile?.created_at || new Date().toISOString(),
          last_sign_in_at: firstProfile?.updated_at || firstProfile?.created_at || new Date().toISOString(),
          user_metadata: {
            full_name: firstProfile?.name || firstProfile?.first_name || 'Utilisateur',
          },
        };
      });

      console.log(`✅ ${usersData.length} utilisateurs chargés`);
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Exception chargement utilisateurs:', err);
      setUsers([]);
    }
  };

  const loadBannedEmails = async () => {
    const { data, error } = await supabase
      .from('banned_emails')
      .select('*')
      .order('banned_at', { ascending: false });

    if (error && error.code !== 'PGRST116') { // Ignorer si table n'existe pas
      console.error('❌ Erreur chargement emails bannis:', error);
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

      // Supprimer les profils de l'utilisateur
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setSuccessMessage(`✅ Profils de ${userName} supprimés avec succès`);
      setShowConfirmDelete(null);
      
      // Recharger les données
      await loadUsers();
    } catch (err: any) {
      console.error('❌ Erreur suppression utilisateur:', err);
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

      // Ajouter l'email à la liste des bannis
      const { error } = await supabase
        .from('banned_emails')
        .insert({
          email: banEmail.toLowerCase().trim(),
          banned_by: user.id,
          reason: banReason.trim() || null,
        });

      if (error) throw error;

      setSuccessMessage(`✅ Email ${banEmail} banni avec succès`);
      setBanEmail('');
      setBanReason('');
      
      // Recharger les emails bannis
      await loadBannedEmails();
    } catch (err: any) {
      console.error('❌ Erreur bannissement email:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleUnbanEmail = async (id: string, email: string) => {
    try {
      setError('');
      setSuccessMessage('');

      const { error } = await supabase
        .from('banned_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccessMessage(`✅ Email ${email} débanni avec succès`);
      
      // Recharger les emails bannis
      await loadBannedEmails();
    } catch (err: any) {
      console.error('❌ Erreur débannissement email:', err);
      setError(`Erreur: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Chargement du panneau admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Panneau d'Administration</h1>
          </div>
          <p className="text-red-100 text-sm">
            Gestion des utilisateurs et sécurité
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Section Bannir un email */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Ban className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">Bannir un email</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={banEmail}
                onChange={(e) => setBanEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Raison (optionnel)
              </label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ex: Abus, spam, etc."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <Button
              onClick={handleBanEmail}
              className="bg-red-600 hover:bg-red-700"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bannir cet email
            </Button>
          </div>
        </Card>

        {/* Liste des emails bannis */}
        {bannedEmails.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserX className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">
                Emails bannis ({bannedEmails.length})
              </h2>
            </div>

            <div className="space-y-2">
              {bannedEmails.map((banned) => (
                <div
                  key={banned.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">{banned.email}</p>
                    {banned.reason && (
                      <p className="text-sm text-zinc-400">Raison: {banned.reason}</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      Banni le {new Date(banned.banned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleUnbanEmail(banned.id, banned.email)}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Débannir
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Liste des utilisateurs */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">
                Utilisateurs ({users.length})
              </h2>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-400">
            ℹ️ Les emails ne sont pas accessibles sans Service Role. Les utilisateurs sont identifiés par leur nom complet.
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p>Aucun utilisateur avec profil lié</p>
              <p className="text-sm mt-2">
                Les utilisateurs apparaîtront ici une fois qu'ils auront créé un profil
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-medium">
                          {user.user_metadata?.full_name || 'Utilisateur'}
                        </p>
                        <span className="text-sm text-zinc-500">
                          (ID: {user.id.slice(0, 8)}...)
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-zinc-500">
                        <span>Créé: {new Date(user.created_at).toLocaleDateString()}</span>
                        <span>
                          Dernière connexion:{' '}
                          {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.user_metadata?.full_name || 'Utilisateur')}
                        variant="outline"
                        size="sm"
                        className={`
                          ${showConfirmDelete === user.id
                            ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }
                        `}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {showConfirmDelete === user.id ? 'Confirmer ?' : 'Supprimer'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Note importante */}
        <Card className="bg-yellow-500/10 border-yellow-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-400">
              <p className="font-semibold mb-1">⚠️ Fonctionnalités admin limitées</p>
              <p className="text-yellow-500">
                La suppression d'utilisateurs nécessite une fonction SQL avec Service Role.
                Consultez la documentation Supabase pour l'implémenter.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
