import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Plus, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Vehicle } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface PhotosGalleryProps {
  vehicle: Vehicle;
}

export function PhotosGallery({ vehicle }: PhotosGalleryProps) {
  const { updateVehicle } = useApp();
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
        
        // Convertir en base64 (pour stockage local sans serveur)
        const reader = new FileReader();
        const photoUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newPhotos.push(photoUrl);
      }

      // Ajouter les nouvelles photos aux existantes
      const updatedPhotos = [...photos, ...newPhotos];

      // Mettre à jour le véhicule
      await updateVehicle(vehicle.id, { photos: updatedPhotos });
      
      console.log(`✅ ${newPhotos.length} photo(s) ajoutée(s) via ${source}`);
    } catch (error) {
      console.error('❌ Erreur upload photo:', error);
      alert('Erreur lors de l\'ajout de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm('Supprimer cette photo ?')) return;

    try {
      const updatedPhotos = photos.filter(p => p !== photoUrl);
      await updateVehicle(vehicle.id, { photos: updatedPhotos });
      console.log('✅ Photo supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression photo:', error);
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'ajout */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14"
        >
          <Camera className="w-5 h-5 mr-2" />
          Appareil photo
        </Button>
        <Button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800 h-14"
        >
          <ImageIcon className="w-5 h-5 mr-2" />
          Bibliothèque
        </Button>
      </div>

      {/* Inputs cachés */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handlePhotoUpload(e.target.files, 'camera')}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handlePhotoUpload(e.target.files, 'gallery')}
      />

      {/* État de chargement */}
      {isUploading && (
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400">Upload en cours...</p>
          </div>
        </Card>
      )}

      {/* Grille de photos */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-110"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </div>
              <button
                onClick={() => handleDeletePhoto(photo)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500/90 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-white mb-2">Aucune photo</h3>
          <p className="text-zinc-500 text-sm">Ajoutez des photos de votre véhicule</p>
        </div>
      )}

      {/* Modal plein écran */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo en grand"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
