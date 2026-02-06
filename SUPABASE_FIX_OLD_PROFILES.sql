-- 🔧 SOLUTION : Lier les anciens profils orphelins à ton compte admin
-- Cela empêche les nouveaux comptes de les lier automatiquement

-- ========================================
-- ÉTAPE 1 : IDENTIFIER TON USER_ID
-- ========================================

-- Trouver ton user_id depuis tes profils principaux
SELECT 
  'Ton User ID:' as label,
  user_id
FROM profiles
WHERE (name ILIKE '%sarah%' OR name ILIKE '%marc%')
  AND user_id IS NOT NULL
LIMIT 1;

-- Si cette requête ne retourne rien, exécute celle-ci :
SELECT 
  'Profils avec user_id' as label,
  name,
  user_id
FROM profiles
WHERE user_id IS NOT NULL AND is_admin = false
ORDER BY created_at ASC;

-- ========================================
-- ÉTAPE 2 : VOIR LES PROFILS ORPHELINS
-- ========================================

SELECT 
  id,
  name,
  user_id,
  created_at,
  (SELECT COUNT(*) FROM vehicles WHERE owner_id = profiles.id) as vehicle_count
FROM profiles
WHERE user_id IS NULL 
  AND is_admin = false
ORDER BY created_at;

-- ========================================
-- ÉTAPE 3 : LIER "juste_un_gas" À TON COMPTE
-- ========================================

-- ⚠️ REMPLACE 'TON_USER_ID_ICI' par ton vrai user_id de l'ÉTAPE 1

DO $$
DECLARE
  admin_user_id UUID;
  gas_profile_id UUID;
BEGIN
  -- Récupérer ton user_id (le premier profil avec user_id)
  SELECT user_id INTO admin_user_id
  FROM profiles
  WHERE user_id IS NOT NULL AND is_admin = false
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun user_id trouvé. Crée d abord un compte et lie un profil.';
  END IF;
  
  RAISE NOTICE 'User ID trouvé: %', admin_user_id;
  
  -- Lier "juste_un_gas" à ce user_id
  UPDATE profiles
  SET 
    user_id = admin_user_id,
    is_migrated = true,
    migrated_at = NOW()
  WHERE name ILIKE '%juste_un_gas%'
    AND user_id IS NULL
  RETURNING id INTO gas_profile_id;
  
  IF gas_profile_id IS NOT NULL THEN
    RAISE NOTICE '✅ Profil "juste_un_gas" (%) lié au user %', gas_profile_id, admin_user_id;
  ELSE
    RAISE NOTICE '⚠️ Profil "juste_un_gas" non trouvé ou déjà lié';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 4 : VÉRIFICATION
-- ========================================

-- Vérifier que "juste_un_gas" a maintenant un user_id
SELECT 
  'Vérification' as label,
  name,
  user_id,
  is_migrated
FROM profiles
WHERE name ILIKE '%juste_un_gas%';

-- Voir les profils encore orphelins
SELECT 
  'Profils orphelins restants' as label,
  COUNT(*) as count
FROM profiles
WHERE user_id IS NULL AND is_admin = false;

-- ========================================
-- ALTERNATIVE : SUPPRIMER LES ORPHELINS
-- ========================================

-- ⚠️ DANGER : Cela supprime définitivement les profils ET leurs véhicules !
-- Décommente seulement si tu es SÛR de vouloir supprimer "juste_un_gas"

/*
DO $$
DECLARE
  deleted_count INT;
BEGIN
  -- Supprimer les profils orphelins sans véhicules
  DELETE FROM profiles
  WHERE user_id IS NULL 
    AND is_admin = false
    AND id NOT IN (SELECT DISTINCT owner_id FROM vehicles);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE '🗑️ % profils orphelins supprimés', deleted_count;
END $$;
*/
