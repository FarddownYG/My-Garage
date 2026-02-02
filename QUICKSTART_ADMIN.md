# ⚡ Démarrage Rapide - Panneau Admin

## 🎯 En 5 Minutes

### Étape 1 : Exécuter les Scripts SQL (2 min)

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** (icône de base de données)
4. Copiez-collez ce script et cliquez sur **Run** :

```sql
-- 1️⃣ Créer la table banned_emails
CREATE TABLE IF NOT EXISTS public.banned_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON public.banned_emails(email);

ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

-- 2️⃣ Policies
CREATE POLICY "Anyone can read banned emails"
  ON public.banned_emails FOR SELECT USING (true);

CREATE POLICY "Admins can insert banned emails"
  ON public.banned_emails FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin2647595726151748@gmail.com'
    )
  );

CREATE POLICY "Admins can delete banned emails"
  ON public.banned_emails FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin2647595726151748@gmail.com'
    )
  );

-- 3️⃣ Fonction de vérification
CREATE OR REPLACE FUNCTION public.check_email_not_banned()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.banned_emails 
    WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'This email address is banned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Trigger
DROP TRIGGER IF EXISTS trigger_check_banned_email ON auth.users;
CREATE TRIGGER trigger_check_banned_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_not_banned();
```

✅ **Vérification** : Exécutez `SELECT * FROM banned_emails;` - Doit retourner une table vide.

---

### Étape 2 : Créer le Compte Admin (1 min)

1. Ouvrez votre app
2. Cliquez sur **"Créer un compte"**
3. Remplissez :
   - **Nom complet** : Admin Garage (ou autre)
   - **Email** : `admin2647595726151748@gmail.com`
   - **Mot de passe** : `\4I"fTRtW-UB"NG"<oxER'2S=2(2qNr[PcD]d)ak^T:Gb)jyX&`
4. Créez le compte

---

### Étape 3 : Accéder au Panneau Admin (1 min)

1. **Connectez-vous** avec le compte admin
2. Sur le **Dashboard**, cherchez l'icône **🛡️ Shield** (rouge) en haut à droite
3. **Cliquez dessus** → Le panneau admin s'ouvre !

---

### Étape 4 : Tester le Bannissement (1 min)

1. Dans le panneau admin, section **"Bannir un email"**
2. Entrez : `test@example.com`
3. Raison : `Test de bannissement`
4. Cliquez sur **"Bannir cet email"**
5. ✅ Vérifiez que l'email apparaît dans "Emails bannis"

---

## 🎉 C'est Terminé !

### Ce que vous pouvez faire maintenant :

1. ✅ **Bannir des emails** pour bloquer des utilisateurs
2. ✅ **Voir la liste des utilisateurs** avec leurs profils
3. ✅ **Supprimer des comptes** (supprime les profils liés)
4. ✅ **Débannir des emails** si besoin

---

## 🔐 Identifiants Admin

**Email** : `admin2647595726151748@gmail.com`  
**Password** : `\4I"fTRtW-UB"NG"<oxER'2S=2(2qNr[PcD]d)ak^T:Gb)jyX&`

⚠️ **Changez ce mot de passe** après le premier test !

---

## 📚 Documentation Complète

- **Guide utilisateur** : `/ADMIN_GUIDE.md`
- **Scripts SQL complets** : `/SUPABASE_ADMIN_SQL.md`
- **Changelog** : `/CHANGELOG_ADMIN.md`

---

## ❓ Problèmes Fréquents

### "Impossible de charger les données admin"

**Solution** : Vous n'avez pas exécuté les scripts SQL. Retournez à l'Étape 1.

---

### "Le bouton Shield n'apparaît pas"

**Solution** : Vous n'êtes pas connecté avec le bon email admin. Vérifiez l'email.

---

### "Erreur lors du bannissement"

**Solution** : Les policies RLS ne sont pas configurées. Réexécutez l'Étape 1 complètement.

---

## 🚀 Prêt à Utiliser !

Votre panneau admin est maintenant fonctionnel. Profitez-en bien ! 🎊
