# 🚗 Valcar - Application de Gestion de Véhicules

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)
![Supabase](https://img.shields.io/badge/Supabase-enabled-3ecf8e.svg)

## 📱 Description

**Valcar** est une application web progressive (PWA) premium de gestion de véhicules et carnet d'entretien pour usage privé. Conçue avec un design dark mode moderne iOS-first, elle permet de gérer plusieurs véhicules et profils utilisateurs avec une sécurité renforcée et une synchronisation cloud via Supabase.

### ✨ Fonctionnalités principales

#### 🔐 **Sécurité maximale**
- **Cryptage AES-256-GCM** de toutes les données stockées
- **Protection XSS/CSRF** avec sanitization complète
- **Authentification multi-profils** type Netflix
- **Système de PIN** à 4 chiffres par profil
- **Zone admin** protégée pour la gestion des profils
- **Export/Import** chiffrés des données
- **Synchronisation Supabase** pour sauvegarde cloud sécurisée

#### 🚗 **Gestion des véhicules**
- Ajout illimité de véhicules (voitures, motos, utilitaires)
- Informations détaillées : marque, modèle, année, kilométrage
- Suivi du kilométrage en temps réel
- **Upload photos** depuis galerie mobile
- Choix du type de motorisation (Essence/Diesel)
- **Support 4x4** avec templates spécifiques

#### 🛠️ **Carnet d'entretien intelligent**
- **41 templates d'entretien pré-configurés** différenciés selon motorisation et transmission (4x2/4x4) :
  - 🛢️ Entretien courant (vidange, filtres, bougies)
  - 🧴 Fluides (liquide de refroidissement, frein, direction)
  - 🛑 Freinage (plaquettes, disques, liquide)
  - ⚙️ Distribution (courroie, galets, pompe à eau)
  - 🔋 Électrique (batterie, alternateur)
  - ❄️ Climatisation (recharge gaz, filtres)
  - 🏁 Performance (échappement, amortisseurs, pneus)
  - 🧰 Divers (contrôle technique, géométrie)
  - 🚙 **Spécifique 4x4** (pont, différentiel, cardans, boîtier transfert)

- **Calcul automatique des échéances** :
  - Par kilométrage (ex: tous les 15 000 km)
  - Par temps (ex: tous les 12 mois)
  - Alertes intelligentes (2000 km ou 60 jours avant)
  - **Règle 4,5 ans appliquée** pour tous les intervalles

- **Historique complet** chronologique par véhicule
- Ajout de notes et coûts pour chaque intervention
- Organisation par catégories

#### 📋 **Système de tâches et rappels**
- Création de tâches personnalisées par véhicule
- Suivi de l'état (complété/en attente)
- Rappels automatiques pour les échéances
- Priorisation des urgences

#### 👥 **Multi-profils**
- Création de profils utilisateurs avec avatar emoji
- PIN sécurisé par profil
- Gestion familiale (plusieurs conducteurs)
- Isolation complète des données par profil

#### 🎨 **Design moderne**
- **Dark mode** premium iOS-first
- **Gradients** bleu/purple élégants
- **Effets glassmorphism** et neumorphism
- **Animations fluides** avec Motion (Framer Motion)
- **Navigation bottom** fixe intuitive
- **Modals 100% responsive** avec positionnement adaptatif
- **Mobile-first** entièrement responsive

---

## 🚀 Technologies utilisées

### Frontend
- **React 18.3.1** - Framework UI
- **TypeScript 5.6.2** - Typage statique
- **Tailwind CSS 4.0** - Styling moderne
- **Vite 6.0** - Build tool ultra-rapide
- **Motion (Framer Motion)** - Animations fluides
- **Lucide React** - Icônes modernes

### Sécurité
- **CryptoJS** - Cryptage AES-256-GCM
- **DOMPurify** - Sanitization XSS
- **CSP Headers** - Content Security Policy

### Stockage
- **LocalStorage** chiffré - Persistance des données
- **Export/Import JSON** - Sauvegarde sécurisée
- **Supabase** - Synchronisation cloud

---

## 📦 Installation

### Prérequis
- Node.js 18+ et npm/yarn

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/valcar.git
cd valcar

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

L'application sera accessible sur `http://localhost:5173`

---

## 🔧 Configuration

### Premier lancement

1. **Écran de bienvenue** - Présentation de l'app
2. **Création profil admin** - Prénom, nom, avatar, PIN
3. **Dashboard** - Ajoutez votre premier véhicule !

### PIN par défaut
- **PIN Admin** : `1234` (à changer dans les paramètres)

---

## 📖 Guide d'utilisation

### Ajouter un véhicule
1. Onglet **Véhicules** → Bouton **+**
2. Remplir les informations (nom, marque, modèle, année, km, motorisation)
3. Sauvegarder

### Ajouter un entretien
1. Sélectionner un véhicule
2. Onglet **Entretien** → Bouton **+**
3. Choisir le type d'entretien dans la liste
4. Entrer le kilométrage et la date
5. Ajouter des notes et le coût (optionnel)

### Voir les échéances
1. Dashboard → Carte **Échéances à venir**
2. Affichage des alertes par urgence :
   - 🔴 **Expirées** - À faire immédiatement
   - 🟠 **Urgentes** - Moins de 1000 km ou 30 jours
   - 🟡 **Moyennes** - Moins de 2000 km ou 60 jours

### Gestion multi-profils
1. **Paramètres** → **Gestion des profils**
2. Entrer le PIN admin (`1234`)
3. Ajouter/Modifier/Supprimer des profils
4. Déconnexion pour changer de profil

---

## 🔒 Sécurité et confidentialité

### Protection des données
- ✅ **Toutes les données sont cryptées** en AES-256-GCM
- ✅ **Aucune donnée n'est envoyée** sur internet (100% local)
- ✅ **Protection XSS** sur toutes les entrées utilisateur
- ✅ **CSP stricte** contre les injections
- ✅ **Pas de tracking**, pas de cookies tiers
- ✅ **Conformité RGPD** - Données personnelles sécurisées

### Recommandations
- ⚠️ **Ne pas stocker de données sensibles** (numéros de carte bancaire, etc.)
- ⚠️ **Changer le PIN par défaut** dès la première utilisation
- ⚠️ **Faire des exports réguliers** de vos données
- ⚠️ **Ne pas partager votre PIN** avec des tiers

---

## 📱 PWA - Installation sur mobile

### iOS (Safari)
1. Ouvrir l'app dans Safari
2. Appuyer sur **Partager** (icône ⬆️)
3. Sélectionner **"Sur l'écran d'accueil"**
4. L'app s'installe comme une app native !

### Android (Chrome)
1. Ouvrir l'app dans Chrome
2. Menu ⋮ → **"Ajouter à l'écran d'accueil"**
3. L'app s'installe comme une app native !

---

## 🗺️ Roadmap

### Version 1.1 (À venir)
- [ ] Notifications push pour les échéances
- [ ] Export PDF du carnet d'entretien
- [ ] Graphiques de dépenses
- [ ] Mode clair (light mode)
- [ ] Synchronisation cloud (optionnelle)

### Version 1.2 (Futur)
- [ ] Scanner de factures (OCR)
- [ ] Partage de véhicule entre profils
- [ ] Statistiques avancées
- [ ] Intégration API constructeurs

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

Développé avec ❤️ par **Votre Nom**

---

## 🙏 Remerciements

- **Lucide** pour les icônes
- **Tailwind CSS** pour le framework CSS
- **React** pour le framework UI
- **CryptoJS** pour le cryptage
- La communauté open-source

---

## 📧 Contact

Pour toute question ou suggestion :
- 📧 Email : votre.email@exemple.com
- 🐦 Twitter : @votre_twitter
- 💼 LinkedIn : votre-profil

---

## ⭐ Support

Si vous aimez ce projet, n'hésitez pas à :
- ⭐ **Star** le repository
- 🐛 Signaler des bugs via les **Issues**
- 💡 Proposer des améliorations
- 🔀 Fork et contribuer !

---

**Valcar** - Votre carnet d'entretien digital, simple et sécurisé 🚗✨