-- Script de nettoyage des doublons dans maintenance_templates
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Identifier et afficher les doublons
SELECT 
  name, 
  owner_id, 
  profile_id,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at) as template_ids
FROM maintenance_templates
GROUP BY name, owner_id, profile_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Supprimer les doublons en gardant le premier créé (le plus ancien)
-- Cette requête supprime tous les templates sauf le premier de chaque groupe
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, owner_id, COALESCE(profile_id, '') 
      ORDER BY created_at ASC
    ) as rn
  FROM maintenance_templates
)
DELETE FROM maintenance_templates
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- 3. Vérifier qu'il n'y a plus de doublons
SELECT 
  name, 
  owner_id, 
  profile_id,
  COUNT(*) as count
FROM maintenance_templates
GROUP BY name, owner_id, profile_id
HAVING COUNT(*) > 1;

-- 4. Optionnel : Ajouter une contrainte unique pour éviter les doublons futurs
-- Note: Cette contrainte empêchera l'insertion de doublons
-- Décommenter si vous voulez l'activer
-- ALTER TABLE maintenance_templates 
-- ADD CONSTRAINT unique_template_per_profile 
-- UNIQUE (name, owner_id, COALESCE(profile_id, ''));
