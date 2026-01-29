-- 🔐 Security Upgrade Script pour Valcar App
-- Ce script prépare la base de données pour le stockage sécurisé des PINs hashés
-- 
-- Exécution: Supabase SQL Editor
-- Durée: < 1 seconde
-- Impact: Aucun (modification de schema uniquement)

-- ========================================
-- ÉTAPE 1: Modifier les colonnes de PIN
-- ========================================

-- Les hash bcrypt font toujours 60 caractères
-- Format: $2a$10$... ou $2b$10$... ou $2y$10$...
-- Exemple: $2a$10$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqr

-- Modifier admin_pin dans app_config
ALTER TABLE app_config
ALTER COLUMN admin_pin TYPE VARCHAR(60);

-- Modifier pin dans profiles
ALTER TABLE profiles
ALTER COLUMN pin TYPE VARCHAR(60);

-- ========================================
-- ÉTAPE 2: Ajouter des index pour performance
-- ========================================

-- Index sur admin_pin pour recherche rapide (si pas déjà existant)
CREATE INDEX IF NOT EXISTS idx_app_config_admin_pin 
  ON app_config(admin_pin);

-- Index sur profiles.pin pour vérification rapide
CREATE INDEX IF NOT EXISTS idx_profiles_pin 
  ON profiles(pin) 
  WHERE pin IS NOT NULL;

-- ========================================
-- ÉTAPE 3: Vérification des modifications
-- ========================================

-- Cette requête affiche les colonnes modifiées
SELECT 
  table_name,
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('app_config', 'profiles')
  AND column_name IN ('admin_pin', 'pin')
ORDER BY table_name, column_name;

-- Résultat attendu:
-- table_name  | column_name | data_type        | character_maximum_length
-- ------------|-------------|------------------|-------------------------
-- app_config  | admin_pin   | character varying| 60
-- profiles    | pin         | character varying| 60

-- ========================================
-- ÉTAPE 4: Statistiques actuelles
-- ========================================

-- Afficher le nombre de profils avec PIN
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN pin IS NOT NULL THEN 1 END) as profiles_with_pin,
  COUNT(CASE WHEN pin IS NULL THEN 1 END) as profiles_without_pin
FROM profiles;

-- Afficher la configuration actuelle
SELECT 
  id,
  CASE 
    WHEN admin_pin ~ '^\$2[aby]\$\d{2}\$' THEN 'Hashé (bcrypt)'
    ELSE 'En clair (à migrer)'
  END as pin_status,
  LENGTH(admin_pin) as pin_length,
  current_profile_id
FROM app_config
WHERE id = 'global';

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

/*
✅ CE SCRIPT EST SÉCURISÉ
- Aucune donnée n'est supprimée
- Aucune donnée n'est modifiée
- Seul le type de colonne est élargi (VARCHAR(4) → VARCHAR(60))
- Les PINs existants restent fonctionnels

✅ MIGRATION AUTOMATIQUE
- L'application React détectera les PINs en clair
- Conversion automatique en hash bcrypt
- Migration transparente pour l'utilisateur
- Temps: < 500ms par PIN

✅ ROLLBACK POSSIBLE
Si vous voulez revenir en arrière (NON RECOMMANDÉ):

ALTER TABLE app_config ALTER COLUMN admin_pin TYPE VARCHAR(4);
ALTER TABLE profiles ALTER COLUMN pin TYPE VARCHAR(4);

⚠️ Mais vous perdrez les hash et devrez reconfigurer les PINs manuellement

✅ COMPATIBILITÉ
- PINs existants (4 caractères) : ✅ Fonctionnent
- Nouveaux hash bcrypt (60 caractères) : ✅ Fonctionnent
- Transition graduelle : ✅ Automatique

*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Script de sécurité exécuté avec succès !';
  RAISE NOTICE '📊 Les colonnes PIN peuvent maintenant stocker des hash bcrypt';
  RAISE NOTICE '🚀 Rafraîchissez votre application pour activer la migration automatique';
  RAISE NOTICE '🔒 Vos PINs seront hashés au prochain login';
END $$;
