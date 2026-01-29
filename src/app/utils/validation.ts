// ✅ Validation schemas with Zod
// Type-safe validation for all user inputs

import { z } from 'zod';

/**
 * PIN validation schema
 * 4-6 digits, no weak patterns
 */
export const pinSchema = z
  .string()
  .min(4, 'Le PIN doit contenir au moins 4 chiffres')
  .max(6, 'Le PIN ne peut pas dépasser 6 chiffres')
  .regex(/^\d+$/, 'Le PIN ne peut contenir que des chiffres')
  .refine(
    (pin) => {
      // Check for weak patterns
      const weakPatterns = [
        '0000', '1111', '2222', '3333', '4444', 
        '5555', '6666', '7777', '8888', '9999', 
        '1234', '4321', '0123', '3210'
      ];
      return !weakPatterns.includes(pin);
    },
    'Ce PIN est trop simple, choisissez-en un plus sécurisé'
  );

/**
 * Profile validation schema
 */
export const profileSchema = z.object({
  id: z.string().uuid('ID de profil invalide'),
  firstName: z.string().min(1, 'Le prénom est requis').max(50, 'Le prénom est trop long'),
  lastName: z.string().max(50, 'Le nom est trop long').optional(),
  name: z.string().min(1, 'Le nom est requis'),
  avatar: z.string().url('Avatar invalide').or(z.literal('')).optional(),
  pin: z.string().min(4, 'Le PIN doit contenir au moins 4 chiffres'),
  fontSize: z.number().min(12, 'Taille minimum 12px').max(24, 'Taille maximum 24px').optional(),
  maintenanceProfileId: z.string().uuid('ID de profil d\'entretien invalide').nullable().optional(),
});

/**
 * Vehicle validation schema
 */
export const vehicleSchema = z.object({
  id: z.string().uuid('ID de véhicule invalide'),
  ownerId: z.string().uuid('ID de propriétaire invalide'),
  name: z.string().min(1, 'Le nom du véhicule est requis').max(100, 'Nom trop long'),
  brand: z.string().min(1, 'La marque est requise').max(50, 'Marque trop longue'),
  model: z.string().min(1, 'Le modèle est requis').max(50, 'Modèle trop long'),
  year: z.number().int().min(1900, 'Année invalide').max(new Date().getFullYear() + 1, 'Année future invalide'),
  mileage: z.number().int().min(0, 'Le kilométrage ne peut pas être négatif').max(9999999, 'Kilométrage trop élevé'),
  fuelType: z.enum(['essence', 'diesel', 'electrique', 'hybride'], {
    errorMap: () => ({ message: 'Type de carburant invalide' }),
  }),
  driveType: z.enum(['4x2', '4x4'], {
    errorMap: () => ({ message: 'Type de transmission invalide' }),
  }),
  licensePlate: z.string().max(20, 'Plaque trop longue').optional(),
  vin: z.string().max(17, 'VIN invalide (max 17 caractères)').optional(),
  color: z.string().max(30, 'Couleur trop longue').optional(),
  photo: z.string().url('Photo invalide').optional(),
  purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')).optional(),
  notes: z.string().max(1000, 'Notes trop longues (max 1000 caractères)').optional(),
});

/**
 * Maintenance entry validation schema
 */
export const maintenanceEntrySchema = z.object({
  id: z.string().uuid('ID d\'entrée invalide'),
  vehicleId: z.string().uuid('ID de véhicule invalide'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide')),
  type: z.string().min(1, 'Le type d\'entretien est requis'),
  customType: z.string().optional(),
  customIcon: z.string().optional(),
  description: z.string().max(500, 'Description trop longue (max 500 caractères)').optional(),
  notes: z.string().max(1000, 'Notes trop longues (max 1000 caractères)').optional(),
  mileage: z.number().int().min(0, 'Kilométrage invalide').optional(),
  cost: z.number().min(0, 'Coût invalide').optional(),
  provider: z.string().max(100, 'Fournisseur trop long').optional(),
  invoiceNumber: z.string().max(50, 'Numéro de facture trop long').optional(),
  nextMaintenanceDue: z.number().int().min(0).optional(),
  nextMaintenanceDueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  photos: z.array(z.string().url('Photo invalide')).max(10, 'Maximum 10 photos').optional(),
});

/**
 * Task validation schema
 */
export const taskSchema = z.object({
  id: z.string().uuid('ID de tâche invalide'),
  vehicleId: z.string().uuid('ID de véhicule invalide'),
  title: z.string().min(1, 'Le titre est requis').max(200, 'Titre trop long'),
  description: z.string().max(1000, 'Description trop longue').optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priorité invalide' }),
  }),
  status: z.enum(['todo', 'in-progress', 'done'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  estimatedCost: z.number().min(0, 'Coût estimé invalide').optional(),
  link: z.string().url('Lien invalide').optional(),
  notes: z.string().max(1000, 'Notes trop longues').optional(),
});

/**
 * Reminder validation schema
 */
export const reminderSchema = z.object({
  id: z.string().uuid('ID de rappel invalide'),
  vehicleId: z.string().uuid('ID de véhicule invalide'),
  title: z.string().min(1, 'Le titre est requis').max(200, 'Titre trop long'),
  description: z.string().max(500, 'Description trop longue').optional(),
  type: z.enum(['mileage', 'date', 'both'], {
    errorMap: () => ({ message: 'Type de rappel invalide' }),
  }),
  targetMileage: z.number().int().min(0).optional(),
  targetDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  isActive: z.boolean(),
  notificationSent: z.boolean().optional(),
});

/**
 * Sanitize URL to prevent XSS attacks
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate and sanitize any data against a schema
 */
export function validateData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    console.error('❌ Validation échouée:', errors);
    return { success: false, errors };
  }
}

/**
 * Validate PIN specifically
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  const result = pinSchema.safeParse(pin);
  
  if (result.success) {
    return { valid: true };
  } else {
    const firstError = result.error.errors[0];
    return { valid: false, error: firstError.message };
  }
}
