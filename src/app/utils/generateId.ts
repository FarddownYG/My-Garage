/**
 * Utilitaire pour générer des IDs uniques sécurisés
 * Évite les collisions avec Date.now() en ajoutant un compteur et de l'aléatoire
 */

let counter = 0;

/**
 * Génère un ID unique basé sur timestamp + compteur + random
 * Format: {timestamp}-{counter}-{random}
 * Exemple: 1706543210123-42-a7b3c9
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  counter = (counter + 1) % 10000; // Reset tous les 10000
  const random = Math.random().toString(36).substring(2, 8);
  
  const id = `${timestamp}-${counter}-${random}`;
  
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Génère un ID court pour les cas où la lisibilité est importante
 * Format: {random}{timestamp_short}
 * Exemple: a7b3c9-543210
 */
export function generateShortId(prefix?: string): string {
  const timestampShort = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  
  const id = `${random}-${timestampShort}`;
  
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Génère un UUID v4 simple (sans dépendance externe)
 * Format standard: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Valide si une chaîne est un ID généré par generateId
 */
export function isValidGeneratedId(id: string): boolean {
  // Format: {timestamp}-{counter}-{random} ou {prefix}-{timestamp}-{counter}-{random}
  const parts = id.split('-');
  
  if (parts.length < 3) return false;
  
  // Vérifier le timestamp (doit être un nombre)
  const timestampIndex = parts.length === 3 ? 0 : 1;
  const timestamp = parseInt(parts[timestampIndex], 10);
  
  if (isNaN(timestamp)) return false;
  
  // Vérifier que le timestamp est raisonnable (après 2020)
  const minTimestamp = new Date('2020-01-01').getTime();
  if (timestamp < minTimestamp) return false;
  
  return true;
}
