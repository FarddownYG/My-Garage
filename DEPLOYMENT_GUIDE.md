# 🚀 Guide de Déploiement - Valcar App

## Version : 1.3.0 - Production Ready

---

## 📋 Pré-requis

### Environnement de développement
- ✅ Node.js 18.x ou supérieur
- ✅ npm ou pnpm
- ✅ Compte Supabase configuré
- ✅ Variables d'environnement configurées

### Services externes
- ✅ Supabase (Backend & Auth)
- ✅ Domaine personnalisé (optionnel)
- ✅ CDN pour assets (optionnel)

---

## 🔧 Configuration

### 1. Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-supabase

# Environnement
VITE_ENV=production

# Optional: Analytics
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

**⚠️ IMPORTANT :** Ne JAMAIS commit le fichier `.env` !

### 2. Configuration Supabase

#### Row Level Security (RLS)

Appliquer les politiques depuis `/SUPABASE_SETUP.sql` :

```sql
-- Vérifier que RLS est activé sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
```

#### Email Templates

Configurer les templates d'email dans Supabase Dashboard :
- Confirmation d'inscription
- Réinitialisation mot de passe
- Changement d'email

### 3. Configuration de sécurité

#### Headers HTTP (à configurer sur votre serveur)

```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";

# HSTS (Force HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# X-Frame-Options (Protection Clickjacking)
add_header X-Frame-Options "DENY";

# X-Content-Type-Options
add_header X-Content-Type-Options "nosniff";

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin";

# Permissions Policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
```

---

## 🏗️ Build de production

### 1. Installer les dépendances

```bash
# Avec npm
npm install

# Avec pnpm (recommandé)
pnpm install
```

### 2. Build de l'application

```bash
# Build optimisé pour production
npm run build

# ou avec pnpm
pnpm build
```

**Résultat attendu :**
```
dist/
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── ...
  ├── index.html
  └── ...
```

### 3. Tester le build localement

```bash
npm run preview
# ou
pnpm preview
```

Ouvrir http://localhost:4173

---

## 📦 Déploiement

### Option 1 : Vercel (Recommandé)

#### Installation CLI
```bash
npm install -g vercel
```

#### Configuration
Créer `vercel.json` :

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### Déploiement
```bash
# Login
vercel login

# Deploy
vercel --prod

# Configurer les variables d'environnement
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Option 2 : Netlify

#### Installation CLI
```bash
npm install -g netlify-cli
```

#### Configuration
Créer `netlify.toml` :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
```

#### Déploiement
```bash
# Login
netlify login

# Deploy
netlify deploy --prod

# Configurer les variables d'environnement dans le dashboard Netlify
```

### Option 3 : Nginx (VPS)

#### 1. Build l'application
```bash
npm run build
```

#### 2. Transférer sur le serveur
```bash
scp -r dist/* user@votre-serveur:/var/www/valcar
```

#### 3. Configuration Nginx
Créer `/etc/nginx/sites-available/valcar` :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name valcar.app www.valcar.app;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name valcar.app www.valcar.app;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/valcar.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/valcar.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/valcar;
    index index.html;

    # Security Headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}
```

#### 4. Activer le site
```bash
sudo ln -s /etc/nginx/sites-available/valcar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL avec Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d valcar.app -d www.valcar.app
```

---

## 🔍 Tests post-déploiement

### Checklist de vérification

- [ ] **Fonctionnalités**
  - [ ] Inscription utilisateur fonctionne
  - [ ] Connexion utilisateur fonctionne
  - [ ] Ajout de véhicule fonctionne
  - [ ] Upload de photos fonctionne
  - [ ] Navigation entre les écrans fluide
  - [ ] Animations affichées correctement

- [ ] **Sécurité**
  - [ ] HTTPS forcé (pas de HTTP)
  - [ ] Headers de sécurité présents
  - [ ] CSP configuré
  - [ ] DevTools protection activée (production)
  - [ ] Validation des formulaires active

- [ ] **Performance**
  - [ ] Lighthouse Score > 90
  - [ ] First Contentful Paint < 1.5s
  - [ ] Time to Interactive < 3s
  - [ ] Lazy loading actif
  - [ ] Images optimisées

- [ ] **Responsive**
  - [ ] iPhone SE (320px) ✅
  - [ ] iPhone 12/13 (390px) ✅
  - [ ] iPad (768px) ✅
  - [ ] Desktop (1920px) ✅

### Outils de test

```bash
# Lighthouse (Performance + Sécurité)
npx lighthouse https://valcar.app --view

# Security Headers
curl -I https://valcar.app

# SSL Test
https://www.ssllabs.com/ssltest/analyze.html?d=valcar.app
```

---

## 📊 Monitoring

### 1. Supabase Dashboard

Surveiller :
- **Auth metrics** : Nombre d'utilisateurs actifs
- **Database usage** : Taille de la base
- **API calls** : Requêtes par jour
- **Errors** : Logs d'erreurs

### 2. Google Analytics (Optionnel)

Configuration dans `index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Sentry (Monitoring d'erreurs - Recommandé)

Installation :
```bash
npm install @sentry/react @sentry/vite-plugin
```

Configuration dans `App.tsx` :
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
  environment: import.meta.env.VITE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## 🔄 Mise à jour

### Processus de mise à jour

1. **Développement**
   ```bash
   git checkout -b feature/nouvelle-fonctionnalite
   # Développer...
   git commit -m "feat: nouvelle fonctionnalité"
   ```

2. **Tests**
   ```bash
   npm run build
   npm run preview
   # Tester manuellement
   ```

3. **Merge & Deploy**
   ```bash
   git checkout main
   git merge feature/nouvelle-fonctionnalite
   git push origin main
   
   # Déploiement automatique (Vercel/Netlify)
   # ou manuel
   vercel --prod
   ```

### Rollback en cas de problème

#### Vercel
```bash
vercel rollback
```

#### Netlify
```bash
netlify rollback
```

#### Nginx
```bash
# Restaurer la version précédente
cp /var/www/valcar-backup/* /var/www/valcar/
sudo systemctl reload nginx
```

---

## 🛠️ Maintenance

### Tâches régulières

#### Quotidiennes
- Vérifier les logs d'erreur (Sentry/Supabase)
- Surveiller l'utilisation database

#### Hebdomadaires
- Backup de la base Supabase
- Vérifier les métriques de performance
- Review des nouveaux utilisateurs

#### Mensuelles
- Mise à jour des dépendances npm
- Audit de sécurité (`npm audit`)
- Review des logs d'accès

#### Trimestrielles
- Audit de sécurité complet
- Tests de pénétration
- Review des performances
- Nettoyage des données obsolètes

### Commandes utiles

```bash
# Mise à jour des dépendances
npm update

# Audit de sécurité
npm audit
npm audit fix

# Vérifier les dépendances obsolètes
npx npm-check-updates -u

# Analyser le bundle
npx vite-bundle-visualizer
```

---

## 📞 Support & Dépannage

### Problèmes courants

#### 1. "Failed to fetch" lors de la connexion

**Cause :** URL Supabase incorrecte  
**Solution :**
```bash
# Vérifier .env
cat .env | grep SUPABASE_URL

# Vérifier build
cat dist/assets/index-*.js | grep supabase
```

#### 2. Animations ne fonctionnent pas

**Cause :** Motion non installé  
**Solution :**
```bash
npm install motion
npm run build
```

#### 3. Images ne s'affichent pas

**Cause :** CSP trop strict  
**Solution :** Ajouter `img-src 'self' data: https:` au CSP

#### 4. Erreur "useApp must be used within AppProvider"

**Cause :** Hot-reload en développement  
**Solution :** Hard refresh (Ctrl+Shift+R)

### Logs de débogage

```bash
# Logs Vercel
vercel logs

# Logs Netlify
netlify logs

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 📚 Ressources additionnelles

### Documentation
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Motion Documentation](https://motion.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Outils
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Security Headers](https://securityheaders.com/)

### Communauté
- GitHub Issues pour bugs
- Discord pour support communautaire
- Stack Overflow pour questions techniques

---

## ✅ Checklist finale

Avant de déclarer "Production Ready" :

- [ ] Build sans erreurs ni warnings
- [ ] Toutes les variables d'environnement configurées
- [ ] Supabase RLS activé et testé
- [ ] Headers de sécurité configurés
- [ ] HTTPS configuré avec certificat valide
- [ ] Lighthouse Score > 90
- [ ] Tests manuels passés sur mobile et desktop
- [ ] Monitoring activé (Analytics + Sentry)
- [ ] Backup automatique configuré
- [ ] Documentation à jour
- [ ] Équipe formée sur le déploiement

---

**Version du guide :** 1.0  
**Dernière mise à jour :** 12 février 2026  
**Auteur :** Équipe Valcar

**Bonne chance pour votre déploiement ! 🚀**
