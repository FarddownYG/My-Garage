# 🔍 DEBUG - Problèmes d'Authentification

## 🐛 Symptômes Rapportés

1. ✅ Message "Load fail" lors de la création de compte
2. ✅ Le bouton ne fait rien à la 1ère tentative
3. ✅ Rate limiting activé après 2ème clic

---

## 🔧 Corrections Apportées

### 1. Ajout de Logs de Debug
**Fichier :** `/src/app/components/auth/AuthScreen.tsx`

```typescript
console.log('🔍 Début soumission formulaire');
console.log('🔍 Validation inscription...');
console.log('Email 1:', email);
console.log('Email 2:', emailConfirm);
console.log('✅ Validations OK');
console.log('⏳ Appel API...');
console.log('📝 Tentative d\'inscription...');
```

### 2. Amélioration des Messages d'Erreur
Ajout de gestion pour :
- ✅ "Load failed" → Message réseau explicite
- ✅ "Failed to fetch" → Message réseau explicite
- ✅ Erreurs de confirmation → Message spécifique

### 3. Simplification de la Validation
Suppression du `.trim()` qui pouvait causer des problèmes :
```typescript
// AVANT (pouvait bloquer)
if (email.trim() !== emailConfirm.trim())

// APRÈS (plus fiable)
if (email !== emailConfirm)
```

### 4. Logs Supabase
**Fichier :** `/src/app/utils/auth.ts`

Ajout de logs détaillés dans `signUp()` :
```typescript
console.log('📡 Envoi requête signUp à Supabase...');
console.log('📡 Réponse Supabase:', { data, error });
```

---

## 🧪 Comment Debugger

### Étape 1 : Ouvrir la Console
1. Appuyez sur **F12** (Chrome/Firefox/Edge)
2. Allez dans l'onglet **"Console"**

### Étape 2 : Tester la Création de Compte
1. Remplissez tous les champs
2. Cliquez sur "Créer le compte"
3. **Regardez la console**

### Étape 3 : Analyser les Logs

#### ✅ Cas Normal (Tout fonctionne)
```
🔍 Début soumission formulaire
🔍 Validation inscription...
Email 1: test@example.com
Email 2: test@example.com
Password 1: ***
Password 2: ***
✅ Validations OK
⏳ Appel API...
📝 Tentative d'inscription...
📡 Envoi requête signUp à Supabase...
📡 Réponse Supabase: { data: {...}, error: null }
✅ Inscription réussie: test@example.com
🎉 Succès, appel onSuccess()
🏁 Fin du processus, setIsLoading(false)
```

#### ❌ Cas 1 : Emails Différents
```
🔍 Début soumission formulaire
🔍 Validation inscription...
Email 1: test@example.com
Email 2: test@exmaple.com  ← FAUTE DE FRAPPE
❌ Emails ne correspondent pas
```
**Solution :** Tapez exactement le même email

#### ❌ Cas 2 : Mots de Passe Différents
```
🔍 Début soumission formulaire
🔍 Validation inscription...
✅ Validations email OK
Password 1: ***
Password 2: ***
❌ Mots de passe ne correspondent pas
```
**Solution :** Tapez exactement le même mot de passe

#### ❌ Cas 3 : Erreur Réseau (Load Failed)
```
🔍 Début soumission formulaire
✅ Validations OK
⏳ Appel API...
📝 Tentative d'inscription...
📡 Envoi requête signUp à Supabase...
❌ Erreur auth: TypeError: Load failed
❌ Message: Load failed
```

**Causes possibles :**
1. ❌ Pas de connexion internet
2. ❌ Supabase inaccessible
3. ❌ URL Supabase incorrecte
4. ❌ Clé API Supabase invalide
5. ❌ Scripts SQL non exécutés

**Solutions :**
1. ✅ Vérifiez votre connexion internet
2. ✅ Vérifiez que Supabase est accessible : https://uffmwykdfrxwnslhrftw.supabase.co
3. ✅ Exécutez les 3 scripts SQL (voir `/TODO_SUPABASE.md`)
4. ✅ Vérifiez la configuration dans Supabase Dashboard

#### ❌ Cas 4 : Email Déjà Utilisé
```
📡 Réponse Supabase: { error: "User already registered" }
```
**Solution :** Utilisez un autre email

#### ❌ Cas 5 : Confirmation Email Requise
```
📡 Réponse Supabase: { error: "Email not confirmed" }
```
**Solution :** 
- Vérifiez votre boîte mail
- OU désactivez la confirmation dans Supabase (voir `/SUPABASE_CONFIG.md`)

---

## 🔍 Vérifications à Faire

### 1. Vérifier la Configuration Supabase

**Ouvrir :** `/src/app/utils/supabase.ts`

```typescript
const supabaseUrl = 'https://uffmwykdfrxwnslhrftw.supabase.co';
const supabaseAnonKey = 'eyJhbGc...';
```

✅ Vérifiez que l'URL et la clé sont correctes

### 2. Tester la Connexion Supabase

Dans la console du navigateur (F12), tapez :
```javascript
fetch('https://uffmwykdfrxwnslhrftw.supabase.co')
  .then(r => console.log('✅ Supabase accessible'))
  .catch(e => console.error('❌ Supabase inaccessible:', e));
```

### 3. Vérifier les Scripts SQL

**Actions requises :**
1. ❓ Avez-vous exécuté le Script 1 (colonnes) ?
2. ❓ Avez-vous exécuté le Script 2 (fonction) ?
3. ❓ Avez-vous exécuté le Script 3 (RLS policies) ?

**Voir :** `/TODO_SUPABASE.md`

### 4. Vérifier la Confirmation Email

Dans Supabase Dashboard :
1. Authentication → Providers → Email
2. Vérifiez l'état de "Confirm email"
3. Si activé → Les comptes nécessitent une confirmation par email
4. Si désactivé → Pas de confirmation requise

---

## 🚨 Erreurs Courantes

### "Load failed"
**Cause :** Impossible de joindre Supabase  
**Solution :** Vérifiez la connexion internet + URL Supabase

### "Too many requests"
**Cause :** Rate limiting Supabase (trop de tentatives)  
**Solution :** Attendez le délai indiqué (countdown automatique)

### Champs vides malgré saisie
**Cause :** État React non mis à jour  
**Solution :** Vérifiez les `onChange={(e) => setX(e.target.value)}`

### Validation bloque alors que champs identiques
**Cause :** Espaces invisibles, caractères spéciaux  
**Solution :** Suppression du `.trim()` (déjà fait)

---

## ✅ Checklist de Résolution

Si le problème persiste, suivez cette checklist :

1. [ ] Ouvrir la console (F12)
2. [ ] Vider le cache (Ctrl+Shift+Delete)
3. [ ] Rafraîchir la page (F5)
4. [ ] Remplir le formulaire d'inscription
5. [ ] Cliquer "Créer le compte"
6. [ ] **Noter le 1er message d'erreur dans la console**
7. [ ] Vérifier la connexion internet
8. [ ] Vérifier que Supabase est accessible
9. [ ] Vérifier que les 3 scripts SQL sont exécutés
10. [ ] Réessayer

---

## 📞 Rapporter le Bug

Si ça ne fonctionne toujours pas, indiquez :

1. **Message d'erreur exact** dans la console (copier-coller)
2. **Screenshot** de la console complète
3. **Logs complets** depuis "🔍 Début soumission" jusqu'à l'erreur
4. **Scripts SQL** : lesquels ont été exécutés ?
5. **Confirmation email** : activée ou désactivée dans Supabase ?

---

## 🎯 Prochaines Étapes

1. ✅ Tester avec les nouveaux logs
2. ✅ Identifier l'erreur exacte
3. ✅ Appliquer la solution correspondante
4. ✅ Documenter si nouvelle erreur trouvée

---

**Mise à jour :** 2 février 2026  
**Fichiers modifiés :**
- `/src/app/components/auth/AuthScreen.tsx`
- `/src/app/utils/auth.ts`
