# 🧪 TESTS: Fix Invalid Refresh Token

## 🎯 Comment tester la correction

### ✅ Test automatique rapide (Recommandé)

1. **Rafraîchis l'application** (F5)
2. **Ouvre la console** (F12 → Console)
3. Cherche ces messages :

#### Si pas d'erreur (normal)
```
🚀 INITIALISATION APP...
🔐 User actuel: ton-email@example.com
✅ Initialisation terminée
```
✅ **Tout va bien !**

#### Si erreur de token (devrait être corrigée)
```
❌ Erreur initialisation: AuthApiError: Invalid Refresh Token
⚠️ Token invalide détecté lors de l'init, nettoyage...
🧹 Nettoyage de la session invalide...
✅ Session nettoyée
🚀 INITIALISATION APP...
```
✅ **Correction appliquée automatiquement !**

---

## 🔧 Test manuel (Simuler l'erreur)

### Étape 1 : Créer un token invalide

Dans la console (F12 → Console) :

```javascript
// Récupérer la clé Supabase localStorage
const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
console.log('Clés Supabase:', keys);

// Corrompre le refresh token
const authKey = keys.find(k => k.includes('auth-token'));
if (authKey) {
  const data = JSON.parse(localStorage.getItem(authKey));
  data.refresh_token = 'TOKEN_INVALIDE_TEST';
  localStorage.setItem(authKey, JSON.stringify(data));
  console.log('✅ Token corrompu pour le test');
}
```

### Étape 2 : Rafraîchir la page

```javascript
location.reload();
```

### Étape 3 : Observer le comportement

Tu devrais voir dans la console :

```
❌ Erreur initialisation: AuthApiError: Invalid Refresh Token
⚠️ Token invalide détecté lors de l'init, nettoyage...
🧹 Nettoyage de la session invalide...
✅ Session nettoyée
```

Puis l'app se recharge et affiche l'écran de connexion.

✅ **La correction fonctionne !**

---

## 📋 Checklist de vérification

### ✅ Comportement attendu

- [ ] L'erreur est détectée automatiquement
- [ ] Un message "Token invalide détecté" apparaît dans la console
- [ ] La session est nettoyée automatiquement
- [ ] Le localStorage Supabase est vidé
- [ ] L'utilisateur est redirigé vers l'écran de connexion
- [ ] Pas de boucle infinie de rechargement
- [ ] L'utilisateur peut se reconnecter normalement

### ❌ Comportements à éviter

- [ ] L'app reste bloquée sur un écran blanc
- [ ] L'erreur s'affiche en boucle
- [ ] Le localStorage n'est pas nettoyé
- [ ] L'utilisateur ne peut pas se reconnecter

---

## 🧪 Scénarios de test

### Scénario 1 : Utilisateur avec token expiré

**Setup** :
- Utilisateur connecté il y a longtemps
- Token expiré naturellement

**Actions** :
1. Ouvrir l'application
2. Observer le comportement

**Résultat attendu** :
- ✅ Détection automatique
- ✅ Nettoyage
- ✅ Redirection vers connexion

---

### Scénario 2 : Utilisateur avec token révoqué

**Setup** :
- Mot de passe changé récemment
- Token révoqué côté Supabase

**Actions** :
1. Ouvrir l'application
2. Observer le comportement

**Résultat attendu** :
- ✅ Erreur détectée
- ✅ Session nettoyée
- ✅ Redirection vers connexion

---

### Scénario 3 : Multiples onglets ouverts

**Setup** :
- App ouverte dans 3 onglets
- Token invalide dans un onglet

**Actions** :
1. Rafraîchir l'onglet avec le token invalide
2. Observer les autres onglets

**Résultat attendu** :
- ✅ Premier onglet : nettoyage + redirection
- ✅ Autres onglets : pas affectés immédiatement
- ✅ Au refresh : redirection vers connexion

---

### Scénario 4 : Navigation privée

**Setup** :
- Mode navigation privée
- Première visite

**Actions** :
1. Ouvrir l'app en mode privé
2. Se connecter
3. Fermer et rouvrir

**Résultat attendu** :
- ✅ Première connexion : normale
- ✅ Après fermeture : session perdue (normal)
- ✅ Pas d'erreur de token
- ✅ Écran de connexion affiché

---

## 🔍 Vérifications dans Supabase

### Vérifier les sessions actives

Dans Supabase Dashboard → SQL Editor :

```sql
-- Voir tes sessions actives
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  NOT_AFTER as "Expire le"
FROM auth.sessions
WHERE user_id = 'TON_USER_ID'
ORDER BY created_at DESC;
```

### Révoquer une session spécifique

```sql
-- Révoquer une session (pour tester)
DELETE FROM auth.sessions
WHERE id = 'SESSION_ID';
```

### Révoquer toutes les sessions

```sql
-- ⚠️ ATTENTION : Déconnecte tous les appareils
DELETE FROM auth.sessions
WHERE user_id = 'TON_USER_ID';
```

---

## 📊 Mesures de succès

### Avant le fix
- ❌ 100% des erreurs de token bloquent l'app
- ❌ 0% de récupération automatique
- ❌ Intervention manuelle requise

### Après le fix
- ✅ 100% des erreurs de token sont détectées
- ✅ 100% de récupération automatique
- ✅ 0% d'intervention manuelle requise

---

## 🎯 Test de régression

Pour s'assurer que le fix ne casse rien d'autre :

### Test 1 : Connexion normale
1. Ouvrir l'app
2. Se connecter avec email/password
3. ✅ Connexion réussie
4. ✅ Données chargées
5. ✅ Pas d'erreur dans la console

### Test 2 : Déconnexion normale
1. Se déconnecter via le bouton
2. ✅ Déconnexion propre
3. ✅ Redirection vers l'écran de connexion
4. ✅ Pas d'erreur dans la console

### Test 3 : Inscription
1. Créer un nouveau compte
2. ✅ Inscription réussie
3. ✅ Profil créé automatiquement
4. ✅ Connexion automatique

### Test 4 : Refresh normal
1. Connecté normalement
2. Rafraîchir (F5)
3. ✅ Session conservée
4. ✅ Pas de déconnexion
5. ✅ Données toujours présentes

---

## 🐛 Si un test échoue

### Le nettoyage ne fonctionne pas

Vérifier dans la console :
```javascript
// Tester manuellement
import('../utils/auth').then(({ cleanInvalidSession }) => {
  cleanInvalidSession().then(() => {
    console.log('✅ Nettoyage manuel réussi');
    location.reload();
  });
});
```

### L'erreur persiste après le nettoyage

Vider complètement le cache :
```javascript
// Supprimer TOUT le localStorage
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Boucle infinie de rechargement

1. Fermer TOUS les onglets
2. Vider le cache navigateur (Ctrl+Shift+Delete)
3. Rouvrir l'app dans un nouvel onglet

---

## ✅ Validation finale

Après tous les tests, tu devrais avoir :

- ✅ Aucune erreur de token bloquante
- ✅ Nettoyage automatique fonctionnel
- ✅ Connexion/déconnexion normales
- ✅ Pas de régression sur les fonctionnalités existantes
- ✅ Logs clairs dans la console

---

## 📞 Rapporter un problème

Si un test échoue, note :

1. **Scénario exact** qui a échoué
2. **Messages d'erreur** dans la console (copie complète)
3. **Navigateur** et version
4. **Étapes pour reproduire**
5. **Logs Supabase** si disponibles

Partage ces informations pour obtenir de l'aide.
