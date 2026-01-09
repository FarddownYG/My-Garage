import type { MaintenanceRecord, Vehicle, MaintenanceTemplate } from '../types';

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
  templates: MaintenanceTemplate[]
): UpcomingAlert[] {
  const alerts: UpcomingAlert[] = [];
  const today = new Date();

  vehicles.forEach((vehicle) => {
    const vehicleMaintenances = maintenances.filter(
      (m) => m.vehicleId === vehicle.id
    );

    // Filtrer les templates selon le type de motorisation du véhicule
    const applicableTemplates = templates.filter((template) => {
      if (!vehicle.fuelType) return template.fuelType === 'both'; // Par défaut, seulement les communs
      return (
        template.fuelType === 'both' || template.fuelType === vehicle.fuelType
      );
    });

    // Pour chaque template applicable, vérifier si un entretien existe et calculer l'échéance
    applicableTemplates.forEach((template) => {
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

        if (hasExpired) {
          urgency = 'expired';
        } else if (
          (mileageAlert && mileageAlert.remainingKm < 1000) ||
          (dateAlert && dateAlert.remainingDays < 15)
        ) {
          urgency = 'high';
        } else if (
          (mileageAlert && mileageAlert.remainingKm < 3000) ||
          (dateAlert && dateAlert.remainingDays < 60)
        ) {
          urgency = 'medium';
        }

        const category = categoryNames[template.icon] || 'Autre';

        alerts.push({
          id: maintenanceId
            ? `${vehicle.id}-${maintenanceId}-${template.name}`
            : `${vehicle.id}-new-${template.id}`,
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

  // Trier par catégorie d'abord, puis par urgence
  return alerts.sort((a, b) => {
    // D'abord par urgence (expirées en premier)
    const urgencyOrder = { expired: 0, high: 1, medium: 2, low: 3 };
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];

    if (urgencyDiff !== 0) return urgencyDiff;

    // Ensuite par catégorie
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    // Ensuite par km/jours restants
    if (a.mileageAlert && b.mileageAlert) {
      return a.mileageAlert.remainingKm - b.mileageAlert.remainingKm;
    }
    if (a.dateAlert && b.dateAlert) {
      return a.dateAlert.remainingDays - b.dateAlert.remainingDays;
    }

    return 0;
  });
}
