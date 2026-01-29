# 🗄️ Commandes Supabase - Guide Pas à Pas

## 📋 Prérequis

1. Accéder au Dashboard Supabase: https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (icône </> dans la barre latérale)

---

## 🧹 ÉTAPE 1: Vérification des doublons

Avant de nettoyer, vérifions l'ampleur du problème:

```sql
-- 1. Compter le nombre total de templates
SELECT COUNT(*) as total_templates FROM maintenance_templates;

-- 2. Identifier les doublons
SELECT 
  name, 
  owner_id, 
  profile_id,
  COUNT(*) as nombre_doublons,
  ARRAY_AGG(id ORDER BY created_at) as liste_ids
FROM maintenance_templates
GROUP BY name, owner_id, profile_id
HAVING COUNT(*) > 1
ORDER BY nombre_doublons DESC
LIMIT 20;

-- 3. Statistiques par profil
SELECT 
  owner_id,
  COUNT(*) as nombre_templates,
  COUNT(DISTINCT name) as templates_uniques
FROM maintenance_templates
GROUP BY owner_id
ORDER BY nombre_templates DESC;
```

**Résultat attendu:**
- Si vous avez des milliers de templates pour un seul profil → Problème confirmé
- La colonne `nombre_doublons` devrait montrer des valeurs élevées

---

## 🗑️ ÉTAPE 2: Nettoyage des doublons

### ⚠️ IMPORTANT: Faire un backup avant!

```sql
-- Créer une table de backup (au cas où)
CREATE TABLE IF NOT EXISTS maintenance_templates_backup AS 
SELECT * FROM maintenance_templates;

-- Vérifier le backup
SELECT COUNT(*) FROM maintenance_templates_backup;
```

### Suppression des doublons

```sql
-- Supprimer tous les doublons en gardant le plus ancien de chaque groupe
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

-- Vérifier le résultat
SELECT 
  'Doublons restants' as check_name,
  COUNT(*) as count
FROM (
  SELECT name, owner_id, profile_id, COUNT(*) as c
  FROM maintenance_templates
  GROUP BY name, owner_id, profile_id
  HAVING COUNT(*) > 1
) as remaining;
```

**Résultat attendu:**
- `count` devrait être **0** (aucun doublon restant)
- Le nombre total de templates devrait avoir drastiquement diminué

---

## 🚀 ÉTAPE 3: Optimisation avec index

```sql
-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_maintenance_templates_owner_id 
  ON maintenance_templates(owner_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_templates_profile_id 
  ON maintenance_templates(profile_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_templates_name 
  ON maintenance_templates(name);

-- Vérifier la création des index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'maintenance_templates'
ORDER BY indexname;
```

---

## 🔒 ÉTAPE 4: Contrainte UNIQUE (optionnel mais recommandé)

Cette contrainte empêchera la création de doublons futurs:

```sql
-- Ajouter une contrainte unique
ALTER TABLE maintenance_templates 
ADD CONSTRAINT unique_template_per_owner_profile 
UNIQUE (name, owner_id, COALESCE(profile_id, ''));

-- Si la contrainte existe déjà et vous voulez la recréer:
-- ALTER TABLE maintenance_templates DROP CONSTRAINT IF EXISTS unique_template_per_owner_profile;
```

**Note:** Si cette commande échoue, c'est qu'il reste des doublons. Retournez à l'ÉTAPE 2.

---

## 📊 ÉTAPE 5: Optimisation globale

```sql
-- Index additionnels pour d'autres tables
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_vehicle_id ON maintenance_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_date ON maintenance_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_vehicle_id ON tasks(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);

-- Optimiser les tables
VACUUM ANALYZE maintenance_templates;
VACUUM ANALYZE vehicles;
VACUUM ANALYZE maintenance_entries;
VACUUM ANALYZE tasks;
VACUUM ANALYZE reminders;
```

---

## ✅ ÉTAPE 6: Vérification finale

```sql
-- 1. Statistiques finales
SELECT 
    'maintenance_templates' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT name) as unique_names,
    COUNT(DISTINCT owner_id) as unique_owners
FROM maintenance_templates
UNION ALL
SELECT 
    'vehicles',
    COUNT(*),
    NULL,
    COUNT(DISTINCT owner_id)
FROM vehicles
UNION ALL
SELECT 
    'maintenance_entries',
    COUNT(*),
    NULL,
    COUNT(DISTINCT vehicle_id)
FROM maintenance_entries;

-- 2. Vérifier les contraintes
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'maintenance_templates'::regclass;

-- 3. Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'maintenance_templates',
    'vehicles',
    'maintenance_entries',
    'tasks',
    'reminders'
)
ORDER BY tablename, indexname;
```

---

## 🧪 TESTS APRÈS NETTOYAGE

### Test 1: Créer un profil d'entretien dans l'app
1. Ouvrir l'application
2. Aller dans Paramètres > Profils d'Entretien
3. Créer un nouveau profil pré-rempli
4. Vérifier dans Supabase:

```sql
-- Compter les templates du nouveau profil
SELECT 
    profile_id,
    COUNT(*) as nombre_templates
FROM maintenance_templates
WHERE profile_id = 'VOTRE_NOUVEAU_PROFILE_ID'
GROUP BY profile_id;
```

**Résultat attendu:** ~40-50 templates (pas des milliers!)

### Test 2: Vérifier la contrainte UNIQUE
```sql
-- Tenter d'insérer un doublon (devrait échouer)
INSERT INTO maintenance_templates (
    id, name, owner_id, profile_id
) VALUES (
    'test-duplicate',
    'Vidange Huile Moteur',
    (SELECT owner_id FROM maintenance_templates LIMIT 1),
    (SELECT profile_id FROM maintenance_templates WHERE profile_id IS NOT NULL LIMIT 1)
);
```

**Résultat attendu:** Erreur `duplicate key value violates unique constraint`

---

## 🔄 ROLLBACK (en cas de problème)

Si quelque chose se passe mal:

```sql
-- Restaurer depuis le backup
TRUNCATE maintenance_templates;
INSERT INTO maintenance_templates 
SELECT * FROM maintenance_templates_backup;

-- Vérifier la restauration
SELECT COUNT(*) FROM maintenance_templates;
```

---

## 📈 MÉTRIQUES AVANT/APRÈS

Exécutez ces requêtes avant et après le nettoyage pour comparer:

```sql
-- Métrique 1: Nombre total de templates
SELECT 
    'Total templates' as metric,
    COUNT(*) as valeur_avant,
    '???' as valeur_apres  -- À remplir après nettoyage
FROM maintenance_templates;

-- Métrique 2: Moyenne de templates par profil
SELECT 
    'Moyenne par owner' as metric,
    AVG(cnt)::int as valeur_avant,
    '???' as valeur_apres
FROM (
    SELECT owner_id, COUNT(*) as cnt
    FROM maintenance_templates
    GROUP BY owner_id
) as stats;

-- Métrique 3: Taille de la table
SELECT 
    'Taille table (MB)' as metric,
    pg_size_pretty(pg_total_relation_size('maintenance_templates')) as valeur_avant,
    '???' as valeur_apres;
```

---

## 🎯 RÉSULTATS ATTENDUS

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Total templates | 10,000+ | 100-200 | -98% |
| Par profil | 5,000+ | 40-50 | -99% |
| Taille table | ~50MB | ~1MB | -98% |
| Temps chargement | 2-3s | <500ms | -80% |

---

## ⚠️ AVERTISSEMENTS

1. **Ne jamais exécuter en production sans backup**
2. **Tester d'abord en staging si possible**
3. **Exécuter pendant une période de faible trafic**
4. **Avoir un plan de rollback prêt**
5. **Surveiller les logs après déploiement**

---

## 📞 EN CAS DE PROBLÈME

### Erreur: "cannot drop constraint ... because other objects depend on it"
```sql
-- Supprimer avec CASCADE (attention!)
ALTER TABLE maintenance_templates 
DROP CONSTRAINT IF EXISTS unique_template_per_owner_profile CASCADE;
```

### Erreur: "duplicate key value violates unique constraint"
```sql
-- Il reste des doublons, relancer l'étape 2
-- Ou identifier manuellement les doublons:
SELECT name, owner_id, profile_id, COUNT(*)
FROM maintenance_templates
GROUP BY name, owner_id, profile_id
HAVING COUNT(*) > 1;
```

### Performance lente après nettoyage
```sql
-- Reindexer manuellement
REINDEX TABLE maintenance_templates;
VACUUM FULL maintenance_templates;
ANALYZE maintenance_templates;
```

---

## ✅ CHECKLIST D'EXÉCUTION

- [ ] Backup effectué
- [ ] Étape 1: Vérification des doublons (résultats notés)
- [ ] Étape 2: Nettoyage des doublons exécuté
- [ ] Étape 3: Index créés
- [ ] Étape 4: Contrainte UNIQUE ajoutée
- [ ] Étape 5: Optimisation globale effectuée
- [ ] Étape 6: Vérifications finales OK
- [ ] Tests effectués dans l'app
- [ ] Métriques avant/après comparées
- [ ] Backup supprimé (après 7 jours)

---

**Version:** 1.0  
**Date:** 29 janvier 2026  
**Temps estimé:** 15-30 minutes
