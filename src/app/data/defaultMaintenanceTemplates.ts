import type { MaintenanceTemplate } from '../types';

/**
 * Templates d'entretien par défaut - 35 templates
 * Chargés automatiquement au démarrage de l'application
 * Organisés par motorisation : essence/diesel/both
 */
export const defaultMaintenanceTemplates: MaintenanceTemplate[] = [
  // ========================================
  // COMMUN AUX DEUX MOTORISATIONS (28)
  // ========================================
  
  // 🛢️ Entretien courant (5)
  {
    id: 'vidange-huile',
    name: 'Vidange huile moteur',
    icon: '🛢️',
    intervalMonths: 12,
    intervalKm: 15000,
    fuelType: 'both',
  },
  {
    id: 'filtre-huile',
    name: 'Filtre à huile',
    icon: '🛢️',
    intervalMonths: 12,
    intervalKm: 15000,
    fuelType: 'both',
  },
  {
    id: 'filtre-air',
    name: 'Filtre à air moteur',
    icon: '🛢️',
    intervalMonths: 24,
    intervalKm: 30000,
    fuelType: 'both',
  },
  {
    id: 'filtre-habitacle',
    name: 'Filtre d\'habitacle',
    icon: '🛢️',
    intervalMonths: 12,
    intervalKm: 15000,
    fuelType: 'both',
  },
  {
    id: 'revision-complete',
    name: 'Révision complète',
    icon: '🛢️',
    intervalMonths: 12,
    intervalKm: 20000,
    fuelType: 'both',
  },

  // 🧴 Fluides (3)
  {
    id: 'liquide-frein',
    name: 'Liquide de frein',
    icon: '🧴',
    intervalMonths: 24,
    intervalKm: 40000,
    fuelType: 'both',
  },
  {
    id: 'liquide-refroidissement',
    name: 'Liquide de refroidissement',
    icon: '🧴',
    intervalMonths: 54,
    intervalKm: 100000,
    fuelType: 'both',
  },
  {
    id: 'liquide-direction',
    name: 'Liquide de direction assistée',
    icon: '🧴',
    intervalMonths: 36,
    intervalKm: 60000,
    fuelType: 'both',
  },

  // 🛑 Freinage (4)
  {
    id: 'plaquettes-av',
    name: 'Plaquettes de frein AV',
    icon: '🛑',
    intervalMonths: 24,
    intervalKm: 30000,
    fuelType: 'both',
  },
  {
    id: 'plaquettes-ar',
    name: 'Plaquettes de frein AR',
    icon: '🛑',
    intervalMonths: 36,
    intervalKm: 50000,
    fuelType: 'both',
  },
  {
    id: 'disques-av',
    name: 'Disques de frein AV',
    icon: '🛑',
    intervalMonths: 48,
    intervalKm: 60000,
    fuelType: 'both',
  },
  {
    id: 'disques-ar',
    name: 'Disques de frein AR',
    icon: '🛑',
    intervalMonths: 54,
    intervalKm: 80000,
    fuelType: 'both',
  },

  // 🛞 Pneus & géométrie (4)
  {
    id: 'pneus',
    name: 'Pneumatiques (x4)',
    icon: '🛞',
    intervalMonths: 54,
    intervalKm: 50000,
    fuelType: 'both',
  },
  {
    id: 'permutation-pneus',
    name: 'Permutation des pneus',
    icon: '🛞',
    intervalMonths: 12,
    intervalKm: 15000,
    fuelType: 'both',
  },
  {
    id: 'equilibrage',
    name: 'Équilibrage',
    icon: '🛞',
    intervalMonths: 12,
    intervalKm: 15000,
    fuelType: 'both',
  },
  {
    id: 'geometrie',
    name: 'Géométrie / Parallélisme',
    icon: '🛞',
    intervalMonths: 24,
    intervalKm: 30000,
    fuelType: 'both',
  },

  // ⛓️ Distribution (2)
  {
    id: 'courroie-distribution',
    name: 'Courroie de distribution',
    icon: '⛓️',
    intervalMonths: 60,
    intervalKm: 100000,
    fuelType: 'both',
  },
  {
    id: 'courroie-accessoires',
    name: 'Courroie d\'accessoires',
    icon: '⛓️',
    intervalMonths: 48,
    intervalKm: 80000,
    fuelType: 'both',
  },

  // 🔋 Électricité / contrôles (2)
  {
    id: 'batterie',
    name: 'Batterie',
    icon: '🔋',
    intervalMonths: 48,
    fuelType: 'both',
  },
  {
    id: 'controle-technique',
    name: 'Contrôle technique',
    icon: '🔋',
    intervalMonths: 24,
    fuelType: 'both',
  },

  // ❄️ Confort (1)
  {
    id: 'climatisation',
    name: 'Climatisation (contrôle / recharge)',
    icon: '❄️',
    intervalMonths: 24,
    fuelType: 'both',
  },

  // 🛞 Suspension / structure (4)
  {
    id: 'amortisseurs-av',
    name: 'Amortisseurs AV',
    icon: '🛞',
    intervalMonths: 54,
    intervalKm: 80000,
    fuelType: 'both',
  },
  {
    id: 'amortisseurs-ar',
    name: 'Amortisseurs AR',
    icon: '🛞',
    intervalMonths: 54,
    intervalKm: 80000,
    fuelType: 'both',
  },
  {
    id: 'rotules',
    name: 'Rotules de suspension (contrôle)',
    icon: '🛞',
    intervalMonths: 48,
    intervalKm: 60000,
    fuelType: 'both',
  },
  {
    id: 'silent-blocs',
    name: 'Silent-blocs (contrôle)',
    icon: '🛞',
    intervalMonths: 54,
    intervalKm: 80000,
    fuelType: 'both',
  },

  // 🚗 Transmission (2)
  {
    id: 'huile-boite',
    name: 'Huile de boîte de vitesses',
    icon: '🚗',
    intervalMonths: 54,
    intervalKm: 100000,
    fuelType: 'both',
  },
  {
    id: 'catalyseur',
    name: 'Catalyseur',
    icon: '🚗',
    intervalMonths: 96,
    intervalKm: 150000,
    fuelType: 'both',
  },

  // 🧼 Divers (1)
  {
    id: 'essuie-glaces',
    name: 'Balais d\'essuie-glaces',
    icon: '🧼',
    intervalMonths: 12,
    fuelType: 'both',
  },

  // ========================================
  // SPÉCIFIQUE ESSENCE (2)
  // ========================================

  // 🔥 Allumage / carburant
  {
    id: 'bougies-allumage',
    name: 'Bougies d\'allumage',
    icon: '🔥',
    intervalMonths: 36,
    intervalKm: 60000,
    fuelType: 'essence',
  },
  {
    id: 'filtre-carburant-essence',
    name: 'Filtre à carburant (essence)',
    icon: '🔥',
    intervalMonths: 24,
    intervalKm: 40000,
    fuelType: 'essence',
  },

  // ========================================
  // SPÉCIFIQUE DIESEL (4)
  // ========================================

  // 🔥 Spécifique diesel
  {
    id: 'filtre-carburant-diesel',
    name: 'Filtre à carburant (diesel)',
    icon: '🔥',
    intervalMonths: 24,
    intervalKm: 30000,
    fuelType: 'diesel',
  },
  {
    id: 'bougies-prechauffage',
    name: 'Bougies de préchauffage',
    icon: '🔥',
    intervalMonths: 54,
    intervalKm: 100000,
    fuelType: 'diesel',
  },

  // 🌫️ Dépollution (diesel)
  {
    id: 'fap',
    name: 'Filtre à particules (FAP – contrôle)',
    icon: '🌫️',
    intervalMonths: 54,
    intervalKm: 120000,
    fuelType: 'diesel',
  },
  {
    id: 'vanne-egr',
    name: 'Vanne EGR (contrôle / nettoyage)',
    icon: '🌫️',
    intervalMonths: 54,
    intervalKm: 100000,
    fuelType: 'diesel',
  },

  // ========================================
  // SPÉCIFIQUE 4x4 (7)
  // ========================================

  // 🚙 Transmission 4x4
  {
    id: 'boite-transfert',
    name: 'Boîte de transfert',
    icon: '🚙',
    intervalMonths: 48,
    intervalKm: 60000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'pont-avant',
    name: 'Pont avant',
    icon: '🚙',
    intervalMonths: 48,
    intervalKm: 50000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'pont-arriere-4x4',
    name: 'Pont arrière 4x4',
    icon: '🚙',
    intervalMonths: 48,
    intervalKm: 50000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'systeme-awd',
    name: 'Système AWD',
    icon: '🚙',
    intervalMonths: 36,
    intervalKm: 60000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'arbres-transmission',
    name: 'Arbres de transmission',
    icon: '🚙',
    intervalMonths: 24,
    intervalKm: 30000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'moyeux-debrayables',
    name: 'Moyeux débrayables',
    icon: '🚙',
    intervalMonths: 36,
    intervalKm: 40000,
    fuelType: 'both',
    driveType: '4x4',
  },
  {
    id: 'controle-transmission-4x4',
    name: 'Contrôle transmission 4x4',
    icon: '🚙',
    intervalMonths: 12,
    intervalKm: 20000,
    fuelType: 'both',
    driveType: '4x4',
  },
];

// Total: 28 both + 2 essence + 4 diesel + 7 4x4 = 41 templates