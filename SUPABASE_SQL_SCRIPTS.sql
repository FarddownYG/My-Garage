-- ============================================
-- 🚀 SCRIPTS SQL SUPABASE - AUTHENTIFICATION
-- ============================================
-- 
-- ⚠️ IMPORTANT : Exécutez ces scripts dans l'ordre !
-- 
-- 1. Script 1 : Ajout des colonnes d'authentification
-- 2. Script 2 : Fonction de migration
-- 3. Script 3 : Politiques RLS (Row Level Security)
--
-- ============================================

-- ============================================
-- 📝 SCRIPT 1 : AJOUT DES COLONNES
-- ============================================
-- 
-- Ce script ajoute les colonnes nécessaires pour
-- l'authentification Supabase et la migration des profils.
-- 
-- À exécuter dans : SQL Editor
-- ============================================

-- Ajouter les colonnes d'authentification à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_migrated ON profiles(is_migrated);

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at');

-- ✅ Si vous voyez 3 lignes, c'est bon !


-- ============================================
-- 📝 SCRIPT 2 : FONCTION DE MIGRATION
-- ============================================
-- 
-- Cette fonction migre un profil vers un compte Supabase Auth.
-- Elle met à jour user_id, is_migrated et migrated_at.
-- 
-- À exécuter dans : SQL Editor
-- ============================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS migrate_profile_to_user(UUID, UUID);

-- Créer la fonction de migration
CREATE OR REPLACE FUNCTION migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le profil existe et n'est pas déjà migré
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = profile_id_param 
      AND (user_id IS NULL OR user_id = user_id_param)
  ) THEN
    RAISE EXCEPTION 'Profil introuvable ou déjà migré vers un autre compte';
  END IF;

  -- Mettre à jour le profil
  UPDATE profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;

  -- Log de succès
  RAISE NOTICE 'Profil % migré vers user %', profile_id_param, user_id_param;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION migrate_profile_to_user(UUID, UUID) TO authenticated;

-- ✅ Si pas d'erreur, la fonction est créée !


-- ============================================
-- 📝 SCRIPT 3 : POLITIQUES RLS
-- ============================================
-- 
-- Ce script active Row Level Security (RLS) et crée
-- les politiques pour isoler les données par utilisateur.
-- 
-- ⚠️ ATTENTION : Ce script va activer RLS sur toutes les tables.
-- Les données existantes resteront accessibles via user_id IS NULL.
-- 
-- À exécuter dans : SQL Editor
-- ============================================

-- ============================================
-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- ✅ RLS activé sur 7 tables


-- ============================================
-- 2. POLITIQUES POUR LA TABLE "profiles"
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view unmigrated profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON profiles;

-- SELECT : Voir ses propres profils + profils non migrés (pour migration)
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL 
    OR is_admin = true
  );

-- INSERT : Créer des profils liés à son compte
CREATE POLICY "Users can insert own profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- UPDATE : Modifier ses propres profils + profils non migrés
CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL
    OR is_admin = true
  );

-- DELETE : Supprimer ses propres profils (sauf admin)
CREATE POLICY "Users can delete own profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() = user_id 
    AND is_admin = false
  );

-- ✅ 4 policies créées pour "profiles"


-- ============================================
-- 3. POLITIQUES POUR LA TABLE "vehicles"
-- ============================================

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

-- SELECT : Voir les véhicules de ses profils
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- INSERT : Ajouter des véhicules à ses profils
CREATE POLICY "Users can insert own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- UPDATE : Modifier les véhicules de ses profils
CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- DELETE : Supprimer les véhicules de ses profils
CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = vehicles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- ✅ 4 policies créées pour "vehicles"


-- ============================================
-- 4. POLITIQUES POUR "maintenance_entries"
-- ============================================

DROP POLICY IF EXISTS "Users can view own maintenance" ON maintenance_entries;
DROP POLICY IF EXISTS "Users can manage own maintenance" ON maintenance_entries;

-- SELECT : Voir l'historique d'entretien de ses véhicules
CREATE POLICY "Users can view own maintenance"
  ON maintenance_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = maintenance_entries.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ALL : Gérer (INSERT/UPDATE/DELETE) l'historique de ses véhicules
CREATE POLICY "Users can manage own maintenance"
  ON maintenance_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = maintenance_entries.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ✅ 2 policies créées pour "maintenance_entries"


-- ============================================
-- 5. POLITIQUES POUR "tasks"
-- ============================================

DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;

-- SELECT : Voir les tâches de ses véhicules
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = tasks.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ALL : Gérer les tâches de ses véhicules
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = tasks.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ✅ 2 policies créées pour "tasks"


-- ============================================
-- 6. POLITIQUES POUR "reminders"
-- ============================================

DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;

-- SELECT : Voir les rappels de ses véhicules
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = reminders.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ALL : Gérer les rappels de ses véhicules
CREATE POLICY "Users can manage own reminders"
  ON reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN profiles p ON p.id = v.owner_id
      WHERE v.id = reminders.vehicle_id 
        AND (p.user_id = auth.uid() OR p.user_id IS NULL)
    )
  );

-- ✅ 2 policies créées pour "reminders"


-- ============================================
-- 7. POLITIQUES POUR "maintenance_templates"
-- ============================================

DROP POLICY IF EXISTS "Users can view own templates" ON maintenance_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON maintenance_templates;

-- SELECT : Voir les templates de ses profils
CREATE POLICY "Users can view own templates"
  ON maintenance_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_templates.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- ALL : Gérer les templates de ses profils
CREATE POLICY "Users can manage own templates"
  ON maintenance_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_templates.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- ✅ 2 policies créées pour "maintenance_templates"


-- ============================================
-- 8. POLITIQUES POUR "maintenance_profiles"
-- ============================================

DROP POLICY IF EXISTS "Users can view own maintenance profiles" ON maintenance_profiles;
DROP POLICY IF EXISTS "Users can manage own maintenance profiles" ON maintenance_profiles;

-- SELECT : Voir les profils d'entretien de ses profils
CREATE POLICY "Users can view own maintenance profiles"
  ON maintenance_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_profiles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- ALL : Gérer les profils d'entretien de ses profils
CREATE POLICY "Users can manage own maintenance profiles"
  ON maintenance_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = maintenance_profiles.owner_id 
        AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
    )
  );

-- ✅ 2 policies créées pour "maintenance_profiles"


-- ============================================
-- 🎉 RÉCAPITULATIF
-- ============================================

-- Compter le nombre de policies créées
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ✅ Vous devriez voir :
-- profiles: 4 policies
-- vehicles: 4 policies
-- maintenance_entries: 2 policies
-- tasks: 2 policies
-- reminders: 2 policies
-- maintenance_templates: 2 policies
-- maintenance_profiles: 2 policies
-- ────────────────────────
-- TOTAL: 18 policies


-- ============================================
-- ✅ VÉRIFICATIONS FINALES
-- ============================================

-- 1. Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 
    'vehicles', 
    'maintenance_entries', 
    'tasks', 
    'reminders',
    'maintenance_templates',
    'maintenance_profiles'
  );
-- ✅ Toutes les tables doivent avoir rowsecurity = true

-- 2. Vérifier que la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user';
-- ✅ Doit retourner 1 ligne

-- 3. Vérifier les colonnes de profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at');
-- ✅ Doit retourner 3 lignes


-- ============================================
-- 🎊 FÉLICITATIONS !
-- ============================================
-- 
-- Si tous les tests sont OK, votre base de données
-- est prête pour l'authentification Supabase !
-- 
-- Prochaines étapes :
-- 1. Retourner sur l'application
-- 2. Créer un compte
-- 3. Tester la migration des profils
-- 
-- ============================================
