-- ========================================
-- 🔍 DIAGNOSTIC COMPLET SUPABASE
-- ========================================
-- Copiez/collez ce script dans Supabase SQL Editor
-- pour diagnostiquer le problème de migration

-- 1️⃣ Vérifier les colonnes de migration
SELECT 
  'Colonnes migration' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name IN ('user_id', 'is_migrated', 'migrated_at');
-- ATTENDU: count = 3

-- 2️⃣ Lister TOUS les profils (admin inclus)
SELECT 
  id,
  first_name || ' ' || COALESCE(last_name, '') as nom_complet,
  is_admin,
  user_id,
  is_migrated,
  migrated_at,
  CASE 
    WHEN is_admin THEN '🔧 ADMIN'
    WHEN user_id IS NOT NULL THEN '✅ MIGRÉ'
    WHEN user_id IS NULL THEN '❌ NON MIGRÉ'
  END as statut
FROM profiles
ORDER BY is_admin DESC, first_name;

-- 3️⃣ Compter les profils par statut
SELECT 
  CASE 
    WHEN is_admin THEN 'Admin'
    WHEN user_id IS NOT NULL THEN 'Migrés'
    WHEN user_id IS NULL THEN 'Non migrés'
  END as categorie,
  COUNT(*) as nombre
FROM profiles
GROUP BY 
  CASE 
    WHEN is_admin THEN 'Admin'
    WHEN user_id IS NOT NULL THEN 'Migrés'
    WHEN user_id IS NULL THEN 'Non migrés'
  END;

-- 4️⃣ Vérifier les utilisateurs Supabase Auth
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
    ELSE '⚠️ Email non confirmé'
  END as statut
FROM auth.users
ORDER BY created_at DESC;

-- 5️⃣ Vérifier si les profils non migrés ont des véhicules
SELECT 
  p.id,
  p.first_name,
  p.user_id,
  COUNT(v.id) as nb_vehicules,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ NON MIGRÉ'
    ELSE '✅ MIGRÉ'
  END as statut
FROM profiles p
LEFT JOIN vehicles v ON v.owner_id = p.id
WHERE p.is_admin = false
GROUP BY p.id, p.first_name, p.user_id
ORDER BY p.first_name;

-- 6️⃣ Vérifier la fonction de migration existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'migrate_profile_to_user';
-- ATTENDU: 1 ligne avec routine_type = 'FUNCTION'

-- 7️⃣ Vérifier les politiques RLS sur profiles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ========================================
-- 🔧 FIX RAPIDE (si nécessaire)
-- ========================================

-- Option A : Migrer MANUELLEMENT tous les profils vers votre compte
-- ⚠️ REMPLACEZ 'votre-email@example.com' par votre vrai email !
/*
UPDATE profiles
SET 
  user_id = (SELECT id FROM auth.users WHERE email = 'farcryde.911@gmail.com'),
  is_migrated = true,
  migrated_at = NOW()
WHERE is_admin = false 
  AND user_id IS NULL;
*/

-- Option B : Réinitialiser la migration (pour retester)
/*
UPDATE profiles
SET 
  user_id = NULL,
  is_migrated = false,
  migrated_at = NULL
WHERE is_admin = false;
*/

-- ========================================
-- 📊 RÉSULTAT ATTENDU
-- ========================================
-- 1. Colonnes migration : count = 3
-- 2. Profils : Voir tous vos profils (Sarah, Marc, etc.)
-- 3. Statut : Au moins 1 profil "Non migré"
-- 4. Utilisateurs : Votre email avec statut "Email confirmé"
-- 5. Véhicules : Vos profils ont des véhicules
-- 6. Fonction : migrate_profile_to_user existe
-- 7. RLS : Politiques configurées
