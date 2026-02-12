import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/CustomSelect';
import { FeedbackToast, LoadingSpinner } from '../shared/FeedbackComponents';
import { 
  validateVehicleName, 
  validateYear, 
  validateMileage, 
  validateLicensePlate,
  validateFileSize,
  validateImageType,
  sanitizeFormData
} from '../../utils/formValidation';
import { modalTransitions } from '../../utils/animations';

interface AddVehicleModalProps {
  onClose: () => void;
}

export function AddVehicleModal({ onClose }: AddVehicleModalProps) {
  const { addVehicle, currentProfile } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    mileage: '',
    photo: '',
    fuelType: 'essence' as 'essence' | 'diesel',
    driveType: '4x2' as '4x2' | '4x4',
  });
  
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Validate field on blur
  const validateField = (fieldName: string, value: string) => {
    let validation: { valid: boolean; error?: string } = { valid: true };

    switch (fieldName) {
      case 'name':
        validation = validateVehicleName(value);
        break;
      case 'year':
        if (value) validation = validateYear(value);
        break;
      case 'mileage':
        if (value) validation = validateMileage(value);
        break;
      case 'licensePlate':
        if (value) validation = validateLicensePlate(value);
        break;
    }

    if (!validation.valid && validation.error) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.error! }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const typeValidation = validateImageType(file);
    if (!typeValidation.valid) {
      setToastMessage(typeValidation.error || 'Type de fichier invalide');
      setShowToast(true);
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, 5);
    if (!sizeValidation.valid) {
      setToastMessage(sizeValidation.error || 'Fichier trop volumineux');
      setShowToast(true);
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, photo: base64String });
        setPhotoPreview(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setToastMessage('Erreur lors de la lecture de l\'image');
        setShowToast(true);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload:', error);
      setToastMessage('Erreur lors de l\'upload de l\'image');
      setShowToast(true);
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameValidation = validateVehicleName(formData.name);
    const yearValidation = formData.year ? validateYear(formData.year) : { valid: true };
    const mileageValidation = formData.mileage ? validateMileage(formData.mileage) : { valid: true };
    const plateValidation = formData.licensePlate ? validateLicensePlate(formData.licensePlate) : { valid: true };

    const newErrors: Record<string, string> = {};
    
    if (!nameValidation.valid && nameValidation.error) {
      newErrors.name = nameValidation.error;
    }
    if (!yearValidation.valid && yearValidation.error) {
      newErrors.year = yearValidation.error;
    }
    if (!mileageValidation.valid && mileageValidation.error) {
      newErrors.mileage = mileageValidation.error;
    }
    if (!plateValidation.valid && plateValidation.error) {
      newErrors.licensePlate = plateValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToastMessage('Veuillez corriger les erreurs dans le formulaire');
      setShowToast(true);
      return;
    }

    if (!currentProfile) {
      setToastMessage('Session expirée, veuillez vous reconnecter');
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);

      addVehicle({
        id: Date.now().toString(),
        name: sanitizedData.name,
        brand: sanitizedData.brand,
        model: sanitizedData.model,
        year: sanitizedData.year ? parseInt(sanitizedData.year) : undefined,
        licensePlate: sanitizedData.licensePlate,
        mileage: parseInt(sanitizedData.mileage) || 0,
        photo: sanitizedData.photo || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400',
        ownerId: currentProfile.id,
        fuelType: sanitizedData.fuelType,
        driveType: sanitizedData.driveType,
      });

      // Show success feedback
      setShowSuccess(true);
      
      // Close modal after animation
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Erreur ajout véhicule:', error);
      setToastMessage('Erreur lors de l\'ajout du véhicule');
      setShowToast(true);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FeedbackToast
        type="error"
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />

      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6"
        initial={modalTransitions.overlay.initial}
        animate={modalTransitions.overlay.animate}
        exit={modalTransitions.overlay.exit}
        onClick={onClose}
      >
        <motion.div 
          className="bg-zinc-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={modalTransitions.modalFromBottom.initial}
          animate={modalTransitions.modalFromBottom.animate}
          exit={modalTransitions.modalFromBottom.exit}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800">
            <h2 className="text-lg sm:text-xl text-white font-semibold">Ajouter un véhicule</h2>
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name" className="text-zinc-400">Nom du véhicule *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => validateField('name', e.target.value)}
                placeholder="Ex: Ma BMW Série 3"
                className={`bg-zinc-800 border-zinc-700 text-white ${errors.name ? 'border-red-500' : ''}`}
                required
                disabled={isSubmitting}
              />
              {errors.name && (
                <motion.p 
                  className="text-red-400 text-xs mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.name}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="fuelType" className="text-zinc-400">Motorisation *</Label>
              <CustomSelect
                id="fuelType"
                value={formData.fuelType}
                onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' })}
                options={[
                  { value: 'essence', label: 'Essence', icon: '⛽' },
                  { value: 'diesel', label: 'Diesel', icon: '💧' },
                ]}
                required
              />
            </div>

            <div>
              <Label htmlFor="driveType" className="text-zinc-400">Transmission *</Label>
              <CustomSelect
                id="driveType"
                value={formData.driveType}
                onChange={(value) => setFormData({ ...formData, driveType: value as '4x2' | '4x4' })}
                options={[
                  { value: '4x2', label: '4x2 (2 roues motrices)', icon: '🚗' },
                  { value: '4x4', label: '4x4 (4 roues motrices)', icon: '🚙' },
                ]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand" className="text-zinc-400">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="BMW"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="model" className="text-zinc-400">Modèle</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Série 3"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year" className="text-zinc-400">Année</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  onBlur={(e) => validateField('year', e.target.value)}
                  placeholder="2020"
                  className={`bg-zinc-800 border-zinc-700 text-white ${errors.year ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.year && (
                  <motion.p 
                    className="text-red-400 text-xs mt-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.year}
                  </motion.p>
                )}
              </div>
              <div>
                <Label htmlFor="licensePlate" className="text-zinc-400">Immatriculation</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  onBlur={(e) => validateField('licensePlate', e.target.value)}
                  placeholder="AB-123-CD"
                  className={`bg-zinc-800 border-zinc-700 text-white ${errors.licensePlate ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.licensePlate && (
                  <motion.p 
                    className="text-red-400 text-xs mt-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {errors.licensePlate}
                  </motion.p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="mileage" className="text-zinc-400">Kilométrage actuel</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                onBlur={(e) => validateField('mileage', e.target.value)}
                placeholder="50000"
                className={`bg-zinc-800 border-zinc-700 text-white ${errors.mileage ? 'border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.mileage && (
                <motion.p 
                  className="text-red-400 text-xs mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.mileage}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="photo" className="text-zinc-400">Photo du véhicule</Label>
              <div className="space-y-3">
                {photoPreview && (
                  <motion.div 
                    className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-800"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img 
                      src={photoPreview} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview('');
                        setFormData({ ...formData, photo: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {!photoPreview && (
                  <label 
                    htmlFor="photo-upload" 
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <p className="text-sm text-zinc-400">Upload en cours...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-zinc-500" />
                          <p className="text-sm text-zinc-400">
                            <span className="text-blue-500 font-medium">Choisir une photo</span> depuis votre galerie
                          </p>
                          <p className="text-xs text-zinc-500">PNG, JPG, WebP jusqu'à 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={isUploading || isSubmitting}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={onClose} 
                variant="outline" 
                className="flex-1 bg-transparent border-zinc-700 text-zinc-400"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Ajout...</span>
                  </div>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* Success overlay */}
      {showSuccess && (
        <motion.div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-8 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
          >
            <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
