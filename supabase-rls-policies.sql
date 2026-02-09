-- ============================================
-- 🔒 ROW LEVEL SECURITY (RLS) POLICIES
-- Pour une app multi-utilisateurs scalable
-- ============================================

-- 1️⃣ ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_profiles ENABLE ROW LEVEL SECURITY;

-- 2️⃣ POLICIES POUR LA TABLE "profiles"
-- ============================================

-- Lecture : Un utilisateur ne peut lire QUE ses propres profils
CREATE POLICY "Users can view their own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Insertion : Un utilisateur peut créer ses propres profils
CREATE POLICY "Users can create their own profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour : Un utilisateur ne peut modifier QUE ses propres profils
CREATE POLICY "Users can update their own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Suppression : Un utilisateur ne peut supprimer QUE ses propres profils
CREATE POLICY "Users can delete their own profiles"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 3️⃣ POLICIES POUR LA TABLE "vehicles"
-- ============================================

-- Lecture : Un utilisateur ne peut lire QUE les véhicules de ses profils
CREATE POLICY "Users can view their own vehicles"
  ON vehicles FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Insertion : Un utilisateur peut créer des véhicules pour ses profils
CREATE POLICY "Users can create vehicles for their profiles"
  ON vehicles FOR INSERT
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Mise à jour : Un utilisateur peut modifier ses véhicules
CREATE POLICY "Users can update their own vehicles"
  ON vehicles FOR UPDATE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Suppression : Un utilisateur peut supprimer ses véhicules
CREATE POLICY "Users can delete their own vehicles"
  ON vehicles FOR DELETE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 4️⃣ POLICIES POUR "maintenance_entries"
-- ============================================

CREATE POLICY "Users can view their own maintenance entries"
  ON maintenance_entries FOR SELECT
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create maintenance entries for their vehicles"
  ON maintenance_entries FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own maintenance entries"
  ON maintenance_entries FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own maintenance entries"
  ON maintenance_entries FOR DELETE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 5️⃣ POLICIES POUR "tasks"
-- ============================================

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their vehicles"
  ON tasks FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 6️⃣ POLICIES POUR "reminders"
-- ============================================

CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for their vehicles"
  ON reminders FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      INNER JOIN profiles p ON v.owner_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- 7️⃣ POLICIES POUR "maintenance_templates"
-- ============================================

CREATE POLICY "Users can view their own maintenance templates"
  ON maintenance_templates FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create maintenance templates for their profiles"
  ON maintenance_templates FOR INSERT
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own maintenance templates"
  ON maintenance_templates FOR UPDATE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own maintenance templates"
  ON maintenance_templates FOR DELETE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 8️⃣ POLICIES POUR "maintenance_profiles"
-- ============================================

CREATE POLICY "Users can view their own maintenance profiles"
  ON maintenance_profiles FOR SELECT
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create maintenance profiles for their profiles"
  ON maintenance_profiles FOR INSERT
  WITH CHECK (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own maintenance profiles"
  ON maintenance_profiles FOR UPDATE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own maintenance profiles"
  ON maintenance_profiles FOR DELETE
  USING (
    owner_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 9️⃣ POLICY POUR "app_config" (lecture publique)
-- ============================================

-- Tout le monde peut lire la config globale (admin_pin, etc.)
CREATE POLICY "Anyone can read app config"
  ON app_config FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier (tu peux ajouter une logique plus complexe)
CREATE POLICY "Only admins can update app config"
  ON app_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- ============================================
-- ✅ TERMINÉ !
-- ============================================
-- Exécute ce script dans l'éditeur SQL de Supabase
-- pour activer la sécurité multi-utilisateurs
-- ============================================
