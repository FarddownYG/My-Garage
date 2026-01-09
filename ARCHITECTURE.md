# Architecture Technique - Valcar

## 📐 Vue d'ensemble

Valcar est une **PWA (Progressive Web App)** construite avec React et TypeScript, utilisant le stockage local crypté pour garantir la confidentialité des données.

## 🏗️ Structure du projet

```
valcar/
├── src/
│   ├── app/
│   │   ├── components/          # Composants React
│   │   │   ├── auth/            # Authentification & profils
│   │   │   ├── home/            # Dashboard
│   │   │   ├── maintenance/     # Entretien & carnet
│   │   │   ├── settings/        # Paramètres
│   │   │   ├── shared/          # Composants partagés
│   │   │   ├── tasks/           # Gestion des tâches
│   │   │   ├── ui/              # Composants UI réutilisables
│   │   │   └── vehicles/        # Gestion des véhicules
│   │   ├── contexts/            # Contextes React (état global)
│   │   ├── data/                # Données statiques (templates)
│   │   ├── types/               # Types TypeScript
│   │   ├── utils/               # Utilitaires
│   │   │   ├── alerts.ts        # Calcul des échéances
│   │   │   ├── encryption.ts    # Cryptage AES-256
│   │   │   └── security.ts      # Mesures de sécurité
│   │   └── App.tsx              # Point d'entrée
│   └── styles/                  # Styles CSS/Tailwind
├── package.json
├── vite.config.ts
└── README.md
```

## 🔧 Technologies utilisées

### Frontend
- **React 18.3.1** - Framework UI avec hooks
- **TypeScript 5.6.2** - Typage statique
- **Tailwind CSS 4.0** - Framework CSS utilitaire
- **Vite 6.0** - Build tool ultra-rapide
- **Motion (Framer Motion)** - Animations fluides

### State Management
- **React Context API** - Gestion d'état global
- **React Hooks** - useState, useEffect, useMemo, useContext

### Sécurité
- **Web Crypto API** - Cryptage natif du navigateur
- **CryptoJS** - Algorithmes de hachage
- **DOMPurify** - Sanitization XSS (implicite via sanitizeInput)

### Stockage
- **LocalStorage** - Persistance locale des données
- **Cryptage AES-256-GCM** - Toutes les données sont chiffrées

## 🔐 Sécurité

### 1. Cryptage des données
```typescript
// encryption.ts
async function deriveKey(password: string): Promise<CryptoKey>
async function encryptData(data: any, password: string): Promise<string>
async function decryptData(encryptedString: string, password: string): Promise<any>
```

**Algorithme** : AES-256-GCM avec PBKDF2 (100 000 itérations)

### 2. Protection XSS
```typescript
// security.ts
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

Toutes les entrées utilisateur sont sanitizées avant stockage.

### 3. Intégrité des données
```typescript
// Checksum SHA-256 pour vérifier l'intégrité
async function createChecksum(data: string): Promise<string>
async function verifyChecksum(data: string, checksum: string): Promise<boolean>
```

### 4. Device Fingerprinting
```typescript
// Lie le cryptage à l'appareil en production
async function getDeviceFingerprint(): Promise<string>
```

### 5. Protections additionnelles
- ❌ Désactivation du clic droit (optionnel)
- ❌ Blocage des raccourcis DevTools (optionnel)
- 🛡️ Protection contre les iframes (clickjacking)
- 🧹 Nettoyage du presse-papiers à la fermeture

## 🗂️ Gestion de l'état

### AppContext
Le contexte global gère :
- **Profils** : Utilisateurs multi-profils
- **Véhicules** : Liste des véhicules par profil
- **Entretiens** : Historique des maintenances
- **Tâches** : To-do list par véhicule
- **Templates** : 34 modèles d'entretien pré-configurés
- **Alertes** : Échéances calculées dynamiquement

### Flux de données
```
User Action → Component → Context → LocalStorage (crypté)
                              ↓
                      State Update → Re-render
```

## 📊 Système d'alertes

### Calcul des échéances
```typescript
// alerts.ts
export function calculateUpcomingAlerts(
  vehicles: Vehicle[],
  maintenances: MaintenanceRecord[],
  templates: MaintenanceTemplate[]
): UpcomingAlert[]
```

**Logique** :
1. Pour chaque véhicule
2. Pour chaque template d'entretien
3. Trouver le dernier entretien effectué
4. Calculer la prochaine échéance (km + date)
5. Déterminer l'urgence (expirée, haute, moyenne, basse)
6. Filtrer les alertes proches (< 2000 km ou < 60 jours)

### Niveaux d'urgence
- 🔴 **Expirée** : Échéance dépassée
- 🟠 **Haute** : < 1000 km ou < 30 jours
- 🟡 **Moyenne** : < 2000 km ou < 60 jours
- 🔵 **Basse** : > 2000 km et > 60 jours

## 🎨 Design System

### Palette de couleurs
```css
/* Gradients principaux */
--gradient-blue-purple: from-blue-500 to-purple-600
--gradient-dark: from-zinc-900 to-black

/* États */
--error: red-600
--warning: orange-500
--success: green-500
--info: blue-500
```

### Effets visuels
- **Glassmorphism** : `backdrop-blur-xl bg-white/10`
- **Neumorphism** : Ombres douces avec `shadow-soft`
- **Hover effects** : `hover-lift` pour les cartes
- **Animations** : Motion (Framer Motion) pour les transitions

### Responsive
```css
/* Mobile-first */
Base: 320px - 768px
Tablet: 768px - 1024px
Desktop: 1024px+
```

## 🔄 Workflow de données

### Création d'un véhicule
```
AddVehicleModal → addVehicle(vehicle)
                      ↓
              AppContext.setState()
                      ↓
              saveEncryptedToStorage()
                      ↓
              LocalStorage (AES-256)
```

### Ajout d'un entretien
```
AddMaintenanceModal → addMaintenanceEntry(entry)
                            ↓
                    AppContext.setState()
                            ↓
                    Recalcul des alertes (useMemo)
                            ↓
                    Update Dashboard
```

### Authentification
```
ProfileSelector → Choix profil
                      ↓
              PinEntry → Vérification PIN
                      ↓
              setCurrentProfile(profile)
                      ↓
              Navigation Dashboard
```

## 📱 PWA - Service Worker

**Note** : Actuellement, l'application est une SPA (Single Page Application).

Pour transformer en vraie PWA, ajouter :
1. `manifest.json` - Métadonnées de l'app
2. Service Worker - Cache offline
3. Icon set - Icônes pour tous les appareils

## 🚀 Performance

### Optimisations
- ✅ **Code splitting** - Lazy loading des composants
- ✅ **useMemo** - Mémorisation des calculs coûteux
- ✅ **useCallback** - Mémorisation des fonctions
- ✅ **Virtual scrolling** - Liste longue (si nécessaire)
- ✅ **Tree shaking** - Suppression du code mort (Vite)

### Métriques cibles
- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3.5s
- **Bundle size** : < 500 KB (gzipped)

## 🧪 Tests (à implémenter)

### Recommandations
```bash
# Unit tests
npm install --save-dev vitest @testing-library/react

# E2E tests
npm install --save-dev playwright
```

### Structure de tests
```
src/
  __tests__/
    components/
    utils/
    integration/
```

## 📦 Build & Déploiement

### Build de production
```bash
npm run build
# Output: dist/
```

### Hébergement recommandé
- **Vercel** - Zero-config
- **Netlify** - Simple et rapide
- **GitHub Pages** - Gratuit
- **Firebase Hosting** - Avec analytics

### Variables d'environnement
Voir `.env.example` pour la configuration.

## 🔮 Évolutions futures

### v1.1
- [ ] Notifications push (Service Worker)
- [ ] Export PDF du carnet
- [ ] Graphiques de dépenses (recharts)
- [ ] Mode clair

### v1.2
- [ ] Synchronisation cloud (Supabase/Firebase)
- [ ] Scanner de factures (OCR)
- [ ] Partage de véhicule entre profils
- [ ] Statistiques avancées

### v2.0
- [ ] Application mobile native (React Native)
- [ ] Intégration API constructeurs
- [ ] Assistant IA pour diagnostics
- [ ] Mode collaboratif

## 📞 Support technique

Pour toute question technique :
- 📖 Consulter la documentation
- 🐛 Ouvrir une issue sur GitHub
- 💬 Rejoindre les discussions

---

**Valcar** - Conçu avec ❤️ et ☕
