-- ========================================
-- 🔒 ISOLATION COMPLÈTE PAR UTILISATEUR (RLS)
-- ========================================
-- Ce script active le Row Level Security (RLS) pour isoler
-- complètement les données de chaque utilisateur.
-- Chaque user_id ne verra QUE ses propres données.
-- ========================================

-- 1️⃣ ACTIVER RLS SUR TOUTES LES TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- 2️⃣ SUPPRIMER TOUTES LES ANCIENNES POLICIES
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

DROP POLICY IF EXISTS "vehicles_select_own" ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert_own" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update_own" ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete_own" ON vehicles;

DROP POLICY IF EXISTS "maintenance_entries_select_own" ON maintenance_entries;
DROP POLICY IF EXISTS "maintenance_entries_insert_own" ON maintenance_entries;
DROP POLICY IF EXISTS "maintenance_entries_update_own" ON maintenance_entries;
DROP POLICY IF EXISTS "maintenance_entries_delete_own" ON maintenance_entries;

DROP POLICY IF EXISTS "tasks_select_own" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON tasks;

DROP POLICY IF EXISTS "reminders_select_own" ON reminders;
DROP POLICY IF EXISTS "reminders_insert_own" ON reminders;
DROP POLICY IF EXISTS "reminders_update_own" ON reminders;
DROP POLICY IF EXISTS "reminders_delete_own" ON reminders;

DROP POLICY IF EXISTS "maintenance_templates_select_own" ON maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert_own" ON maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update_own" ON maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_delete_own" ON maintenance_templates;

DROP POLICY IF EXISTS "maintenance_profiles_select_own" ON maintenance_profiles;
DROP POLICY IF EXISTS "maintenance_profiles_insert_own" ON maintenance_profiles;
DROP POLICY IF EXISTS "maintenance_profiles_update_own" ON maintenance_profiles;
DROP POLICY IF EXISTS "maintenance_profiles_delete_own" ON maintenance_profiles;

-- ========================================
-- 3️⃣ CRÉER LES NOUVELLES POLICIES (STRICT)
-- ========================================

-- 📋 PROFILES : Voir/Modifier UNIQUEMENT ses propres profils
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (user_id = auth.uid());

-- 🚗 VEHICLES : Uniquement les véhicules dont le owner_id correspond à un profil de l'utilisateur
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
  FOR UPDATE USING (
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

-- 🔧 MAINTENANCE_ENTRIES : Uniquement les entretiens de ses véhicules
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
  FOR UPDATE USING (
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

-- ✅ TASKS : Uniquement les tâches de ses véhicules
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
  FOR UPDATE USING (
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

-- 🔔 REMINDERS : Uniquement les rappels de ses véhicules
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
  FOR UPDATE USING (
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

-- 📝 MAINTENANCE_TEMPLATES : Uniquement les templates de l'utilisateur
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
  FOR UPDATE USING (
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

-- 🔖 MAINTENANCE_PROFILES : Uniquement les profils de maintenance de l'utilisateur
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
  FOR UPDATE USING (
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

-- ========================================
-- ✅ VÉRIFICATION
-- ========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
