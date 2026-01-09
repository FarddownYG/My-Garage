# Contribution à Valcar

Merci de votre intérêt pour contribuer à **Valcar** ! 🚗✨

## 🤝 Comment contribuer

### 1. Fork le projet
Créez votre propre fork du repository.

### 2. Créez une branche
```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 3. Faites vos modifications
- Suivez le style de code existant
- Commentez votre code si nécessaire
- Testez vos modifications

### 4. Committez vos changements
```bash
git commit -m "✨ Ajout d'une nouvelle fonctionnalité"
```

Utilisez des commits clairs avec des émojis :
- ✨ `:sparkles:` - Nouvelle fonctionnalité
- 🐛 `:bug:` - Correction de bug
- 📝 `:memo:` - Documentation
- 🎨 `:art:` - Amélioration UI/UX
- ⚡ `:zap:` - Performance
- 🔒 `:lock:` - Sécurité
- ♻️ `:recycle:` - Refactoring

### 5. Push vers votre fork
```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

### 6. Créez une Pull Request
Ouvrez une PR avec une description détaillée de vos changements.

## 📋 Guidelines

### Code Style
- **TypeScript** : Toujours typer les variables et fonctions
- **React** : Utiliser les hooks fonctionnels
- **Tailwind** : Classes utilitaires uniquement
- **Nommage** : camelCase pour les variables, PascalCase pour les composants

### Structure des composants
```tsx
import React from 'react';
import type { MyType } from '../types';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Sécurité
- **TOUJOURS** sanitiser les inputs utilisateurs
- **TOUJOURS** crypter les données sensibles
- **JAMAIS** de données sensibles en clair dans le code

### Tests
- Tester manuellement toutes les fonctionnalités
- Vérifier la responsivité mobile/desktop
- Tester sur différents navigateurs (Chrome, Firefox, Safari)

## 🐛 Reporter un bug

1. Vérifiez que le bug n'a pas déjà été reporté
2. Ouvrez une **Issue** avec :
   - **Titre clair** du problème
   - **Description détaillée**
   - **Steps to reproduce**
   - **Comportement attendu**
   - **Comportement actuel**
   - **Captures d'écran** si applicable
   - **Environnement** (navigateur, OS, version)

## 💡 Proposer une fonctionnalité

1. Ouvrez une **Issue** avec le tag `enhancement`
2. Décrivez la fonctionnalité en détail
3. Expliquez pourquoi elle serait utile
4. Si possible, proposez une implémentation

## 📦 Développement local

### Installation
```bash
# Cloner le repository
git clone https://github.com/votre-username/valcar.git
cd valcar

# Installer les dépendances
npm install

# Lancer en dev
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

## 🎯 Priorités actuelles

- [ ] Notifications push
- [ ] Export PDF
- [ ] Graphiques de dépenses
- [ ] Mode clair
- [ ] Synchronisation cloud (optionnelle)

## ❓ Questions

Si vous avez des questions, n'hésitez pas à :
- Ouvrir une **Discussion** sur GitHub
- Contacter via email : votre.email@exemple.com

## 📄 Licence

En contribuant, vous acceptez que vos contributions soient sous licence **MIT**.

---

Merci pour votre contribution ! 🙏
