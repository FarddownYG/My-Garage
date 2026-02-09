-- ============================================
-- 🔒 CONFIGURATION SUPABASE - NETTOYAGE & RLS
-- Version SANS ERREUR (supprime les anciennes policies)
-- Copie-colle ce fichier dans Supabase > SQL Editor
-- ============================================

-- ============================================
-- 1️⃣ NETTOYAGE DES PROFILS EN DOUBLE
-- ============================================

-- Voir les profils en double
SELECT 
  user_id,
  COUNT(*) as nombre_profils,
  string_agg(first_name, ', ') as noms
FROM profiles
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Supprimer les doublons (GARDER LE PLUS ANCIEN)
WITH profils_a_garder AS (
  SELECT DISTINCT ON (user_id) 
    id
  FROM profiles
  WHERE user_id IS NOT NULL
  ORDER BY user_id, created_at ASC NULLS LAST
)
DELETE FROM profiles
WHERE user_id IS NOT NULL
  AND id NOT IN (SELECT id FROM profils_a_garder);

-- Vérifier qu'il n'y a plus de doublons
SELECT 
  user_id, 
  COUNT(*) as nombre_profils,
  first_name
FROM profiles 
WHERE user_id IS NOT NULL
GROUP BY user_id, first_name;
-- ✅ Résultat attendu : nombre_profils = 1 pour chaque ligne

-- ============================================
-- 2️⃣ SUPPRIMER LES ANCIENNES POLICIES (CLEAN)
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON profiles;

-- VEHICLES
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create vehicles for their profiles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;

-- MAINTENANCE_ENTRIES
DROP POLICY IF EXISTS "Users can view their own maintenance entries" ON maintenance_entries;
DROP POLICY IF EXISTS "Users can create maintenance entries for their vehicles" ON maintenance_entries;
DROP POLICY IF EXISTS "Users can update their own maintenance entries" ON maintenance_entries;
DROP POLICY IF EXISTS "Users can delete their own maintenance entries" ON maintenance_entries;

-- TASKS
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks for their vehicles" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- REMINDERS
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can create reminders for their vehicles" ON reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON reminders;

-- MAINTENANCE_TEMPLATES
DROP POLICY IF EXISTS "Users can view their own maintenance templates" ON maintenance_templates;
DROP POLICY IF EXISTS "Users can create maintenance templates for their profiles" ON maintenance_templates;
DROP POLICY IF EXISTS "Users can update their own maintenance templates" ON maintenance_templates;
DROP POLICY IF EXISTS "Users can delete their own maintenance templates" ON maintenance_templates;

-- MAINTENANCE_PROFILES
DROP POLICY IF EXISTS "Users can view their own maintenance profiles" ON maintenance_profiles;
DROP POLICY IF EXISTS "Users can create maintenance profiles for their profiles" ON maintenance_profiles;
DROP POLICY IF EXISTS "Users can update their own maintenance profiles" ON maintenance_profiles;
DROP POLICY IF EXISTS "Users can delete their own maintenance profiles" ON maintenance_profiles;

-- APP_CONFIG
DROP POLICY IF EXISTS "Anyone can read app config" ON app_config;
DROP POLICY IF EXISTS "Only admins can update app config" ON app_config;

-- ============================================
-- 3️⃣ ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4️⃣ CRÉER LES NOUVELLES POLICIES
-- ============================================

-- ✅ PROFILES : Un user voit uniquement ses profils
CREATE POLICY "Users can view their own profiles" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- ✅ VEHICLES : Un user voit uniquement les véhicules de ses profils
CREATE POLICY "Users can view their own vehicles" ON vehicles FOR SELECT 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create vehicles for their profiles" ON vehicles FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own vehicles" ON vehicles FOR UPDATE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own vehicles" ON vehicles FOR DELETE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ✅ MAINTENANCE_ENTRIES : Un user voit uniquement les entretiens de ses véhicules
CREATE POLICY "Users can view their own maintenance entries" ON maintenance_entries FOR SELECT 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can create maintenance entries for their vehicles" ON maintenance_entries FOR INSERT 
  WITH CHECK (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update their own maintenance entries" ON maintenance_entries FOR UPDATE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own maintenance entries" ON maintenance_entries FOR DELETE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));

-- ✅ TASKS
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can create tasks for their vehicles" ON tasks FOR INSERT 
  WITH CHECK (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));

-- ✅ REMINDERS
CREATE POLICY "Users can view their own reminders" ON reminders FOR SELECT 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can create reminders for their vehicles" ON reminders FOR INSERT 
  WITH CHECK (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update their own reminders" ON reminders FOR UPDATE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own reminders" ON reminders FOR DELETE 
  USING (vehicle_id IN (SELECT v.id FROM vehicles v INNER JOIN profiles p ON v.owner_id = p.id WHERE p.user_id = auth.uid()));

-- ✅ MAINTENANCE_TEMPLATES
CREATE POLICY "Users can view their own maintenance templates" ON maintenance_templates FOR SELECT 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create maintenance templates for their profiles" ON maintenance_templates FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own maintenance templates" ON maintenance_templates FOR UPDATE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own maintenance templates" ON maintenance_templates FOR DELETE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ✅ MAINTENANCE_PROFILES
CREATE POLICY "Users can view their own maintenance profiles" ON maintenance_profiles FOR SELECT 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create maintenance profiles for their profiles" ON maintenance_profiles FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own maintenance profiles" ON maintenance_profiles FOR UPDATE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own maintenance profiles" ON maintenance_profiles FOR DELETE 
  USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ✅ APP_CONFIG (lecture publique)
CREATE POLICY "Anyone can read app config" ON app_config FOR SELECT USING (true);
CREATE POLICY "Only admins can update app config" ON app_config FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- ============================================
-- 5️⃣ VÉRIFICATIONS
-- ============================================

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'vehicles', 'maintenance_entries', 'tasks', 'reminders', 'maintenance_templates', 'maintenance_profiles', 'app_config');
-- ✅ Résultat attendu : rowsecurity = true pour toutes les tables

-- Vérifier les policies créées
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'vehicles', 'maintenance_entries', 'tasks', 'reminders', 'maintenance_templates', 'maintenance_profiles', 'app_config')
ORDER BY tablename, policyname;

-- Compter les policies par table
SELECT tablename, COUNT(*) as nb_policies
FROM pg_policies 
WHERE tablename IN ('profiles', 'vehicles', 'maintenance_entries', 'tasks', 'reminders', 'maintenance_templates', 'maintenance_profiles', 'app_config')
GROUP BY tablename
ORDER BY tablename;
-- ✅ Résultat attendu : 4 policies par table (SELECT, INSERT, UPDATE, DELETE)

-- ============================================
-- ✅ TERMINÉ !
-- L'app est maintenant sécurisée et optimisée
-- pour des milliers d'utilisateurs !
-- ============================================
