// 🛡️ Enhanced form validation utilities
// Comprehensive validation with better error messages and XSS protection

import { sanitizeInput } from './security';
import { z } from 'zod';

/**
 * Email validation with comprehensive rules
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { valid: false, error: 'L\'adresse email est requise' };
  }
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }
  
  // Check for dangerous characters
  if (/<|>|script|javascript|onerror|onclick/i.test(email)) {
    return { valid: false, error: 'Caractères non autorisés dans l\'email' };
  }
  
  // Length check
  if (email.length > 254) {
    return { valid: false, error: 'L\'email est trop long (max 254 caractères)' };
  }
  
  return { valid: true };
};

/**
 * Password validation with strength check
 */
export const validatePassword = (password: string): { 
  valid: boolean; 
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
} => {
  if (!password || !password.trim()) {
    return { valid: false, error: 'Le mot de passe est requis', strength: 'weak' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 6 caractères', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Le mot de passe est trop long (max 128 caractères)', strength: 'weak' };
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { valid: true, strength };
};

/**
 * Name validation (first name, last name)
 */
export const validateName = (name: string, fieldName: string = 'nom'): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: `Le ${fieldName} est requis` };
  }
  
  const sanitized = sanitizeInput(name.trim());
  
  if (sanitized.length < 1) {
    return { valid: false, error: `Le ${fieldName} est trop court` };
  }
  
  if (sanitized.length > 50) {
    return { valid: false, error: `Le ${fieldName} est trop long (max 50 caractères)` };
  }
  
  // Check for dangerous patterns
  if (/<script|javascript|onerror|onclick/i.test(name)) {
    return { valid: false, error: 'Caractères non autorisés' };
  }
  
  return { valid: true };
};

/**
 * Vehicle name validation
 */
export const validateVehicleName = (name: string): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Le nom du véhicule est requis' };
  }
  
  const sanitized = sanitizeInput(name.trim());
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Le nom est trop long (max 100 caractères)' };
  }
  
  return { valid: true };
};

/**
 * Year validation
 */
export const validateYear = (year: string | number): { valid: boolean; error?: string } => {
  const yearNum = typeof year === 'string' ? parseInt(year) : year;
  
  if (isNaN(yearNum)) {
    return { valid: false, error: 'Année invalide' };
  }
  
  const currentYear = new Date().getFullYear();
  
  if (yearNum < 1900) {
    return { valid: false, error: 'Année trop ancienne (minimum 1900)' };
  }
  
  if (yearNum > currentYear + 1) {
    return { valid: false, error: `Année future invalide (maximum ${currentYear + 1})` };
  }
  
  return { valid: true };
};

/**
 * Mileage validation
 */
export const validateMileage = (mileage: string | number): { valid: boolean; error?: string } => {
  const mileageNum = typeof mileage === 'string' ? parseFloat(mileage) : mileage;
  
  if (isNaN(mileageNum)) {
    return { valid: false, error: 'Kilométrage invalide' };
  }
  
  if (mileageNum < 0) {
    return { valid: false, error: 'Le kilométrage ne peut pas être négatif' };
  }
  
  if (mileageNum > 9999999) {
    return { valid: false, error: 'Kilométrage trop élevé (max 9 999 999 km)' };
  }
  
  return { valid: true };
};

/**
 * Cost validation
 */
export const validateCost = (cost: string | number): { valid: boolean; error?: string } => {
  const costNum = typeof cost === 'string' ? parseFloat(cost) : cost;
  
  if (isNaN(costNum)) {
    return { valid: false, error: 'Montant invalide' };
  }
  
  if (costNum < 0) {
    return { valid: false, error: 'Le montant ne peut pas être négatif' };
  }
  
  if (costNum > 999999) {
    return { valid: false, error: 'Montant trop élevé (max 999 999 €)' };
  }
  
  return { valid: true };
};

/**
 * Text area validation (notes, description)
 */
export const validateTextArea = (
  text: string, 
  maxLength: number = 1000,
  fieldName: string = 'texte'
): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(text || '');
  
  if (sanitized.length > maxLength) {
    return { valid: false, error: `${fieldName} trop long (max ${maxLength} caractères)` };
  }
  
  return { valid: true };
};

/**
 * URL validation
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    return { valid: true }; // URL is optional
  }
  
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Seuls les liens http:// et https:// sont autorisés' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Format d\'URL invalide' };
  }
};

/**
 * File size validation
 */
export const validateFileSize = (file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Fichier trop volumineux (max ${maxSizeMB}MB)` };
  }
  
  return { valid: true };
};

/**
 * Image file type validation
 */
export const validateImageType = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non supporté (JPEG, PNG, WebP, GIF uniquement)' };
  }
  
  return { valid: true };
};

/**
 * VIN validation (Vehicle Identification Number)
 */
export const validateVIN = (vin: string): { valid: boolean; error?: string } => {
  if (!vin || !vin.trim()) {
    return { valid: true }; // VIN is optional
  }
  
  const sanitized = sanitizeInput(vin.trim().toUpperCase());
  
  // VIN must be exactly 17 characters
  if (sanitized.length !== 17) {
    return { valid: false, error: 'Le VIN doit contenir exactement 17 caractères' };
  }
  
  // VIN should not contain I, O, Q (to avoid confusion with 1, 0)
  if (/[IOQ]/.test(sanitized)) {
    return { valid: false, error: 'VIN invalide (ne peut pas contenir I, O ou Q)' };
  }
  
  // VIN should only contain alphanumeric characters
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(sanitized)) {
    return { valid: false, error: 'VIN invalide (caractères non autorisés)' };
  }
  
  return { valid: true };
};

/**
 * License plate validation (French format)
 */
export const validateLicensePlate = (plate: string): { valid: boolean; error?: string } => {
  if (!plate || !plate.trim()) {
    return { valid: true }; // License plate is optional
  }
  
  const sanitized = sanitizeInput(plate.trim().toUpperCase());
  
  if (sanitized.length > 20) {
    return { valid: false, error: 'Plaque d\'immatriculation trop longue (max 20 caractères)' };
  }
  
  return { valid: true };
};

/**
 * Date validation
 */
export const validateDate = (date: string): { valid: boolean; error?: string } => {
  if (!date || !date.trim()) {
    return { valid: true }; // Date is optional
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Date invalide' };
  }
  
  // Check if date is too far in the past (before 1900)
  if (dateObj.getFullYear() < 1900) {
    return { valid: false, error: 'Date trop ancienne (minimum 1900)' };
  }
  
  // Check if date is too far in the future (more than 10 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);
  
  if (dateObj > maxDate) {
    return { valid: false, error: 'Date trop éloignée dans le futur' };
  }
  
  return { valid: true };
};

/**
 * Sanitize and validate form data
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Batch validation for multiple fields
 */
export const validateMultipleFields = (
  validations: Array<{ valid: boolean; error?: string }>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const validation of validations) {
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
