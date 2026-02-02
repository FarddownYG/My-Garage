-- 🔧 NETTOYAGE DES PROFILS MAL LIÉS
-- À exécuter dans Supabase SQL Editor

-- ========================================
-- ÉTAPE 1 : DIAGNOSTIC
-- ========================================

-- Voir tous les profils avec leur user_id
SELECT 
  id,
  name,
  first_name,
  user_id,
  is_migrated,
  migrated_at,
  created_at
FROM public.profiles
WHERE is_admin = false
ORDER BY created_at DESC;

-- Compter les profils par utilisateur
SELECT 
  user_id,
  COUNT(*) as profile_count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id;

-- ========================================
-- ÉTAPE 2 : IDENTIFIER LES DOUBLONS
-- ========================================

-- Trouver les utilisateurs avec plusieurs profils liés
SELECT 
  user_id,
  array_agg(name) as profile_names,
  array_agg(id) as profile_ids,
  COUNT(*) as count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ========================================
-- ÉTAPE 3 : CORRECTION MANUELLE
-- ========================================

-- ⚠️ ATTENTION : Remplacez les valeurs ci-dessous par les vraies

-- Option A : DÉLIER un profil mal lié
-- Remplacez 'PROFILE_ID_ICI' par l'ID du profil à délier
UPDATE public.profiles
SET 
  user_id = NULL,
  is_migrated = false,
  migrated_at = NULL
WHERE id = 'PROFILE_ID_ICI';

-- Option B : SUPPRIMER un profil en double
-- ⚠️ DANGER : Cette action supprime le profil ET ses véhicules !
-- Remplacez 'PROFILE_ID_ICI' par l'ID du profil à supprimer
-- DELETE FROM public.profiles WHERE id = 'PROFILE_ID_ICI';

-- ========================================
-- ÉTAPE 4 : VÉRIFICATION
-- ========================================

-- Vérifier qu'il n'y a plus de doublons
SELECT 
  user_id,
  COUNT(*) as profile_count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Devrait retourner 0 lignes si tout est OK

-- ========================================
-- ÉTAPE 5 : EMPÊCHER LES FUTURS DOUBLONS
-- ========================================

-- Créer une contrainte UNIQUE pour empêcher les doublons
-- ⚠️ Attention : Cela empêche un utilisateur d'avoir plusieurs profils
-- Si vous VOULEZ plusieurs profils par utilisateur, NE PAS exécuter ceci

-- ALTER TABLE public.profiles
-- ADD CONSTRAINT profiles_user_id_unique
-- UNIQUE (user_id)
-- WHERE user_id IS NOT NULL AND is_admin = false;

-- ========================================
-- UTILISATION PRATIQUE
-- ========================================

-- Exemple : Vous avez 2 comptes (User A et User B)
-- User A a créé le profil "Sarah"
-- User B s'inscrit et lie aussi "Sarah" par erreur

-- 1. Exécutez ÉTAPE 1 pour voir les profils
-- 2. Identifiez l'ID de "Sarah" lié à User B
-- 3. Exécutez Option A pour délier "Sarah" de User B
-- 4. User B devra créer son propre profil ou lier un autre profil non lié
