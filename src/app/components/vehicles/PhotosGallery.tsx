import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Plus, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Vehicle } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface PhotosGalleryProps {
  vehicle: Vehicle;
}

export function PhotosGallery({ vehicle }: PhotosGalleryProps) {
  const { updateVehicle } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const photos = vehicle.photos || [];

  const handlePhotoUpload = async (files: FileList | null, source: 'camera' | 'gallery') => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const photoUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newPhotos.push(photoUrl);
      }
      await updateVehicle(vehicle.id, { photos: [...photos, ...newPhotos] });
    } catch (error) {
      alert('Erreur lors de l\'ajout de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      await updateVehicle(vehicle.id, { photos: photos.filter(p => p !== photoUrl) });
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => cameraInputRef.current?.click()} disabled={isUploading}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 h-14">
          <Camera className="w-5 h-5 mr-2" />
          Appareil photo
        </Button>
        <Button onClick={() => galleryInputRef.current?.click()} disabled={isUploading} variant="outline"
          className={`h-14 ${isDark ? 'bg-transparent border-white/10 text-white hover:bg-white/5' : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
          <ImageIcon className="w-5 h-5 mr-2" />
          Bibliothèque
        </Button>
      </div>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files, 'camera')} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files, 'gallery')} />

      {isUploading && (
        <Card className={`p-4 ${isDark ? 'bg-[#12121a] border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Upload en cours...</p>
          </div>
        </Card>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className={`aspect-square rounded-lg overflow-hidden ${isDark ? 'bg-[#12121a]' : 'bg-gray-100'}`}>
                <ImageWithFallback src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-110" onClick={() => setSelectedPhoto(photo)} />
              </div>
              <button onClick={() => handleDeletePhoto(photo)} className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4 text-white" /></button>
              <button onClick={() => setSelectedPhoto(photo)} className="absolute bottom-2 right-2 w-8 h-8 bg-cyan-500/90 hover:bg-cyan-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4 text-white" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
            <ImageIcon className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aucune photo</h3>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Ajoutez des photos de votre véhicule</p>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button onClick={() => setSelectedPhoto(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"><X className="w-6 h-6 text-white" /></button>
          <img src={selectedPhoto} alt="Photo en grand" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}