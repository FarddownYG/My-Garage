# 🔄 Flux de Migration des Profils

## Vue d'ensemble

Le système de migration permet de lier les profils existants (stockés localement) à un compte Supabase Auth nouvellement créé.

---

## 🎯 Comportement Attendu

### Scénario 1 : Nouveau Compte Sans Profils Existants
```
1. Utilisateur crée un compte → email + password
2. Pas de profils existants détectés
3. ✅ Redirection directe vers l'app
4. L'utilisateur peut créer ses premiers profils
```

### Scénario 2 : Nouveau Compte Avec Profils Existants
```
1. Utilisateur crée un compte → email + password
2. Profils existants détectés (ex: Sarah, Marc)
3. 🔄 Écran de migration s'affiche automatiquement
4. L'utilisateur sélectionne les profils à lier
5. Pour profils AVEC PIN → entrer le PIN
6. Pour profils SANS PIN → clic direct
7. ✅ Migration effectuée
8. Le profil disparaît de la liste
9. Si plus de profils → redirection automatique
```

---

## 🔧 Mécanisme Technique

### Détection des Profils Non Migrés

**Requête SQL :**
```sql
SELECT * FROM profiles
WHERE (is_migrated IS NULL OR is_migrated = false)
  AND user_id IS NULL  -- Pas encore lié à un compte
  AND is_admin = false
```

**Points clés :**
- `user_id IS NULL` → Le profil n'est pas encore lié à un compte
- `is_migrated = false` → Le profil n'a pas été migré
- Une fois migré, `user_id` est défini → le profil disparaît de la liste

### Migration d'un Profil

**Fonction SQL : `migrate_profile_to_user`**
```sql
UPDATE profiles
SET 
  user_id = 'auth-user-id',
  is_migrated = true,
  migrated_at = NOW()
WHERE id = 'profile-id'
```

**Effet :**
- Le profil est maintenant lié au compte
- `user_id IS NULL` devient FALSE
- Le profil ne s'affiche plus dans la liste de migration
- Les RLS (Row Level Security) donnent accès au user

---

## 📋 Flux Détaillé

### Étape 1 : Création du Compte
```typescript
// AuthScreen.tsx
await signUp(email, password, fullName);
→ Compte créé dans Supabase Auth
→ onSuccess() appelé
```

### Étape 2 : Vérification Migration Nécessaire
```typescript
// AppContext.tsx
const migrationPending = await checkMigrationPending();
// Retourne true si des profils avec user_id IS NULL existent
```

### Étape 3 : Affichage Écran Migration
```typescript
// AuthWrapper.tsx
if (isAuthenticated && isMigrationPending) {
  return <MigrationScreen />;
}
```

### Étape 4 : Chargement des Profils
```typescript
// MigrationScreen.tsx
const profiles = await getUnmigratedProfiles();
// Récupère uniquement les profils avec user_id IS NULL
console.log(`${profiles.length} profil(s) à migrer`);
```

### Étape 5 : Migration
```typescript
// Utilisateur clique sur "Lier ce profil"
await migrateProfileToUser(profileId, userId);
→ UPDATE profiles SET user_id = userId WHERE id = profileId

// Rechargement de la liste
const remaining = await getUnmigratedProfiles();
→ Le profil migré n'apparaît PLUS (user_id n'est plus NULL)

console.log(`${remaining.length} profil(s) restants`);
```

### Étape 6 : Fin de Migration
```typescript
if (remaining.length === 0) {
  console.log('🎉 Tous les profils migrés !');
  setTimeout(() => onComplete(), 1000);
  → Redirection vers l'app
}
```

---

## ✅ Garanties

### 1. Profil Migré = Invisible
- Une fois `user_id` défini, le profil disparaît de la liste
- Impossible de le migrer deux fois

### 2. Protection PIN
- Si profil protégé → PIN obligatoire
- PIN incorrect → migration refusée

### 3. Isolation des Données
- Chaque user voit UNIQUEMENT ses profils
- RLS empêche l'accès aux profils d'autres users

### 4. Conservation des Données
- Aucune donnée supprimée
- Seul le lien `profile → user` est créé
- Véhicules, entretiens, photos, etc. restent intacts

---

## 🐛 Debugging

### Profil ne disparaît pas après migration
```sql
-- Vérifier l'état du profil
SELECT id, name, user_id, is_migrated 
FROM profiles 
WHERE id = 'profile-id';

-- Si user_id est NULL → migration a échoué
-- Si user_id est défini → OK, mais bug d'affichage
```

### Écran de migration s'affiche alors qu'il n'y a pas de profils
```typescript
// Vérifier le compte
const profiles = await getUnmigratedProfiles();
console.log('Profils non migrés:', profiles);

// Si tableau vide → bug dans AuthWrapper
// Si profils présents → normal
```

### Migration en boucle
```typescript
// Vérifier que onComplete() est bien appelé
if (remaining.length === 0) {
  console.log('✅ Appel de onComplete()');
  onComplete();
}
```

---

## 📊 États Possibles

| État | `user_id` | `is_migrated` | Visible dans Migration | Accessible dans App |
|------|-----------|---------------|------------------------|---------------------|
| **Non migré** | `NULL` | `false` / `NULL` | ✅ Oui | ❌ Non |
| **Migré** | `uuid` | `true` | ❌ Non | ✅ Oui |
| **Admin** | N/A | N/A | ❌ Non | ✅ Oui (toujours) |

---

## 🎬 Messages Console

```
✅ 2 profil(s) non migré(s) trouvé(s)
🔄 Migration du profil Sarah...
✅ Profil Sarah migré avec succès !
🔄 Profils restants à migrer: 1
[utilisateur migre Marc]
✅ Profil Marc migré avec succès !
🔄 Profils restants à migrer: 0
🎉 Tous les profils ont été migrés ! Redirection...
✅ Appel de onComplete()
```

---

## 🔐 Sécurité

### RLS (Row Level Security)
```sql
-- Profils non migrés visibles uniquement si pas de user_id
CREATE POLICY "Unmigrated profiles visible to authenticated users"
ON profiles FOR SELECT
USING (
  user_id IS NULL 
  AND is_migrated = false 
  AND is_admin = false
);

-- Profils migrés visibles uniquement par leur propriétaire
CREATE POLICY "User can view own profiles"
ON profiles FOR SELECT
USING (user_id = auth.uid());
```

---

## 📝 Notes Importantes

1. **Un profil ne peut être migré qu'une seule fois**
   - Une fois `user_id` défini, impossible de le changer
   - Protection contre la migration accidentelle vers un autre compte

2. **La migration est irréversible**
   - Pas de fonction "démigrer"
   - Le lien profil → compte est permanent

3. **Les profils admin ne sont jamais migrés**
   - Toujours exclus de la liste
   - Restent globaux à l'application

4. **La redirection est automatique**
   - Dès que `remaining.length === 0`
   - Délai de 1 seconde pour smooth UX

---

## ✨ Améliorations Futures

- [ ] Permettre de lier plusieurs profils en une fois
- [ ] Ajouter un bouton "Ignorer ce profil"
- [ ] Historique des migrations dans l'admin
- [ ] Export/Import des profils migrés
