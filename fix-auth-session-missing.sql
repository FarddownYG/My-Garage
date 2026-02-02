-- ======================================
-- 🔧 FIX: Auth Session Missing
-- ======================================
-- Ce script corrige l'erreur "Auth session missing"
-- en permettant la lecture des profils non migrés
-- AVANT l'authentification
-- ======================================

-- 1️⃣ Modifier la policy SELECT sur profiles
-- ==========================================

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;

-- Nouvelle policy avec accès profils non migrés
CREATE POLICY "Users can view their own profiles" 
ON profiles FOR SELECT 
USING (
  user_id = auth.uid()           -- Profils du user connecté
  OR 
  user_id IS NULL                -- Profils legacy (non migrés) accessibles par tous
  OR
  (is_migrated IS NULL OR is_migrated = FALSE)  -- Profils non migrés accessibles
);

-- 2️⃣ Modifier la policy SELECT sur vehicles (pour count)
-- ==========================================

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;

-- Nouvelle policy avec accès véhicules des profils non migrés
CREATE POLICY "Users can view their own vehicles" 
ON vehicles FOR SELECT 
USING (
  user_id = auth.uid()           -- Véhicules du user connecté
  OR 
  user_id IS NULL                -- Véhicules legacy
  OR
  owner_id IN (                  -- Véhicules des profils non migrés (pour le count)
    SELECT id FROM profiles 
    WHERE is_migrated IS NULL OR is_migrated = FALSE
  )
);

-- 3️⃣ Alternative : Désactiver temporairement RLS sur profiles
-- ==========================================
-- Si vous préférez désactiver complètement RLS sur profiles
-- (ATTENTION : moins sécurisé, à utiliser seulement en dev)

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ⚠️ NE PAS FAIRE EN PRODUCTION !
-- Les profils seraient visibles par tous

-- ======================================
-- ✅ FIX TERMINÉ
-- ======================================
-- Les profils non migrés sont maintenant accessibles
-- SANS authentification pour permettre :
-- 1. checkMigrationPending() au démarrage
-- 2. getUnmigratedProfiles() dans MigrationScreen
-- 
-- Une fois migrés (user_id rempli), RLS s'applique normalement
-- ======================================
