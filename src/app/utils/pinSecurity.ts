// 🔐 PIN Security utilities with bcrypt hashing
// Provides military-grade PIN protection without user lag

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // Balance between security and speed

/**
 * Hash a PIN using bcrypt (async, takes ~100ms)
 * Uses salt rounds optimized for web performance
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(pin, SALT_ROUNDS);
    console.log('🔐 PIN hashé avec succès (bcrypt)');
    return hash;
  } catch (error) {
    console.error('❌ Erreur hashage PIN:', error);
    throw new Error('Échec du hashage du PIN');
  }
}

/**
 * Verify a PIN against its hash (async, takes ~100ms)
 * Constant-time comparison to prevent timing attacks
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(pin, hash);
    console.log(isValid ? '✅ PIN vérifié' : '❌ PIN invalide');
    return isValid;
  } catch (error) {
    console.error('❌ Erreur vérification PIN:', error);
    return false;
  }
}

/**
 * Migrate plain-text PINs to hashed format
 * Returns hash if input is plain-text, or returns input if already hashed
 */
export async function migratePinIfNeeded(pin: string): Promise<string> {
  // Bcrypt hashes always start with $2a$, $2b$, or $2y$
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(pin);
  
  if (isBcryptHash) {
    console.log('ℹ️ PIN déjà hashé, pas de migration nécessaire');
    return pin;
  }
  
  console.log('🔄 Migration PIN en clair → hash bcrypt...');
  return await hashPin(pin);
}

/**
 * Check if a string is already a bcrypt hash
 */
export function isPinHashed(pin: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(pin);
}

/**
 * Generate a secure random PIN (for testing/demo purposes)
 */
export function generateSecurePin(length: number = 4): string {
  const digits = '0123456789';
  let pin = '';
  
  // Use crypto.getRandomValues for cryptographically secure randomness
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    pin += digits[randomValues[i] % digits.length];
  }
  
  return pin;
}

/**
 * Validate PIN format (4-6 digits)
 */
export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'Le PIN est requis' };
  }
  
  if (pin.length < 4) {
    return { valid: false, error: 'Le PIN doit contenir au moins 4 chiffres' };
  }
  
  if (pin.length > 6) {
    return { valid: false, error: 'Le PIN ne peut pas dépasser 6 chiffres' };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'Le PIN ne peut contenir que des chiffres' };
  }
  
  // Check for weak patterns
  const weakPatterns = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
  if (weakPatterns.includes(pin)) {
    return { valid: false, error: 'Ce PIN est trop simple, choisissez-en un plus sécurisé' };
  }
  
  return { valid: true };
}

/**
 * Rate limiter to prevent brute-force attacks
 * Stores failed attempts in memory (resets on page reload)
 */
class PinRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly ATTEMPT_WINDOW = 60 * 1000; // 1 minute
  
  /**
   * Record a failed attempt
   * @param identifier - Usually profile ID or 'admin'
   */
  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Add new attempt
    attempts.push(now);
    
    // Clean old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.ATTEMPT_WINDOW);
    this.attempts.set(identifier, recentAttempts);
    
    console.log(`⚠️ Tentative échouée pour ${identifier}: ${recentAttempts.length}/${this.MAX_ATTEMPTS}`);
  }
  
  /**
   * Check if too many failed attempts
   * @returns true if locked out
   */
  isLockedOut(identifier: string): boolean {
    const attempts = this.attempts.get(identifier) || [];
    const now = Date.now();
    
    // Check if we have recent failed attempts
    const recentAttempts = attempts.filter(time => now - time < this.ATTEMPT_WINDOW);
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeSinceFirst = now - oldestAttempt;
      
      if (timeSinceFirst < this.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION - timeSinceFirst) / 1000);
        console.log(`🔒 Compte verrouillé pour ${identifier}. Réessayez dans ${remainingTime}s`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Clear failed attempts after successful login
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
    console.log(`✅ Compteur de tentatives réinitialisé pour ${identifier}`);
  }
  
  /**
   * Get remaining time in lockout (in seconds)
   */
  getRemainingLockoutTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < this.ATTEMPT_WINDOW);
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeSinceFirst = now - oldestAttempt;
      return Math.ceil((this.LOCKOUT_DURATION - timeSinceFirst) / 1000);
    }
    
    return 0;
  }
}

// Global rate limiter instance
export const pinRateLimiter = new PinRateLimiter();
