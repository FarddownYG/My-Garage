import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
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

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setIsUploading(true);

    try {
      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, photo: base64String });
        setPhotoPreview(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Erreur lors de la lecture de l\'image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    updateVehicle(vehicle.id, {
      name: formData.name,
      brand: formData.brand,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      licensePlate: formData.licensePlate,
      mileage: parseInt(formData.mileage) || 0,
      photo: formData.photo,
      fuelType: formData.fuelType,
      driveType: formData.driveType,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-lg md:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800">
          <h2 className="text-lg sm:text-xl text-white">Modifier le véhicule</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
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
              placeholder="Ex: Ma BMW Série 3"
              className="bg-zinc-800 border-zinc-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="fuelType" className="text-zinc-400">Motorisation *</Label>
            <CustomSelect
              id="fuelType"
              value={formData.fuelType}
              onChange={(value) => setFormData({ ...formData, fuelType: value as 'essence' | 'diesel' })}
              options={[
                { value: 'essence', label: 'Essence', icon: '⛽' },
                { value: 'diesel', label: 'Diesel', icon: '🛢️' },
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
                placeholder="2020"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="licensePlate" className="text-zinc-400">Immatriculation</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                placeholder="AB-123-CD"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mileage" className="text-zinc-400">Kilométrage actuel</Label>
            <Input
              id="mileage"
              type="number"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              placeholder="50000"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Photo du véhicule */}
          <div>
            <Label htmlFor="photo" className="text-zinc-400">Photo du véhicule</Label>
            <div className="space-y-3">
              {/* Preview de l'image */}
              {photoPreview && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-zinc-800">
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
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bouton d'upload */}
              {!photoPreview && (
                <label 
                  htmlFor="photo-upload" 
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-zinc-400">Upload en cours...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-500" />
                        <p className="text-sm text-zinc-400">
                          <span className="text-blue-500 font-medium">Choisir une photo</span> depuis votre galerie
                        </p>
                        <p className="text-xs text-zinc-500">PNG, JPG jusqu'à 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}

              {/* Option URL (optionnelle) */}
              {!photoPreview && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900 px-2 text-zinc-500">ou entrer une URL</span>
                  </div>
                </div>
              )}

              {!photoPreview && (
                <Input
                  id="photo-url"
                  type="url"
                  value={formData.photo.startsWith('data:') ? '' : formData.photo}
                  onChange={(e) => {
                    setFormData({ ...formData, photo: e.target.value });
                    if (e.target.value) setPhotoPreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent border-zinc-700 text-zinc-400">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}