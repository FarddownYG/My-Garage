import type { MaintenanceRecord, Vehicle, MaintenanceTemplate, MaintenanceProfile } from '../types';

export interface UpcomingAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  maintenanceId?: string;
  maintenanceName: string;
  category: string; // Catégorie pour l'organisation (🛢️, 🧴, 🛑, etc.)
  type: 'mileage' | 'date' | 'both';
  mileageAlert?: {
    currentMileage: number;
    targetMileage: number;
    remainingKm: number;
  };
  dateAlert?: {
    lastDate: Date;
    targetDate: Date;
    remainingDays: number;
  };
  urgency: 'expired' | 'high' | 'medium' | 'low';
  isExpired?: boolean;
}

// Mapping des icônes vers les catégories
const categoryNames: Record<string, string> = {
  '🛢️': 'Entretien courant',
  '🧴': 'Fluides',
  '🛑': 'Freinage',
  '🛞': 'Pneus & géométrie',
  '⛓️': 'Distribution',
  '🔋': 'Électricité / contrôles',
  '❄️': 'Confort',
  '🚗': 'Transmission',
  '🧼': 'Divers',
  '🔥': 'Allumage / carburant',
  '🌫️': 'Dépollution',
};

export function calculateUpcomingAlerts(
  vehicles: Vehicle[],
  maintenances: MaintenanceRecord[],
  templates: MaintenanceTemplate[],
  maintenanceProfiles: MaintenanceProfile[] = []
): UpcomingAlert[] {
  const alerts: UpcomingAlert[] = [];
  const today = new Date();
  let alertCounter = 0; // Compteur unique pour éviter les doublons de clés

  vehicles.forEach((vehicle) => {
    const vehicleMaintenances = maintenances.filter(
      (m) => m.vehicleId === vehicle.id
    );

    // 🔧 Trouver le profil d'entretien personnalisé associé à ce véhicule (si existant)
    const assignedProfile = maintenanceProfiles.find(p => p.vehicleIds.includes(vehicle.id));

    // Filtrer les templates selon le profil d'entretien personnalisé OU selon la motorisation
    let applicableTemplates: MaintenanceTemplate[];

    if (assignedProfile) {
      // ✅ Si un profil personnalisé est assigné, afficher UNIQUEMENT ses templates
      applicableTemplates = templates.filter(t => t.profileId === assignedProfile.id);
    } else {
      // ✅ Sinon, afficher les templates généraux (sans profileId) selon motorisation et transmission
      applicableTemplates = templates.filter((template) => {
        // Exclure les templates appartenant à un profil personnalisé
        if (template.profileId) return false;

        // Filtrage par motorisation (essence/diesel)
        const vehicleFuelType = vehicle.engineType || vehicle.fuelType;
        if (!vehicleFuelType) {
          // Si pas de motorisation définie, seulement les templates "both"
          if (template.fuelType !== 'both') return false;
        } else {
          const fuelMatch = template.fuelType === 'both' || 
            template.fuelType === (vehicleFuelType === 'gasoline' ? 'essence' : vehicleFuelType);
          if (!fuelMatch) return false;
        }

        // Filtrage par transmission (4x2/4x4)
        const vehicleDriveType = vehicle.driveType;
        if (template.driveType && template.driveType !== 'both') {
          // Si le template a un driveType spécifique (pas "both" ou undefined)
          if (!vehicleDriveType || vehicleDriveType !== template.driveType) {
            return false; // Ne pas afficher si incompatible
          }
        }

        return true;
      });
    }
    
    // 🔧 DÉDUPLICATION : Filtrer pour garder seulement un template par nom
    const uniqueTemplates = new Map<string, MaintenanceTemplate>();
    applicableTemplates.forEach(template => {
      if (!uniqueTemplates.has(template.name)) {
        uniqueTemplates.set(template.name, template);
      }
    });
    const deduplicatedTemplates = Array.from(uniqueTemplates.values());

    // Pour chaque template applicable, vérifier si un entretien existe et calculer l'échéance
    deduplicatedTemplates.forEach((template) => {
      // Trouver tous les entretiens de ce type pour ce véhicule
      const matchingMaintenances = vehicleMaintenances.filter(
        (m) => m.type === template.name
      );

      let baseDate: Date;
      let baseMileage: number;
      let maintenanceId: string | undefined;

      if (matchingMaintenances.length > 0) {
        // Trouver le plus récent
        const latest = matchingMaintenances.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        baseDate = new Date(latest.date);
        baseMileage = latest.mileage;
        maintenanceId = latest.id;
      } else {
        // Pas d'entretien enregistré → utiliser la date du véhicule comme base
        if (!vehicle.year) return; // Si pas d'année, on ne peut pas calculer
        baseDate = new Date(vehicle.year, 0, 1); // 1er janvier de l'année du véhicule
        baseMileage = 0; // Pas de base kilométrique si jamais fait
      }

      let mileageAlert: UpcomingAlert['mileageAlert'] | undefined;
      let dateAlert: UpcomingAlert['dateAlert'] | undefined;
      let hasExpired = false;

      // ========================================
      // ALERTE KILOMÉTRIQUE
      // ========================================
      if (template.intervalKm && baseMileage > 0) {
        const targetMileage = baseMileage + template.intervalKm;
        const remainingKm = targetMileage - vehicle.mileage;

        mileageAlert = {
          currentMileage: vehicle.mileage,
          targetMileage,
          remainingKm: remainingKm > 0 ? remainingKm : 0,
        };
        if (remainingKm <= 0) hasExpired = true;
      }

      // ========================================
      // ALERTE DE DATE
      // ========================================
      if (template.intervalMonths) {
        const targetDate = new Date(baseDate);
        targetDate.setMonth(targetDate.getMonth() + template.intervalMonths);

        const remainingDays = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        dateAlert = {
          lastDate: baseDate,
          targetDate,
          remainingDays: remainingDays > 0 ? remainingDays : 0,
        };
        if (remainingDays <= 0) hasExpired = true;
      }

      // Si au moins une alerte existe, ajouter
      if (mileageAlert || dateAlert) {
        let urgency: 'expired' | 'high' | 'medium' | 'low' = 'low';

        // ROUGE : Expiré
        if (hasExpired) {
          urgency = 'expired';
        } 
        // ORANGE : Dans les 750km OU dans 1 mois (30 jours)
        else if (
          (mileageAlert && mileageAlert.remainingKm <= 750) ||
          (dateAlert && dateAlert.remainingDays <= 30)
        ) {
          urgency = 'high';
        } 
        // VERT : Tout le reste (au-dessus de orange)
        else {
          urgency = 'low';
        }

        const category = categoryNames[template.icon] || 'Autre';

        alerts.push({
          id: maintenanceId
            ? `${vehicle.id}-${maintenanceId}-${template.name}`
            : `${vehicle.id}-new-${template.id}-${alertCounter++}`,
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          maintenanceId,
          maintenanceName: template.name,
          category,
          type:
            mileageAlert && dateAlert
              ? 'both'
              : mileageAlert
              ? 'mileage'
              : 'date',
          mileageAlert,
          dateAlert,
          urgency,
          isExpired: hasExpired,
        });
      }
    });
  });

  // Trier par urgence (rouge → orange → vert), puis par proximité à l'intérieur de chaque niveau
  return alerts.sort((a, b) => {
    // D'abord par urgence (expirées en premier = rouge, puis orange, puis vert)
    const urgencyOrder = { expired: 0, high: 1, medium: 2, low: 3 };
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];

    if (urgencyDiff !== 0) return urgencyDiff;

    // À l'intérieur du même niveau d'urgence, trier par proximité (plus proche en premier)
    // Utiliser le plus petit des deux indicateurs (km ou jours)
    const getProximity = (alert: UpcomingAlert): number => {
      const kmProximity = alert.mileageAlert ? alert.mileageAlert.remainingKm : Infinity;
      const daysProximity = alert.dateAlert ? alert.dateAlert.remainingDays * 10 : Infinity; // x10 pour équilibrer avec km
      return Math.min(kmProximity, daysProximity);
    };

    return getProximity(a) - getProximity(b);
  });
}