-- ======================================
-- 🔐 MIGRATION SUPABASE AUTH
-- ======================================
-- Ce script ajoute l'authentification Supabase
-- SANS perdre les données existantes
-- ======================================

-- 1️⃣ Ajouter user_id aux tables existantes
-- ==========================================

-- Profiles : lien vers auth.users
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT FALSE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_migrated ON profiles(is_migrated);

-- Vehicles : lien vers auth.users
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Maintenance entries
ALTER TABLE maintenance_entries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_maintenance_entries_user_id ON maintenance_entries(user_id);

-- Tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Reminders
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- Maintenance templates
ALTER TABLE maintenance_templates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_maintenance_templates_user_id ON maintenance_templates(user_id);

-- Maintenance profiles
ALTER TABLE maintenance_profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_maintenance_profiles_user_id ON maintenance_profiles(user_id);

-- 2️⃣ Row Level Security (RLS)
-- ==========================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- 3️⃣ Policies : Chaque user voit UNIQUEMENT ses données
-- ==========================================

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
CREATE POLICY "Users can view their own profiles" 
ON profiles FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL); -- NULL = profils non migrés (legacy)

DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
CREATE POLICY "Users can insert their own profiles" 
ON profiles FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
CREATE POLICY "Users can update their own profiles" 
ON profiles FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own profiles" ON profiles;
CREATE POLICY "Users can delete their own profiles" 
ON profiles FOR DELETE 
USING (user_id = auth.uid());

-- VEHICLES
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
CREATE POLICY "Users can view their own vehicles" 
ON vehicles FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
CREATE POLICY "Users can insert their own vehicles" 
ON vehicles FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
CREATE POLICY "Users can update their own vehicles" 
ON vehicles FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
CREATE POLICY "Users can delete their own vehicles" 
ON vehicles FOR DELETE 
USING (user_id = auth.uid());

-- MAINTENANCE ENTRIES
DROP POLICY IF EXISTS "Users can view their own maintenance" ON maintenance_entries;
CREATE POLICY "Users can view their own maintenance" 
ON maintenance_entries FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own maintenance" ON maintenance_entries;
CREATE POLICY "Users can insert their own maintenance" 
ON maintenance_entries FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own maintenance" ON maintenance_entries;
CREATE POLICY "Users can update their own maintenance" 
ON maintenance_entries FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own maintenance" ON maintenance_entries;
CREATE POLICY "Users can delete their own maintenance" 
ON maintenance_entries FOR DELETE 
USING (user_id = auth.uid());

-- TASKS
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" 
ON tasks FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks" 
ON tasks FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" 
ON tasks FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" 
ON tasks FOR DELETE 
USING (user_id = auth.uid());

-- REMINDERS
DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
CREATE POLICY "Users can view their own reminders" 
ON reminders FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON reminders;
CREATE POLICY "Users can insert their own reminders" 
ON reminders FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reminders" ON reminders;
CREATE POLICY "Users can update their own reminders" 
ON reminders FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON reminders;
CREATE POLICY "Users can delete their own reminders" 
ON reminders FOR DELETE 
USING (user_id = auth.uid());

-- MAINTENANCE TEMPLATES
DROP POLICY IF EXISTS "Users can view their own templates" ON maintenance_templates;
CREATE POLICY "Users can view their own templates" 
ON maintenance_templates FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own templates" ON maintenance_templates;
CREATE POLICY "Users can insert their own templates" 
ON maintenance_templates FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own templates" ON maintenance_templates;
CREATE POLICY "Users can update their own templates" 
ON maintenance_templates FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own templates" ON maintenance_templates;
CREATE POLICY "Users can delete their own templates" 
ON maintenance_templates FOR DELETE 
USING (user_id = auth.uid());

-- MAINTENANCE PROFILES
DROP POLICY IF EXISTS "Users can view their own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can view their own maintenance profiles" 
ON maintenance_profiles FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can insert their own maintenance profiles" 
ON maintenance_profiles FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can update their own maintenance profiles" 
ON maintenance_profiles FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own maintenance profiles" ON maintenance_profiles;
CREATE POLICY "Users can delete their own maintenance profiles" 
ON maintenance_profiles FOR DELETE 
USING (user_id = auth.uid());

-- 4️⃣ Fonction de migration automatique
-- ==========================================

-- Fonction pour migrer un profil vers un user
CREATE OR REPLACE FUNCTION migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
) RETURNS void AS $$
BEGIN
  -- Mettre à jour le profil
  UPDATE profiles
  SET 
    user_id = user_id_param,
    migrated_at = NOW(),
    is_migrated = TRUE
  WHERE id = profile_id_param;

  -- Migrer tous les véhicules
  UPDATE vehicles
  SET user_id = user_id_param
  WHERE owner_id = profile_id_param;

  -- Migrer les maintenance entries
  UPDATE maintenance_entries
  SET user_id = user_id_param
  WHERE vehicle_id IN (
    SELECT id FROM vehicles WHERE owner_id = profile_id_param
  );

  -- Migrer les tasks
  UPDATE tasks
  SET user_id = user_id_param
  WHERE vehicle_id IN (
    SELECT id FROM vehicles WHERE owner_id = profile_id_param
  );

  -- Migrer les reminders
  UPDATE reminders
  SET user_id = user_id_param
  WHERE vehicle_id IN (
    SELECT id FROM vehicles WHERE owner_id = profile_id_param
  );

  -- Migrer les templates
  UPDATE maintenance_templates
  SET user_id = user_id_param
  WHERE owner_id = profile_id_param;

  -- Migrer les maintenance profiles
  UPDATE maintenance_profiles
  SET user_id = user_id_param
  WHERE owner_id = profile_id_param;
  
  RAISE NOTICE 'Profile % migrated to user %', profile_id_param, user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ Fonction pour obtenir tous les profils non migrés
-- ==========================================

CREATE OR REPLACE FUNCTION get_unmigrated_profiles()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  avatar TEXT,
  vehicle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.name,
    p.avatar,
    COUNT(v.id) as vehicle_count
  FROM profiles p
  LEFT JOIN vehicles v ON v.owner_id = p.id
  WHERE p.is_migrated = FALSE AND p.is_admin = FALSE
  GROUP BY p.id, p.first_name, p.last_name, p.name, p.avatar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ Trigger : Auto-assign user_id lors de l'insertion
-- ==========================================

-- Fonction trigger pour vehicles
CREATE OR REPLACE FUNCTION auto_assign_user_id_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_assign_user_id_vehicles_trigger ON vehicles;
CREATE TRIGGER auto_assign_user_id_vehicles_trigger
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_id_vehicles();

-- Fonction trigger pour maintenance_entries
CREATE OR REPLACE FUNCTION auto_assign_user_id_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_assign_user_id_maintenance_trigger ON maintenance_entries;
CREATE TRIGGER auto_assign_user_id_maintenance_trigger
  BEFORE INSERT ON maintenance_entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_id_maintenance();

-- Idem pour tasks
CREATE OR REPLACE FUNCTION auto_assign_user_id_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_assign_user_id_tasks_trigger ON tasks;
CREATE TRIGGER auto_assign_user_id_tasks_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_id_tasks();

-- ======================================
-- ✅ MIGRATION TERMINÉE !
-- ======================================
-- Les données existantes sont conservées
-- RLS activé pour sécurité multi-users
-- user_id IS NULL = profils legacy (non migrés)
-- ======================================

-- Vérification des profils non migrés
SELECT * FROM get_unmigrated_profiles();
