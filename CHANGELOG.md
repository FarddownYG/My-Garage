# Changelog

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [1.0.0] - 2026-01-08

### 🎉 Release Initiale

#### ✨ Ajouté
- **Authentification multi-profils** avec système de PIN sécurisé
- **Gestion complète des véhicules** (voitures, motos, utilitaires)
- **34 templates d'entretien** pré-configurés (essence/diesel)
  - 🛢️ Entretien courant (vidange, filtres, bougies)
  - 🧴 Fluides (refroidissement, frein, direction)
  - 🛑 Freinage (plaquettes, disques, liquide)
  - ⚙️ Distribution (courroie, galets, pompe à eau)
  - 🔋 Électrique (batterie, alternateur)
  - ❄️ Climatisation (recharge gaz, filtres)
  - 🏁 Performance (échappement, amortisseurs, pneus)
  - 🧰 Divers (contrôle technique, géométrie)

- **Carnet d'entretien chronologique** par véhicule
- **Système d'alertes intelligent** avec calcul automatique des échéances
  - Alertes par kilométrage
  - Alertes par date
  - Niveaux d'urgence (expirée, haute, moyenne, basse)
  - Filtrage des alertes proches (< 2000 km ou < 60 jours)

- **Système de tâches/rappels** par véhicule
- **Dashboard centralisé** avec statistiques
- **Zone admin protégée** pour gérer les profils
- **Export/Import chiffré** des données (JSON)
- **Design dark mode** premium iOS-first
- **Navigation bottom** fixe avec 4 sections

#### 🔐 Sécurité
- **Cryptage AES-256-GCM** de toutes les données
- **Protection XSS** avec sanitization des inputs
- **Device fingerprinting** en production
- **Checksum SHA-256** pour l'intégrité des données
- **Protection contre les iframes** (clickjacking)
- **Nettoyage automatique** du presse-papiers
- **Protection DevTools** (optionnelle)

#### 🎨 Design
- **Gradients modernes** bleu/purple
- **Effets glassmorphism** et neumorphism
- **Animations fluides** avec Motion (Framer Motion)
- **Modals 100% responsive** avec positionnement adaptatif
- **Mobile-first** entièrement responsive
- **Tailwind CSS 4.0** pour le styling

#### ⚡ Performance
- **Vite 6.0** - Build ultra-rapide
- **Code splitting** automatique
- **Tree shaking** pour réduire le bundle
- **useMemo/useCallback** pour optimiser les re-renders
- **LocalStorage crypté** pour la persistance

#### 📱 Compatibilité
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Mobile responsive (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)

---

## [À venir]

### Version 1.1 (Prochainement)
- [ ] Notifications push pour les échéances
- [ ] Export PDF du carnet d'entretien
- [ ] Graphiques de dépenses (recharts)
- [ ] Mode clair (light mode)
- [ ] Synchronisation cloud optionnelle

### Version 1.2 (Future)
- [ ] Scanner de factures (OCR)
- [ ] Partage de véhicule entre profils
- [ ] Statistiques avancées (consommation, coûts)
- [ ] Intégration API constructeurs
- [ ] Assistant IA pour diagnostics

---

## Catégories de changements

- `✨ Ajouté` - Nouvelles fonctionnalités
- `🔄 Modifié` - Changements dans les fonctionnalités existantes
- `🗑️ Supprimé` - Fonctionnalités retirées
- `🐛 Corrigé` - Corrections de bugs
- `🔐 Sécurité` - Correctifs de vulnérabilités
- `📝 Documentation` - Modifications de la documentation
- `⚡ Performance` - Améliorations de performance

---

**Valcar** - Gardez votre historique d'entretien à jour ! 🚗✨
