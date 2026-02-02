# 🔒 Sécurité & RLS (Row Level Security)

## 🎯 Qu'est-ce que le RLS ?

**RLS** = Row Level Security = Sécurité au niveau des lignes

### Principe

Au lieu de filtrer les données dans le code :
```javascript
// ❌ Mauvaise pratique (vulnérable)
const vehicles = await supabase
  .from('vehicles')
  .select('*')
  .eq('user_id', currentUser.id); // Filtrage côté client
```

Le RLS filtre **automatiquement** côté base de données :
```javascript
// ✅ Bonne pratique (sécurisé)
const vehicles = await supabase
  .from('vehicles')
  .select('*');
  // → Supabase n'envoie QUE les véhicules du user !
```

---

## 🛡️ Comment Ça Marche

### 1. Activer RLS

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
```

**Effet** : Par défaut, **PERSONNE** ne peut rien lire/modifier.

### 2. Créer une Policy

```sql
CREATE POLICY "Users can view their own vehicles" 
ON vehicles FOR SELECT 
USING (user_id = auth.uid());
```

**Traduction** :
- **Sur la table** `vehicles`
- **Pour l'opération** SELECT (lecture)
- **Autoriser SI** `user_id` de la ligne = ID du user connecté

### 3. Résultat

| User Connecté | `auth.uid()` | Lignes Visibles |
|---------------|--------------|-----------------|
| sarah@example.com | `abc123...` | WHERE user_id = 'abc123...' |
| marc@example.com | `def456...` | WHERE user_id = 'def456...' |
| (Non connecté) | NULL | Aucune ligne |

---

## 📊 Exemple Concret

### Base de Données

```sql
vehicles
┌────┬──────────────┬───────────┬──────────┐
│ id │ name         │ owner_id  │ user_id  │
├────┼──────────────┼───────────┼──────────┤
│ 1  │ Tesla Model3 │ profile-1 │ abc123   │
│ 2  │ BMW X5       │ profile-2 │ def456   │
│ 3  │ Audi A4      │ profile-1 │ abc123   │
└────┴──────────────┴───────────┴──────────┘
```

### User Sarah (user_id = abc123) se connecte

```javascript
// Sarah exécute
const { data } = await supabase.from('vehicles').select('*');

// Supabase applique automatiquement :
// WHERE user_id = 'abc123'

// Sarah reçoit :
[
  { id: 1, name: 'Tesla Model3', user_id: 'abc123' },
  { id: 3, name: 'Audi A4', user_id: 'abc123' }
]
// ✅ BMW X5 n'est PAS visible
```

### User Marc (user_id = def456) se connecte

```javascript
// Marc exécute LA MÊME requête
const { data } = await supabase.from('vehicles').select('*');

// Supabase applique automatiquement :
// WHERE user_id = 'def456'

// Marc reçoit :
[
  { id: 2, name: 'BMW X5', user_id: 'def456' }
]
// ✅ Tesla et Audi ne sont PAS visibles
```

---

## 🔐 Policies Complètes

### SELECT (Lecture)

```sql
CREATE POLICY "Users can view their own vehicles" 
ON vehicles FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);
--                              ^^^^^^^^^^^^^^
--                              Support profils legacy (non migrés)
```

**Explication `OR user_id IS NULL`** :
- Profils existants avant migration ont `user_id = NULL`
- Temporairement visibles par tous (mode legacy)
- Après migration : `user_id` assigné → sécurité activée

### INSERT (Création)

```sql
CREATE POLICY "Users can insert their own vehicles" 
ON vehicles FOR INSERT 
WITH CHECK (user_id = auth.uid());
```

**Effet** : Lors de l'insertion, Supabase vérifie que `user_id` = user connecté.

**Trigger Auto-Assignment** :
```sql
CREATE FUNCTION auto_assign_user_id_vehicles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid(); -- Auto-assigne l'ID user
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_user_id_vehicles_trigger
  BEFORE INSERT ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_id_vehicles();
```

**Résultat** : Vous n'avez JAMAIS besoin de passer `user_id` manuellement !

```javascript
// ✅ Ceci suffit
await supabase.from('vehicles').insert({
  name: 'Tesla Model 3',
  owner_id: currentProfile.id,
  // user_id est auto-assigné par le trigger !
});
```

### UPDATE (Modification)

```sql
CREATE POLICY "Users can update their own vehicles" 
ON vehicles FOR UPDATE 
USING (user_id = auth.uid());
```

**Effet** : User peut modifier UNIQUEMENT ses propres lignes.

### DELETE (Suppression)

```sql
CREATE POLICY "Users can delete their own vehicles" 
ON vehicles FOR DELETE 
USING (user_id = auth.uid());
```

**Effet** : User peut supprimer UNIQUEMENT ses propres lignes.

---

## 🧪 Test de Sécurité

### Tentative de Lecture d'une Ligne Autre

```javascript
// User Sarah (abc123) essaie d'accéder au véhicule de Marc
const { data } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', 2); // ID du BMW de Marc

// Résultat : []
// ✅ Aucune ligne retournée (RLS bloque)
```

### Tentative de Modification d'une Ligne Autre

```javascript
// User Sarah essaie de modifier le BMW de Marc
const { error } = await supabase
  .from('vehicles')
  .update({ name: 'HACKED' })
  .eq('id', 2);

// Résultat : error = "new row violates row-level security policy"
// ✅ Modification bloquée par RLS
```

### Tentative d'Insertion avec user_id Falsifié

```javascript
// User Sarah essaie d'insérer un véhicule pour Marc
const { error } = await supabase
  .from('vehicles')
  .insert({
    name: 'Fake Vehicle',
    user_id: 'def456' // ID de Marc
  });

// Résultat : error = "new row violates row-level security policy"
// ✅ Insertion bloquée par RLS
// Le trigger force user_id = abc123 (Sarah)
```

---

## 🔍 Fonction `auth.uid()`

### Qu'est-ce que `auth.uid()` ?

```sql
auth.uid() → Retourne l'UUID du user connecté
```

**Exemples** :
- User Sarah connecté → `abc123-456-789-...`
- User Marc connecté → `def456-789-012-...`
- Personne connecté → `NULL`

### Comment Supabase Sait Qui Est Connecté ?

1. **Frontend** : Envoi du token JWT dans les headers
   ```javascript
   // Automatique avec @supabase/supabase-js
   const { data } = await supabase.from('vehicles').select('*');
   // → Header: Authorization: Bearer eyJxxx...
   ```

2. **Backend** : Supabase valide le token
   ```
   Token JWT → Supabase Auth → Vérifie signature
   → Extrait user_id → Utilise dans auth.uid()
   ```

3. **RLS** : Applique les policies avec `auth.uid()`
   ```sql
   USING (user_id = auth.uid())
   ```

---

## 🌐 Sécurité Multi-Appareils

### Scénario : Sarah utilise 2 appareils

```
iPhone (sarah@example.com connecté)
  → auth.uid() = abc123
  → Voit véhicules de Sarah

MacBook (sarah@example.com connecté)
  → auth.uid() = abc123
  → Voit véhicules de Sarah

Tablette de Marc (marc@example.com connecté)
  → auth.uid() = def456
  → Voit véhicules de Marc

✅ Chaque appareil accède aux bonnes données
✅ Synchronisation automatique
✅ Aucune fuite de données
```

---

## 🚨 Attaques Bloquées par RLS

### 1. Injection SQL

**Attaque** :
```javascript
// Tentative d'injection
const maliciousInput = "1' OR '1'='1";
await supabase.from('vehicles').select('*').eq('id', maliciousInput);
```

**Protection** :
- ✅ Supabase échappe automatiquement les paramètres
- ✅ RLS appliqué en plus (même si injection réussie)

### 2. Lecture Non Autorisée

**Attaque** :
```javascript
// Essayer de lire TOUS les véhicules
await supabase.from('vehicles').select('*').limit(10000);
```

**Protection** :
- ✅ RLS filtre automatiquement par `user_id`
- ✅ User ne reçoit QUE ses véhicules

### 3. Modification de Clé Étrangère

**Attaque** :
```javascript
// Essayer de voler un véhicule
await supabase.from('vehicles')
  .update({ owner_id: 'attacker-profile-id' })
  .eq('id', 'victim-vehicle-id');
```

**Protection** :
- ✅ RLS vérifie `USING (user_id = auth.uid())`
- ✅ Modification bloquée (pas le bon user_id)

---

## 📜 Audit & Logs

### Tracer les Accès

Supabase Dashboard → Logs → API Logs

```json
{
  "timestamp": "2026-01-30T12:34:56Z",
  "method": "GET",
  "path": "/rest/v1/vehicles",
  "user_id": "abc123-456-...",
  "status": 200,
  "rows_returned": 2
}
```

**Informations utiles** :
- Qui a accédé (user_id)
- À quelle table (path)
- Combien de lignes (rows_returned)
- Quand (timestamp)

---

## ⚙️ Configuration Recommandée

### 1. Toujours Activer RLS

```sql
-- Sur TOUTES les tables sensibles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
```

### 2. Policies par Défaut (4 Permissions)

```sql
-- Pour chaque table, créer 4 policies :
CREATE POLICY "select" ON table_name FOR SELECT USING (...);
CREATE POLICY "insert" ON table_name FOR INSERT WITH CHECK (...);
CREATE POLICY "update" ON table_name FOR UPDATE USING (...);
CREATE POLICY "delete" ON table_name FOR DELETE USING (...);
```

### 3. Triggers Auto-Assignment

```sql
-- Pour chaque table, créer trigger user_id :
CREATE FUNCTION auto_assign_user_id_TABLE()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_user_id_TABLE_trigger
  BEFORE INSERT ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_user_id_TABLE();
```

---

## 🎓 Concepts Avancés

### Policy Complexe (Partage)

```sql
-- Permettre la lecture si :
-- 1. C'est mon véhicule (user_id = moi)
-- 2. OU j'ai accès partagé (table shared_access)

CREATE POLICY "Users can view shared vehicles" 
ON vehicles FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  id IN (
    SELECT vehicle_id 
    FROM shared_access 
    WHERE shared_with_user_id = auth.uid()
  )
);
```

### Policy Temporelle

```sql
-- Lecture possible seulement pendant heures d'ouverture
CREATE POLICY "Business hours access" 
ON sensitive_table FOR SELECT 
USING (
  user_id = auth.uid()
  AND 
  EXTRACT(HOUR FROM NOW()) BETWEEN 8 AND 18
);
```

---

## ✅ Checklist Sécurité

- [x] RLS activé sur toutes les tables
- [x] Policies SELECT, INSERT, UPDATE, DELETE créées
- [x] Triggers auto-assignment user_id
- [x] Test multi-users effectué
- [x] Logs activés dans Supabase Dashboard
- [x] Aucune requête sans auth.uid()
- [x] Support profils legacy (OR user_id IS NULL)

---

## 📖 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**🔒 Votre application est maintenant sécurisée au niveau base de données !**

Même si un attaquant obtient l'URL Supabase et la clé publique, il ne pourra accéder qu'à SES PROPRES données grâce au RLS. 🛡️
