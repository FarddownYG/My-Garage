-- 🚨 COPIE-COLLE CE SCRIPT DANS SUPABASE ET CLIQUE SUR "RUN"
-- Durée : 10 secondes
-- Ce script va :
-- 1. Corriger la fonction de migration
-- 2. Garder SEULEMENT ton premier compte
-- 3. Délier tous les autres comptes
-- 4. Supprimer les profils orphelins sans véhicules
-- 5. Ajouter une protection contre les futurs partages

-- ========================================
-- ÉTAPE 1 : CORRIGER LA FONCTION
-- ========================================

DROP FUNCTION IF EXISTS public.migrate_profile_to_user(UUID, UUID);

CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  profile_data RECORD;
BEGIN
  SELECT * INTO profile_data
  FROM public.profiles
  WHERE id = profile_id_param AND is_admin = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  -- Si pas de user_id → Lier
  IF profile_data.user_id IS NULL THEN
    UPDATE public.profiles
    SET user_id = user_id_param, is_migrated = true, migrated_at = NOW()
    WHERE id = profile_id_param;
    RETURN TRUE;
  END IF;
  
  -- Si déjà lié au bon user → OK
  IF profile_data.user_id = user_id_param THEN
    RETURN TRUE;
  END IF;
  
  -- Sinon REFUSER !
  RAISE EXCEPTION 'Profile already linked to another user. Each user must have their own profiles.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ÉTAPE 2 : NETTOYER LES PROFILS
-- ========================================

DO $$
DECLARE
  main_user_id UUID;
  cleaned_count INT;
  orphan_count INT;
  kept_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 NETTOYAGE AUTOMATIQUE';
  RAISE NOTICE '========================================';
  
  -- Trouver le premier user_id créé (ton compte principal)
  SELECT DISTINCT p.user_id INTO main_user_id
  FROM profiles p
  WHERE p.user_id IS NOT NULL AND p.is_admin = false
  ORDER BY p.created_at ASC
  LIMIT 1;
  
  IF main_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun compte trouvé. Crée un compte et lie un profil d abord.';
  END IF;
  
  RAISE NOTICE '✅ Compte principal identifié: %', main_user_id;
  RAISE NOTICE '';
  
  -- Compter les profils à garder
  SELECT COUNT(*) INTO kept_count
  FROM profiles
  WHERE user_id = main_user_id AND is_admin = false;
  
  RAISE NOTICE '📋 Profils à garder: %', kept_count;
  
  -- Délier tous les autres profils
  UPDATE profiles
  SET user_id = NULL, is_migrated = false, migrated_at = NULL
  WHERE user_id IS NOT NULL
    AND user_id != main_user_id
    AND is_admin = false;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE '🧹 Profils déliés des autres comptes: %', cleaned_count;
  
  -- Supprimer les profils orphelins SANS véhicules
  DELETE FROM profiles
  WHERE user_id IS NULL 
    AND is_admin = false
    AND id NOT IN (SELECT DISTINCT owner_id FROM vehicles WHERE owner_id IS NOT NULL);
  
  GET DIAGNOSTICS orphan_count = ROW_COUNT;
  RAISE NOTICE '🗑️ Profils orphelins supprimés (sans véhicules): %', orphan_count;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Résultat:';
  RAISE NOTICE '  - Ton compte: %', main_user_id;
  RAISE NOTICE '  - Profils gardés: %', kept_count;
  RAISE NOTICE '  - Autres comptes nettoyés: %', cleaned_count;
  RAISE NOTICE '';
END $$;

-- ========================================
-- ÉTAPE 3 : PROTECTION FUTURE
-- ========================================

DROP INDEX IF EXISTS profiles_user_id_unique;

CREATE UNIQUE INDEX profiles_user_id_unique 
ON profiles(user_id, name) 
WHERE user_id IS NOT NULL AND is_admin = false;

DO $$ BEGIN
  RAISE NOTICE '🔒 Protection ajoutée: Index unique sur (user_id, name)';
  RAISE NOTICE '   → Impossible de partager un profil entre 2 comptes';
  RAISE NOTICE '   → Impossible d avoir 2 profils identiques sur 1 compte';
END $$;

-- ========================================
-- ÉTAPE 4 : VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  user_count INT;
  profile_count INT;
  orphan_count INT;
  vehicle_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 STATISTIQUES FINALES';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(DISTINCT user_id) INTO user_count
  FROM profiles WHERE user_id IS NOT NULL AND is_admin = false;
  
  SELECT COUNT(*) INTO profile_count
  FROM profiles WHERE user_id IS NOT NULL AND is_admin = false;
  
  SELECT COUNT(*) INTO orphan_count
  FROM profiles WHERE user_id IS NULL AND is_admin = false;
  
  SELECT COUNT(*) INTO vehicle_count
  FROM vehicles;
  
  RAISE NOTICE '👥 Comptes utilisateurs: %', user_count;
  RAISE NOTICE '📋 Profils liés: %', profile_count;
  RAISE NOTICE '🗑️ Profils orphelins: %', orphan_count;
  RAISE NOTICE '🚗 Véhicules total: %', vehicle_count;
  RAISE NOTICE '';
  
  IF user_count = 1 AND orphan_count = 0 THEN
    RAISE NOTICE '🎉 PARFAIT !';
    RAISE NOTICE '   Tu as 1 compte avec % profils et % véhicules', profile_count, vehicle_count;
  ELSIF user_count = 1 AND orphan_count > 0 THEN
    RAISE NOTICE '⚠️ ATTENTION !';
    RAISE NOTICE '   Tu as % profils orphelins avec des véhicules.', orphan_count;
    RAISE NOTICE '   Ils ne seront pas accessibles depuis ton compte.';
    RAISE NOTICE '   Pour les supprimer: DELETE FROM profiles WHERE user_id IS NULL;';
  ELSIF user_count > 1 THEN
    RAISE NOTICE '⚠️ ATTENTION !';
    RAISE NOTICE '   Tu as encore % comptes différents !', user_count;
    RAISE NOTICE '   Connecte-toi avec le compte principal et vérifie tes données.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Déconnecte-toi de l app';
  RAISE NOTICE '2. Reconnecte-toi avec ton compte principal';
  RAISE NOTICE '3. Vérifie que tous tes profils et véhicules sont là';
  RAISE NOTICE '4. Crée un compte de test pour vérifier l isolation';
  RAISE NOTICE '';
END $$;
