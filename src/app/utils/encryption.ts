// Utility for encrypting/decrypting app data
// Uses Web Crypto API (native browser encryption)

import { createChecksum, verifyChecksum, isFigmaEnvironment } from './security';

const ENCRYPTION_KEY = 'valcar-secure-key-2026'; // Can be customized by user
const STORAGE_KEY = 'valcar-app-state-encrypted-v3'; // Changed key to force refresh with new system

/**
 * Check if localStorage is available and working
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test_storage__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('✅ localStorage disponible');
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage non disponible:', e);
    return false;
  }
}

/**
 * Derives a crypto key from a password string
 * Simplified for Figma environment - uses only password without device fingerprint
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // In Figma environment, skip device fingerprint for better compatibility
  const useFingerprintProtection = !isFigmaEnvironment();
  
  let keySource = password;
  if (useFingerprintProtection) {
    // Import device fingerprint only in production
    const { getDeviceFingerprint } = await import('./security');
    const deviceId = await getDeviceFingerprint();
    keySource = password + deviceId;
    console.log('🔒 Cryptage avec protection par empreinte d\'appareil');
  } else {
    console.log('🔒 Cryptage standard (environnement Figma)');
  }
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keySource),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('valcar-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data to a base64 string with integrity checksum
 */
export async function encryptData(data: any, password: string = ENCRYPTION_KEY): Promise<string> {
  try {
    const key = await deriveKey(password);
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    
    // Create checksum for data integrity
    const checksum = await createChecksum(dataString);
    const dataWithChecksum = JSON.stringify({ data: dataString, checksum });
    
    const dataBuffer = encoder.encode(dataWithChecksum);

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('❌ Erreur de cryptage:', error);
    throw error;
  }
}

/**
 * Decrypts a base64 string back to data with integrity verification
 */
export async function decryptData(encryptedString: string, password: string = ENCRYPTION_KEY): Promise<any> {
  try {
    const key = await deriveKey(password);

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const dataWithChecksum = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(dataWithChecksum);
    
    // Verify data integrity
    const isValid = await verifyChecksum(parsed.data, parsed.checksum);
    if (!isValid) {
      throw new Error('Données corrompues détectées - checksum invalide');
    }
    
    return JSON.parse(parsed.data);
  } catch (error) {
    console.error('❌ Erreur de décryptage:', error);
    throw error;
  }
}

/**
 * Saves encrypted data to localStorage
 */
export async function saveEncryptedToStorage(key: string, data: any, password?: string): Promise<void> {
  if (!isLocalStorageAvailable()) {
    console.error('❌ localStorage non disponible - impossible de sauvegarder');
    return;
  }

  try {
    const encrypted = await encryptData(data, password);
    localStorage.setItem(key, encrypted);
    
    // Verify save was successful
    const verification = localStorage.getItem(key);
    if (verification === encrypted) {
      console.log('✅ Données cryptées et VÉRIFIÉES dans localStorage:', key);
      console.log('📊 Taille des données:', Math.round(encrypted.length / 1024), 'KB');
    } else {
      console.error('❌ Échec de vérification de sauvegarde');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  }
}

/**
 * Loads and decrypts data from localStorage
 */
export async function loadEncryptedFromStorage(key: string, password?: string): Promise<any | null> {
  if (!isLocalStorageAvailable()) {
    console.error('❌ localStorage non disponible - impossible de charger');
    return null;
  }

  const encrypted = localStorage.getItem(key);
  if (!encrypted) {
    console.log('ℹ️ Aucune donnée trouvée dans localStorage pour la clé:', key);
    
    // Try to migrate from old key
    const oldKey = 'valcar-app-state-encrypted-v2';
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
      console.log('🔄 Tentative de migration depuis l\'ancienne clé...');
      // Clear old data and start fresh
      localStorage.removeItem(oldKey);
      console.log('✨ Ancien système de cryptage détecté - réinitialisation');
    }
    
    return null;
  }
  
  try {
    console.log('🔍 Données trouvées, décryptage en cours...');
    console.log('📊 Taille des données cryptées:', Math.round(encrypted.length / 1024), 'KB');
    const decrypted = await decryptData(encrypted, password);
    console.log('✅ Données décryptées avec succès depuis localStorage');
    return decrypted;
  } catch (error) {
    console.error('❌ Impossible de décrypter les données:', error);
    console.error('Clé utilisée:', key);
    console.log('🔄 Données corrompues détectées - réinitialisation');
    // Clear corrupted data
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Downloads encrypted data as a JSON file
 */
export async function exportEncryptedJSON(data: any, filename: string = 'valcar-backup.json', password?: string): Promise<void> {
  const encrypted = await encryptData(data, password);
  const blob = new Blob([encrypted], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  console.log('📥 Export JSON crypté téléchargé');
}

/**
 * Imports encrypted data from a JSON file
 */
export async function importEncryptedJSON(file: File, password?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const encrypted = e.target?.result as string;
        const decrypted = await decryptData(encrypted, password);
        console.log('📤 Import JSON crypté réussi');
        resolve(decrypted);
      } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}