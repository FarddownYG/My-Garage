# 🔐 Scripts SQL Admin pour Supabase

Ce fichier contient les scripts SQL nécessaires pour implémenter les fonctionnalités admin.

## 📝 À EXÉCUTER DANS SUPABASE SQL EDITOR

### 1. Table des emails bannis

```sql
-- Créer la table des emails bannis
CREATE TABLE IF NOT EXISTS public.banned_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  banned_at TIMESTAMPTZ DEFAULT NOW(),
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_banned_emails_email ON public.banned_emails(email);

-- RLS (Row Level Security)
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire (pour vérifier si un email est banni)
CREATE POLICY "Anyone can read banned emails"
  ON public.banned_emails
  FOR SELECT
  USING (true);

-- Policy: Seuls les admins peuvent ajouter des bans
CREATE POLICY "Admins can insert banned emails"
  ON public.banned_emails
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin2647595726151748@gmail.com'
    )
  );

-- Policy: Seuls les admins peuvent supprimer des bans
CREATE POLICY "Admins can delete banned emails"
  ON public.banned_emails
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin2647595726151748@gmail.com'
    )
  );
```

### 2. Fonction pour vérifier si un email est banni (lors de l'inscription)

```sql
-- Fonction appelée automatiquement avant chaque inscription
CREATE OR REPLACE FUNCTION public.check_email_not_banned()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'email est banni
  IF EXISTS (
    SELECT 1 FROM public.banned_emails 
    WHERE LOWER(email) = LOWER(NEW.email)
  ) THEN
    RAISE EXCEPTION 'This email address is banned';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui bloque les inscriptions d'emails bannis
DROP TRIGGER IF EXISTS trigger_check_banned_email ON auth.users;
CREATE TRIGGER trigger_check_banned_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_not_banned();
```

### 3. Fonction pour supprimer un utilisateur (nécessite Service Role)

⚠️ **IMPORTANT** : Cette fonction nécessite des permissions élevées.

```sql
-- Fonction pour supprimer complètement un utilisateur
CREATE OR REPLACE FUNCTION public.admin_delete_user(user_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF auth.uid() NOT IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin2647595726151748@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Supprimer les données associées à l'utilisateur
  -- (Les profils, véhicules, etc. seront supprimés en cascade si configuré)
  DELETE FROM public.profiles WHERE user_id = user_id_param;
  
  -- Note: La suppression de auth.users nécessite Service Role
  -- Vous devrez utiliser l'API Admin de Supabase côté serveur
  -- ou le Dashboard Supabase pour supprimer l'utilisateur de auth.users
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Vue des utilisateurs (accessible aux admins)

```sql
-- Vue simplifiée des utilisateurs pour les admins
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.user_metadata,
  COUNT(DISTINCT p.id) as profile_count
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.user_metadata;

-- RLS sur la vue
ALTER VIEW public.admin_users_view SET (security_invoker = on);

-- Policy: Seuls les admins peuvent voir cette vue
CREATE POLICY "Only admins can view users"
  ON public.admin_users_view
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'admin2647595726151748@gmail.com'
    )
  );
```

## 🔧 Configuration Supplémentaire

### Activer la confirmation d'email (optionnel)

Dans **Authentication → Settings** de Supabase Dashboard :

1. **Enable email confirmations** : ON
2. **Email template** : Personnaliser si besoin

### Ajouter l'admin dans la base

```sql
-- Si le compte admin n'existe pas encore, l'ajouter manuellement
-- (À faire via le Dashboard Supabase ou via l'app)
```

## ⚠️ NOTES DE SÉCURITÉ

1. **Service Role Key** : Ne JAMAIS exposer la Service Role Key côté client
2. **RLS** : Toujours activer Row Level Security sur les tables sensibles
3. **Permissions** : L'email admin est hardcodé - changer si besoin
4. **Audit** : Considérer l'ajout d'une table d'audit pour les actions admin

## 🧪 TESTS

```sql
-- Test 1: Bannir un email
INSERT INTO public.banned_emails (email, reason)
VALUES ('spam@example.com', 'Comportement abusif');

-- Test 2: Vérifier qu'un email banni ne peut pas s'inscrire
-- (Tester via l'interface d'inscription)

-- Test 3: Débannir un email
DELETE FROM public.banned_emails WHERE email = 'spam@example.com';
```

## 📊 Requêtes Utiles

```sql
-- Lister tous les utilisateurs
SELECT email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Lister tous les emails bannis
SELECT * FROM public.banned_emails ORDER BY banned_at DESC;

-- Compter les utilisateurs
SELECT COUNT(*) FROM auth.users;

-- Compter les profils par utilisateur
SELECT u.email, COUNT(p.id) as profile_count
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
GROUP BY u.id, u.email;
```
