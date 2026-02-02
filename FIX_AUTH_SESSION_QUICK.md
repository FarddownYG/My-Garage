# ⚡ Fix Rapide - Auth Session Missing

## ❌ Erreur

```
AuthSessionMissingError: Auth session missing!
```

## ✅ Solution en 2 Étapes

### 1. Exécuter SQL

```bash
Supabase Dashboard → SQL Editor
→ Copier/coller: fix-auth-session-missing.sql
→ RUN
```

**Ce que ça fait** :
- ✅ Permet lecture profils non migrés SANS auth
- ✅ RLS normal une fois migrés

---

### 2. Code Corrigé

**Fichiers déjà mis à jour** :
- ✅ `/src/app/utils/auth.ts` - getSession() au lieu de getUser()
- ✅ `/src/app/utils/migration.ts` - Échecs silencieux

**Changement principal** :
```typescript
// AVANT
const { data: { user } } = await supabase.auth.getUser();
// ❌ Erreur si pas de session

// APRÈS
const { data: { session } } = await supabase.auth.getSession();
if (!session) return null;
// ✅ Retour null si pas de session
```

---

## 🧪 Test

```bash
npm run dev
# ✅ Plus d'erreur console
# ✅ AuthScreen s'affiche
```

---

## 📖 Doc Complète

👉 **[FIX_AUTH_SESSION_MISSING.md](./FIX_AUTH_SESSION_MISSING.md)**

---

**Temps** : 2 minutes
