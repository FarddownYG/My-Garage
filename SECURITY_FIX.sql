-- ============================================================
-- 🔒 SECURITY FIX - Corrections Audit de Sécurité Supabase
-- Score cible : 10/10
-- Date : 2026-02-25
-- 
-- ⚠️ EXÉCUTER CE FICHIER ENTIER DANS SUPABASE > SQL EDITOR
-- Copiez-collez tout le contenu ci-dessous
-- ============================================================

-- ============================================================
-- ✅ FIX 1 : FUNCTION SEARCH PATH MUTABLE
-- Sécurise les fonctions contre les attaques search_path
-- ============================================================

-- Fix function update_updated_at_column (search_path mutable)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix function check_email_not_banned (search_path mutable)
CREATE OR REPLACE FUNCTION public.check_email_not_banned()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier si l'email est dans la liste des bannis
  IF EXISTS (
    SELECT 1 FROM public.banned_emails 
    WHERE email = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Email address is banned';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- ✅ FIX 2 : ACTIVER RLS SUR LA TABLE BACKUP
-- maintenance_templates_backup n'a pas RLS activé
-- ============================================================

-- Activer RLS sur la table backup
ALTER TABLE IF EXISTS maintenance_templates_backup ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Admin only backup access" ON maintenance_templates_backup;
DROP POLICY IF EXISTS "Admins can manage backup templates" ON maintenance_templates_backup;

-- Seuls les admins peuvent accéder aux backups
CREATE POLICY "Admins can manage backup templates" ON maintenance_templates_backup
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  );

-- ============================================================
-- ✅ FIX 3 : SUPPRIMER TOUTES LES POLICIES "ALWAYS TRUE"
-- Suppression dynamique de TOUTES les policies existantes
-- pour éviter les politiques trop permissives résiduelles
-- ============================================================

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 
        'vehicles', 
        'maintenance_entries', 
        'tasks', 
        'reminders', 
        'maintenance_templates',
        'maintenance_profiles', 
        'app_config',
        'banned_emails'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, 
      pol.schemaname, 
      pol.tablename
    );
    RAISE NOTICE 'Dropped policy: % on %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- ============================================================
-- ✅ FIX 4 : ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banned_emails ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ✅ FIX 5 : RECRÉER LES POLICIES STRICTES (SANS USING(true))
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
-- Un utilisateur voit uniquement SES profils
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON profiles 
  FOR DELETE USING (auth.uid() = user_id);

-- ─── VEHICLES ────────────────────────────────────────────────
-- Un utilisateur voit uniquement les véhicules de ses profils
CREATE POLICY "vehicles_select_own" ON vehicles 
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_insert_own" ON vehicles 
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_update_own" ON vehicles 
  FOR UPDATE 
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_delete_own" ON vehicles 
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ─── MAINTENANCE_ENTRIES ─────────────────────────────────────
CREATE POLICY "maintenance_entries_select_own" ON maintenance_entries 
  FOR SELECT USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_entries_insert_own" ON maintenance_entries 
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_entries_update_own" ON maintenance_entries 
  FOR UPDATE 
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_entries_delete_own" ON maintenance_entries 
  FOR DELETE USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ─── TASKS ───────────────────────────────────────────────────
CREATE POLICY "tasks_select_own" ON tasks 
  FOR SELECT USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_own" ON tasks 
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_own" ON tasks 
  FOR UPDATE 
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete_own" ON tasks 
  FOR DELETE USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ─── REMINDERS ───────────────────────────────────────────────
CREATE POLICY "reminders_select_own" ON reminders 
  FOR SELECT USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "reminders_insert_own" ON reminders 
  FOR INSERT WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "reminders_update_own" ON reminders 
  FOR UPDATE 
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "reminders_delete_own" ON reminders 
  FOR DELETE USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ─── MAINTENANCE_TEMPLATES ───────────────────────────────────
CREATE POLICY "maintenance_templates_select_own" ON maintenance_templates 
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_templates_insert_own" ON maintenance_templates 
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_templates_update_own" ON maintenance_templates 
  FOR UPDATE 
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_templates_delete_own" ON maintenance_templates 
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ─── MAINTENANCE_PROFILES ────────────────────────────────────
CREATE POLICY "maintenance_profiles_select_own" ON maintenance_profiles 
  FOR SELECT USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_profiles_insert_own" ON maintenance_profiles 
  FOR INSERT WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_profiles_update_own" ON maintenance_profiles 
  FOR UPDATE 
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "maintenance_profiles_delete_own" ON maintenance_profiles 
  FOR DELETE USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ─── APP_CONFIG ──────────────────────────────────────────────
-- ✅ FIX CRITIQUE : Remplacer USING(true) par USING authenticated
-- La config n'est accessible qu'aux utilisateurs authentifiés
CREATE POLICY "app_config_select_authenticated" ON app_config 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Seuls les admins peuvent modifier la config
CREATE POLICY "app_config_update_admin_only" ON app_config 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  );

-- Seuls les admins peuvent insérer dans la config
CREATE POLICY "app_config_insert_admin_only" ON app_config 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  );

-- ─── BANNED_EMAILS ───────────────────────────────────────────
-- Seuls les admins gèrent les emails bannis
CREATE POLICY "banned_emails_admin_all" ON banned_emails 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
        AND is_admin = true
    )
  );

-- ============================================================
-- ✅ FIX 6 : INDEX DE PERFORMANCE POUR LES SUBQUERIES RLS
-- Améliore les performances des policies en cascade
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_vehicle_id ON maintenance_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_id ON tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_owner_id ON maintenance_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_owner_id ON maintenance_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON banned_emails(email);

-- ============================================================
-- ✅ FIX 7 : LEAKED PASSWORD PROTECTION
-- ⚠️ CETTE ÉTAPE DOIT ÊTRE FAITE MANUELLEMENT :
--
-- 1. Aller dans Supabase Dashboard
-- 2. Authentication → Settings
-- 3. Activer "Enable HaveIBeenPwned (HIBP) integration"
--    (appelé "Leaked Password Protection")
-- 4. Sauvegarder
--
-- Cette protection vérifie les mots de passe compromis lors
-- de l'inscription et du changement de mot de passe.
-- ============================================================

-- ============================================================
-- ✅ VÉRIFICATIONS FINALES
-- ============================================================

-- Vérifier RLS activé sur toutes les tables
SELECT 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS activé' ELSE '❌ RLS désactivé' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'vehicles', 'maintenance_entries', 'tasks', 
    'reminders', 'maintenance_templates', 'maintenance_profiles', 
    'app_config', 'banned_emails', 'maintenance_templates_backup'
  )
ORDER BY tablename;

-- Vérifier les policies créées (aucune ne doit avoir USING(true))
SELECT 
  tablename, 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Vérifier les fonctions avec search_path sécurisé
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NOT NULL AND 'search_path=public' = ANY(p.proconfig) 
    THEN '✅ search_path sécurisé'
    ELSE '❌ search_path non sécurisé'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('update_updated_at_column', 'check_email_not_banned');

-- ============================================================
-- ✅ RÉSUMÉ DES CORRECTIONS
-- ============================================================
-- 1. ✅ Function Search Path Mutable → Corrigé (SET search_path = public)
-- 2. ✅ RLS Disabled (maintenance_templates_backup) → RLS activé + policy admin
-- 3. ✅ RLS Policy Always True (toutes tables) → Policies strictes recréées
--    - app_config: USING(true) → USING(auth.role() = 'authenticated')
--    - Toutes les vieilles policies "always true" supprimées dynamiquement
-- 4. ⚠️ Leaked Password Protection → À activer manuellement dans le Dashboard
--    Authentication → Settings → Enable HIBP integration
-- 5. ✅ Index de performance ajoutés pour les subqueries RLS
-- ============================================================
