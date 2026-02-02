-- 🔧 SCRIPT COMPLET DE RÉPARATION
-- Exécutez ce script dans Supabase SQL Editor pour corriger tous les problèmes

-- ========================================
-- PARTIE 1 : DIAGNOSTIC
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 DIAGNOSTIC DES PROFILS';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les profils avec leur user_id
SELECT 
  '👤 Profil' as type,
  name,
  user_id::TEXT as user_id,
  is_migrated,
  created_at
FROM public.profiles
WHERE is_admin = false
ORDER BY created_at DESC;

-- Afficher les doublons
SELECT 
  '⚠️ DOUBLON' as type,
  user_id::TEXT,
  array_agg(name) as profile_names,
  COUNT(*) as count
FROM public.profiles
WHERE user_id IS NOT NULL AND is_admin = false
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ========================================
-- PARTIE 2 : CORRIGER LA FONCTION SQL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 CORRECTION FONCTION MIGRATION';
  RAISE NOTICE '========================================';
END $$;

CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
  profile_name TEXT;
BEGIN
  -- Récupérer les infos du profil
  SELECT user_id, name INTO existing_user_id, profile_name
  FROM public.profiles
  WHERE id = profile_id_param AND is_admin = false;
  
  -- Vérifier si le profil existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found or is admin profile', profile_id_param;
  END IF;
  
  -- ✅ REFUSER si déjà lié à un autre utilisateur
  IF existing_user_id IS NOT NULL AND existing_user_id != user_id_param THEN
    RAISE EXCEPTION 'Profile "%" (%) is already linked to another user (%)', 
      profile_name, profile_id_param, existing_user_id;
  END IF;
  
  -- ✅ IGNORER si déjà lié au bon utilisateur
  IF existing_user_id = user_id_param THEN
    RAISE NOTICE 'Profile "%" (%) already linked to user %', 
      profile_name, profile_id_param, user_id_param;
    RETURN TRUE;
  END IF;
  
  -- Lier le profil à l'utilisateur
  UPDATE public.profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;
  
  RAISE NOTICE '✅ Profile "%" (%) successfully linked to user %', 
    profile_name, profile_id_param, user_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTIE 3 : AJOUTER UNE CONTRAINTE UNIQUE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔒 AJOUT CONTRAINTE UNIQUE';
  RAISE NOTICE '========================================';
  
  -- Supprimer l'ancienne contrainte si elle existe
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_one_per_user;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Pas de contrainte existante à supprimer';
  END;
  
  -- Ajouter la nouvelle contrainte
  -- ⚠️ ATTENTION : Cela empêche un utilisateur d'avoir plusieurs profils
  -- Si vous voulez permettre plusieurs profils par utilisateur, commentez cette ligne
  ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_one_per_user
  UNIQUE (user_id)
  WHERE user_id IS NOT NULL AND is_admin = false;
  
  RAISE NOTICE '✅ Contrainte unique ajoutée : un utilisateur = un profil maximum';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '⚠️ ERREUR : Des doublons existent ! Nettoyez-les d abord (voir PARTIE 4)';
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Erreur ajout contrainte : %', SQLERRM;
END $$;

-- ========================================
-- PARTIE 4 : NETTOYER LES DOUBLONS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧹 NETTOYAGE DES DOUBLONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️ CETTE PARTIE NÉCESSITE UNE ACTION MANUELLE';
  RAISE NOTICE '';
  RAISE NOTICE 'Si vous avez des doublons (voir diagnostic ci-dessus),';
  RAISE NOTICE 'vous devez choisir manuellement quel profil garder.';
  RAISE NOTICE '';
  RAISE NOTICE 'Exemple de commande pour délier un profil :';
  RAISE NOTICE 'UPDATE public.profiles SET user_id = NULL WHERE id = ''ID_DU_PROFIL'';';
  RAISE NOTICE '';
END $$;

-- EXEMPLE : Délier tous les profils sauf le premier créé pour chaque utilisateur
-- ⚠️ DÉCOMMENTEZ UNIQUEMENT SI VOUS ÊTES SÛR DE VOULOIR CELA
/*
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    name,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.profiles
  WHERE user_id IS NOT NULL AND is_admin = false
)
UPDATE public.profiles
SET 
  user_id = NULL,
  is_migrated = false,
  migrated_at = NULL
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);
*/

-- ========================================
-- PARTIE 5 : VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  duplicate_count INT;
  profile_count INT;
  user_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  
  -- Compter les doublons
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM public.profiles
    WHERE user_id IS NOT NULL AND is_admin = false
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) as duplicates;
  
  -- Compter les profils
  SELECT COUNT(*) INTO profile_count
  FROM public.profiles
  WHERE user_id IS NOT NULL AND is_admin = false;
  
  -- Compter les utilisateurs uniques
  SELECT COUNT(DISTINCT user_id) INTO user_count
  FROM public.profiles
  WHERE user_id IS NOT NULL AND is_admin = false;
  
  RAISE NOTICE '📊 Statistiques :';
  RAISE NOTICE '  - Profils liés : %', profile_count;
  RAISE NOTICE '  - Utilisateurs uniques : %', user_count;
  RAISE NOTICE '  - Doublons : %', duplicate_count;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TOUT EST OK ! Pas de doublons.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ATTENTION : % doublons détectés !', duplicate_count;
    RAISE NOTICE 'Nettoyez-les manuellement (voir PARTIE 4)';
  END IF;
END $$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '1. Vérifiez les résultats ci-dessus';
  RAISE NOTICE '2. Si des doublons existent, nettoyez-les manuellement';
  RAISE NOTICE '3. Testez la création d un nouveau compte';
  RAISE NOTICE '4. Vérifiez que AdminPanel affiche les utilisateurs';
  RAISE NOTICE '';
END $$;
