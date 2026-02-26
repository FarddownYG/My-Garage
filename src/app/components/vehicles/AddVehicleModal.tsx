import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
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
  const { isDark } = useTheme();
  const { t } = useI18n();
  
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

  const modalBg = isDark ? 'bg-[#12121a]/95 backdrop-blur-2xl' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelColor = isDark ? 'text-slate-400' : 'text-gray-500';
  const closeBtn = isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600';

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
          className={`${modalBg} w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border ${borderColor}`}
          initial={modalTransitions.modalFromBottom.initial}
          animate={modalTransitions.modalFromBottom.animate}
          exit={modalTransitions.modalFromBottom.exit}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${borderColor}`}>
            <h2 className={`text-lg sm:text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('vehicles.add')}</h2>
            <button 
              onClick={onClose} 
              className={`${closeBtn} transition-all duration-300 hover:rotate-90`}
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name" className={labelColor}>{t('vehicles.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={(e) => validateField('name', e.target.value)}
                placeholder="Ex: Ma BMW Série 3"
                className={`${inputBg} ${errors.name ? 'border-red-500' : ''}`}
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
              <Label htmlFor="fuelType" className={labelColor}>{t('vehicles.fuelType')} *</Label>
              <CustomSelect
                id="fuelType"
                value={formData.fuelType}
                onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' })}
                options={[
                  { value: 'essence', label: t('common.gasoline'), icon: '⛽' },
                  { value: 'diesel', label: t('common.diesel'), icon: '💧' },
                ]}
                required
              />
            </div>

            <div>
              <Label htmlFor="driveType" className={labelColor}>{t('vehicles.driveType')} *</Label>
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
                <Label htmlFor="brand" className={labelColor}>{t('vehicles.brand')}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="BMW"
                  className={inputBg}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="model" className={labelColor}>{t('vehicles.model')}</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Série 3"
                  className={inputBg}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year" className={labelColor}>{t('vehicles.year')}</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  onBlur={(e) => validateField('year', e.target.value)}
                  placeholder="2020"
                  className={`${inputBg} ${errors.year ? 'border-red-500' : ''}`}
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
                <Label htmlFor="licensePlate" className={labelColor}>{t('vehicles.licensePlate')}</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  onBlur={(e) => validateField('licensePlate', e.target.value)}
                  placeholder="AB-123-CD"
                  className={`${inputBg} ${errors.licensePlate ? 'border-red-500' : ''}`}
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
              <Label htmlFor="mileage" className={labelColor}>{t('vehicles.mileage')}</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                onBlur={(e) => validateField('mileage', e.target.value)}
                placeholder="50000"
                className={`${inputBg} ${errors.mileage ? 'border-red-500' : ''}`}
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
              <Label htmlFor="photo" className={labelColor}>{t('vehicles.photo')}</Label>
              <div className="space-y-3">
                {photoPreview && (
                  <motion.div 
                    className={`relative w-full h-40 rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}
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
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark ? 'border-white/10 bg-[#1a1a2e]/50 hover:bg-[#1a1a2e]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Upload en cours...</p>
                        </>
                      ) : (
                        <>
                          <Upload className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            <span className="text-cyan-500 font-medium">Choisir une photo</span>
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>PNG, JPG, WebP jusqu'à 5MB</p>
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
                className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Ajout...</span>
                  </div>
                ) : (
                  t('common.add')
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