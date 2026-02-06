-- 🔧 SOLUTION FINALE : ISOLATION COMPLÈTE DES PROFILS PAR UTILISATEUR
-- Chaque utilisateur aura ses PROPRES profils, JAMAIS partagés

-- ========================================
-- DIAGNOSTIC : VOIR LE PROBLÈME ACTUEL
-- ========================================

-- 1. Voir les profils partagés (plusieurs users sur même profil)
SELECT 
  'PROBLÈME DÉTECTÉ' as alerte,
  p.name as profil,
  COUNT(DISTINCT p.user_id) as nb_users_differents,
  array_agg(DISTINCT p.user_id::text) as user_ids
FROM profiles p
WHERE p.user_id IS NOT NULL AND p.is_admin = false
GROUP BY p.name
HAVING COUNT(DISTINCT p.user_id) > 1;

-- ⚠️ Si cette requête retourne des lignes = PROBLÈME CRITIQUE

-- ========================================
-- ÉTAPE 1 : BLOQUER LE PARTAGE DE PROFILS
-- ========================================

-- Supprimer l'ancienne fonction dangereuse
DROP FUNCTION IF EXISTS public.migrate_profile_to_user(UUID, UUID);

-- Créer une nouvelle fonction qui DUPLIQUE au lieu de LIER
CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
  new_profile_id UUID;
  profile_data RECORD;
BEGIN
  -- Récupérer les données du profil
  SELECT * INTO profile_data
  FROM public.profiles
  WHERE id = profile_id_param AND is_admin = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', profile_id_param;
  END IF;
  
  -- Vérifier si l'utilisateur a DÉJÀ un profil avec ce nom
  SELECT id INTO existing_user_id
  FROM public.profiles
  WHERE user_id = user_id_param 
    AND name = profile_data.name
    AND is_admin = false;
  
  IF existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a profile named "%"', profile_data.name;
  END IF;
  
  -- Si le profil n'est pas encore lié → LE LIER DIRECTEMENT
  IF profile_data.user_id IS NULL THEN
    UPDATE public.profiles
    SET 
      user_id = user_id_param,
      is_migrated = true,
      migrated_at = NOW()
    WHERE id = profile_id_param;
    
    RAISE NOTICE '✅ Profile "%" linked to user', profile_data.name;
    RETURN TRUE;
  END IF;
  
  -- Si le profil est déjà lié à CE user → OK
  IF profile_data.user_id = user_id_param THEN
    RAISE NOTICE '✅ Profile already linked to this user';
    RETURN TRUE;
  END IF;
  
  -- ❌ Si le profil est lié à un AUTRE user → REFUSER !
  RAISE EXCEPTION 'Profile "%" is already linked to another user. Each user must have their own profiles.', profile_data.name;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ÉTAPE 2 : NETTOYER LES PROFILS ACTUELS
-- ========================================

-- Voir l'état actuel
SELECT 
  '📊 État actuel' as info,
  p.id,
  p.name,
  p.user_id,
  (SELECT COUNT(*) FROM vehicles WHERE owner_id = p.id) as nb_vehicules,
  p.created_at
FROM profiles p
WHERE p.is_admin = false
ORDER BY p.user_id, p.created_at;

-- Identifier TON compte principal (le premier créé)
DO $$
DECLARE
  main_user_id UUID;
  main_email TEXT;
BEGIN
  -- Trouver le premier user_id créé
  SELECT DISTINCT p.user_id INTO main_user_id
  FROM profiles p
  WHERE p.user_id IS NOT NULL AND p.is_admin = false
  ORDER BY p.created_at ASC
  LIMIT 1;
  
  IF main_user_id IS NOT NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 TON COMPTE PRINCIPAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'User ID: %', main_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Profils liés à ce compte:';
    
    -- Lister les profils de ce compte
    FOR main_email IN 
      SELECT p.name
      FROM profiles p
      WHERE p.user_id = main_user_id AND p.is_admin = false
      ORDER BY p.created_at
    LOOP
      RAISE NOTICE '  - %', main_email;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ GARDE CE USER_ID : %', main_user_id;
    RAISE NOTICE '   Tous les autres profils avec un user_id différent seront déliés';
  ELSE
    RAISE NOTICE '❌ Aucun profil lié trouvé';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 3 : DÉLIER LES PROFILS DES AUTRES COMPTES
-- ========================================

-- ⚠️ CETTE PARTIE DOIT ÊTRE EXÉCUTÉE MANUELLEMENT
-- Remplace 'TON_USER_ID_PRINCIPAL' par le User ID affiché ci-dessus

DO $$
DECLARE
  main_user_id UUID;
  other_user_count INT;
BEGIN
  -- Trouver ton user_id principal (le premier créé)
  SELECT DISTINCT p.user_id INTO main_user_id
  FROM profiles p
  WHERE p.user_id IS NOT NULL AND p.is_admin = false
  ORDER BY p.created_at ASC
  LIMIT 1;
  
  IF main_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun compte principal trouvé';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧹 NETTOYAGE DES PROFILS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Compte principal: %', main_user_id;
  RAISE NOTICE '';
  
  -- Délier tous les profils qui ne sont PAS sur le compte principal
  UPDATE profiles
  SET 
    user_id = NULL,
    is_migrated = false,
    migrated_at = NULL
  WHERE user_id IS NOT NULL
    AND user_id != main_user_id
    AND is_admin = false;
  
  GET DIAGNOSTICS other_user_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % profils déliés des autres comptes', other_user_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Ces profils sont maintenant orphelins et peuvent être:';
  RAISE NOTICE '  - Supprimés si tu ne les veux plus';
  RAISE NOTICE '  - Liés à de nouveaux comptes';
END $$;

-- ========================================
-- ÉTAPE 4 : SUPPRIMER LES COMPTES VIDES
-- ========================================

-- Voir les profils orphelins
SELECT 
  '🗑️ Profils orphelins (sans user_id)' as info,
  id,
  name,
  (SELECT COUNT(*) FROM vehicles WHERE owner_id = profiles.id) as nb_vehicules,
  created_at
FROM profiles
WHERE user_id IS NULL AND is_admin = false
ORDER BY created_at;

-- OPTION A : Supprimer les profils orphelins SANS véhicules
DELETE FROM profiles
WHERE user_id IS NULL 
  AND is_admin = false
  AND id NOT IN (SELECT DISTINCT owner_id FROM vehicles);

-- OPTION B : Supprimer un profil orphelin spécifique (même avec véhicules)
-- ⚠️ DANGER : Cela supprime aussi les véhicules !
-- DELETE FROM profiles WHERE id = 'ID_DU_PROFIL_A_SUPPRIMER';

-- ========================================
-- ÉTAPE 5 : CONTRAINTE UNIQUE PAR UTILISATEUR
-- ========================================

-- Empêcher qu'un profil soit lié à plusieurs utilisateurs
DROP INDEX IF EXISTS profiles_user_id_unique;

-- Créer un index unique sur (user_id, name)
-- Cela empêche un utilisateur d'avoir 2 profils avec le même nom
-- ET empêche qu'un profil soit partagé entre utilisateurs
CREATE UNIQUE INDEX profiles_user_id_unique 
ON profiles(user_id, name) 
WHERE user_id IS NOT NULL AND is_admin = false;

-- ========================================
-- ÉTAPE 6 : VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  user_count INT;
  profile_count INT;
  orphan_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  
  -- Compter les utilisateurs uniques
  SELECT COUNT(DISTINCT user_id) INTO user_count
  FROM profiles
  WHERE user_id IS NOT NULL AND is_admin = false;
  
  -- Compter les profils liés
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE user_id IS NOT NULL AND is_admin = false;
  
  -- Compter les profils orphelins
  SELECT COUNT(*) INTO orphan_count
  FROM profiles
  WHERE user_id IS NULL AND is_admin = false;
  
  RAISE NOTICE '👥 Utilisateurs: %', user_count;
  RAISE NOTICE '📋 Profils liés: %', profile_count;
  RAISE NOTICE '🗑️ Profils orphelins: %', orphan_count;
  RAISE NOTICE '';
  
  IF user_count = 1 AND orphan_count = 0 THEN
    RAISE NOTICE '🎉 PARFAIT ! Tu as 1 compte avec % profils', profile_count;
    RAISE NOTICE '    Tous les autres comptes ont été nettoyés.';
  ELSIF user_count > 1 THEN
    RAISE NOTICE '⚠️ ATTENTION : % comptes différents détectés', user_count;
    RAISE NOTICE '    Les nouveaux comptes ne pourront plus voler tes profils,';
    RAISE NOTICE '    mais tu peux avoir des profils en double.';
  END IF;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '💡 Tu as % profils orphelins. Tu peux:', orphan_count;
    RAISE NOTICE '    - Les supprimer si tu ne les veux plus';
    RAISE NOTICE '    - Les lier à un nouveau compte';
  END IF;
END $$;

-- ========================================
-- RÉCUPÉRATION DES DONNÉES PERDUES
-- ========================================

-- Si tu as supprimé des véhicules par erreur, vérifie dans Supabase Dashboard
-- → Table "vehicles" → Filtrer par owner_id

-- Malheureusement, si les données ont été SUPPRIMÉES (pas juste déliées),
-- elles ne peuvent pas être récupérées sans backup.

-- Pour éviter ça à l'avenir, active le "Soft Delete" dans Supabase:
-- → Settings → Database → Point-in-time Recovery (PITR)
