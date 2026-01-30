-- 📸 Script SQL pour ajouter les colonnes photos et documents
-- Ce script vérifie et ajoute les colonnes si elles n'existent pas déjà

-- ========================================
-- ÉTAPE 1: Ajouter la colonne photos
-- ========================================

-- Ajouter colonne photos (array de text pour stocker les URLs base64)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='vehicles' AND column_name='photos'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN photos TEXT[];
    RAISE NOTICE '✅ Colonne photos ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne photos existe déjà';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 2: Ajouter la colonne documents
-- ========================================

-- Ajouter colonne documents (JSONB pour stocker les documents structurés)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='vehicles' AND column_name='documents'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN documents JSONB;
    RAISE NOTICE '✅ Colonne documents ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne documents existe déjà';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 3: Créer des index pour performance
-- ========================================

-- Index GIN pour recherche dans le JSONB documents (optionnel)
CREATE INDEX IF NOT EXISTS idx_vehicles_documents 
  ON vehicles USING GIN (documents);

-- ========================================
-- ÉTAPE 4: Vérification
-- ========================================

-- Afficher les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN ('photos', 'documents')
ORDER BY column_name;

-- ========================================
-- RÉSULTAT ATTENDU
-- ========================================

/*
column_name | data_type       | is_nullable
------------|-----------------|------------
documents   | jsonb           | YES
photos      | ARRAY           | YES

✅ Si vous voyez ces deux lignes, c'est prêt !
*/

-- ========================================
-- NOTES TECHNIQUES
-- ========================================

/*
📸 PHOTOS (TEXT[])
- Stocke un tableau d'URLs base64
- Exemple: [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/png;base64,iVBORw0KGgoA..."
  ]
- Avantages : Pas besoin de serveur d'images séparé
- Limites : Taille max recommandée ~10 photos (5MB chacune)

📄 DOCUMENTS (JSONB)
- Stocke un tableau d'objets structurés
- Exemple: [
    {
      "id": "1706543210000-0",
      "name": "facture-vidange-2024.pdf",
      "url": "data:application/pdf;base64,JVBERi0xLj...",
      "type": "pdf",
      "uploadedAt": "2024-01-29T10:00:00.000Z",
      "size": 52428
    },
    {
      "id": "1706543220000-0",
      "name": "carte-grise.jpg",
      "url": "data:image/jpeg;base64,/9j/4AAQ...",
      "type": "photo",
      "uploadedAt": "2024-01-29T10:01:00.000Z",
      "size": 1048576
    }
  ]
- Avantages : Métadonnées riches, recherche JSON possible
- Types supportés : photo, pdf, document

⚠️ LIMITES DE STOCKAGE
- PostgreSQL max row size: 1GB (théorique)
- Recommandé par véhicule :
  - Photos : Max 10 photos (~50MB total)
  - Documents : Max 20 documents (~100MB total)
- Si besoin de plus : Utiliser Supabase Storage (fichiers séparés)

🔒 SÉCURITÉ
- Les données sont stockées en base64 dans Supabase
- Accessible uniquement via RLS (Row Level Security)
- Recommandé : Activer RLS sur la table vehicles

🚀 ALTERNATIVES (si trop de données)
Si vous dépassez les limites :
1. Supabase Storage : Stockage fichiers séparé (gratuit jusqu'à 1GB)
2. Cloudinary : CDN images optimisé
3. S3 / R2 : Stockage objet cloud

Pour l'instant, le stockage base64 en DB fonctionne parfaitement !
*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script terminé avec succès !';
  RAISE NOTICE '📸 Les colonnes photos et documents sont prêtes';
  RAISE NOTICE '🚗 Vous pouvez maintenant ajouter des photos et documents à vos véhicules';
END $$;
