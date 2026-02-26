import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CustomSelect } from '../ui/CustomSelect';
import type { Vehicle } from '../../types';

interface EditVehicleModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function EditVehicleModal({ vehicle, onClose }: EditVehicleModalProps) {
  const { updateVehicle } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: vehicle.name,
    brand: vehicle.brand || '',
    model: vehicle.model || '',
    year: vehicle.year?.toString() || '',
    licensePlate: vehicle.licensePlate || '',
    mileage: vehicle.mileage.toString(),
    photo: vehicle.photo || '',
    fuelType: vehicle.fuelType || 'essence' as 'essence' | 'diesel',
    driveType: vehicle.driveType || '4x2' as '4x2' | '4x4',
  });
  const [photoPreview, setPhotoPreview] = useState<string>(vehicle.photo || '');
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Veuillez sélectionner une image'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('L\'image est trop volumineuse (max 5MB)'); return; }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => { setFormData({ ...formData, photo: reader.result as string }); setPhotoPreview(reader.result as string); setIsUploading(false); };
      reader.onerror = () => { alert('Erreur lors de la lecture de l\'image'); setIsUploading(false); };
      reader.readAsDataURL(file);
    } catch (error) { setIsUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    updateVehicle(vehicle.id, {
      name: formData.name, brand: formData.brand, model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      licensePlate: formData.licensePlate, mileage: parseInt(formData.mileage) || 0,
      photo: formData.photo, fuelType: formData.fuelType, driveType: formData.driveType,
    });
    onClose();
  };

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const inputClass = isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const labelClass = isDark ? 'text-slate-400' : 'text-gray-500';
  const titleClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${modalBg} w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${borderColor}`}>
          <h2 className={`text-lg sm:text-xl ${titleClass}`}>{t('vehicles.edit')}</h2>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="name" className={labelClass}>{t('vehicles.name')} *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Ma BMW Série 3" className={inputClass} required />
          </div>
          <div>
            <Label htmlFor="fuelType" className={labelClass}>{t('vehicles.fuelType')} *</Label>
            <CustomSelect id="fuelType" value={formData.fuelType} onChange={(value) => setFormData({ ...formData, fuelType: value as any })} options={[{ value: 'essence', label: t('common.gasoline'), icon: '⛽' }, { value: 'diesel', label: t('common.diesel'), icon: '💧' }]} required />
          </div>
          <div>
            <Label htmlFor="driveType" className={labelClass}>{t('vehicles.driveType')} *</Label>
            <CustomSelect id="driveType" value={formData.driveType} onChange={(value) => setFormData({ ...formData, driveType: value as any })} options={[{ value: '4x2', label: '4x2 (2 roues motrices)', icon: '🚗' }, { value: '4x4', label: '4x4 (4 roues motrices)', icon: '🚙' }]} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand" className={labelClass}>{t('vehicles.brand')}</Label>
              <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="BMW" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="model" className={labelClass}>{t('vehicles.model')}</Label>
              <Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="Série 3" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year" className={labelClass}>{t('vehicles.year')}</Label>
              <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="2020" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="licensePlate" className={labelClass}>{t('vehicles.licensePlate')}</Label>
              <Input id="licensePlate" value={formData.licensePlate} onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })} placeholder="AB-123-CD" className={inputClass} />
            </div>
          </div>
          <div>
            <Label htmlFor="mileage" className={labelClass}>{t('vehicles.mileage')}</Label>
            <Input id="mileage" type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: e.target.value })} placeholder="50000" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="photo" className={labelClass}>{t('vehicles.photo')}</Label>
            <div className="space-y-3">
              {photoPreview && (
                <div className={`relative w-full h-40 rounded-lg overflow-hidden ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setPhotoPreview(''); setFormData({ ...formData, photo: '' }); }} className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                </div>
              )}
              {!photoPreview && (
                <label htmlFor="photo-upload" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark ? 'border-white/10 bg-[#1a1a2e]/50 hover:bg-[#1a1a2e]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    {isUploading ? (<><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div><p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Upload en cours...</p></>) : (<><Upload className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} /><p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}><span className="text-cyan-500 font-medium">Choisir une photo</span></p><p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>PNG, JPG jusqu'à 5MB</p></>)}
                  </div>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
                </label>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}>{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white">{t('common.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}