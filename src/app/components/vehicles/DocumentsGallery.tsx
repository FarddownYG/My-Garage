import { useState, useRef } from 'react';
import { Camera, FileText, Upload, X, ExternalLink, File, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Vehicle, VehicleDocument } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { formatDate } from '../../utils/formatDate';

interface DocumentsGalleryProps {
  vehicle: Vehicle;
}

export function DocumentsGallery({ vehicle }: DocumentsGalleryProps) {
  const { updateVehicle } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = vehicle.documents || [];

  const handleDocumentUpload = async (
    files: FileList | null, 
    source: 'camera' | 'file'
  ) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newDocuments: VehicleDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Déterminer le type de fichier
        let docType: 'photo' | 'pdf' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
          docType = 'photo';
        } else if (file.type === 'application/pdf') {
          docType = 'pdf';
        }

        // Convertir en base64
        const reader = new FileReader();
        const fileUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const doc: VehicleDocument = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          url: fileUrl,
          type: docType,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };

        newDocuments.push(doc);
      }

      // Ajouter les nouveaux documents aux existants
      const updatedDocuments = [...documents, ...newDocuments];

      // Mettre à jour le véhicule
      await updateVehicle(vehicle.id, { documents: updatedDocuments });
      
      console.log(`✅ ${newDocuments.length} document(s) ajouté(s) via ${source}`);
    } catch (error) {
      console.error('❌ Erreur upload document:', error);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;

    try {
      const updatedDocuments = documents.filter(d => d.id !== docId);
      await updateVehicle(vehicle.id, { documents: updatedDocuments });
      console.log('✅ Document supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression document:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleOpenDocument = (doc: VehicleDocument) => {
    if (doc.type === 'photo') {
      // Ouvrir en modal pour les photos
      setSelectedDocument(doc);
    } else {
      // Ouvrir dans un nouvel onglet pour PDF et autres documents
      const win = window.open();
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${doc.name}</title>
              <style>
                body { margin: 0; padding: 0; background: #000; }
                iframe, embed { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              ${doc.type === 'pdf' 
                ? `<iframe src="${doc.url}" type="application/pdf"></iframe>`
                : `<embed src="${doc.url}" />`
              }
            </body>
          </html>
        `);
      }
    }
  };

  const handleDownloadDocument = async (doc: VehicleDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      let blobUrl: string;
      
      // Si c'est une URL base64, la convertir en Blob
      if (doc.url.startsWith('data:')) {
        // Extraire le type MIME et les données base64
        const matches = doc.url.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Format base64 invalide');
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Convertir base64 en Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Créer un Blob
        const blob = new Blob([bytes], { type: mimeType });
        blobUrl = URL.createObjectURL(blob);
      } else {
        // Si c'est une URL normale (Supabase Storage), utiliser directement
        blobUrl = doc.url;
      }
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      link.style.display = 'none';
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        document.body.removeChild(link);
        if (doc.url.startsWith('data:')) {
          URL.revokeObjectURL(blobUrl);
        }
      }, 100);
      
      console.log(`✅ Téléchargement de ${doc.name}`);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement. Essayez d\'ouvrir le document et de le sauvegarder manuellement.');
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: VehicleDocument['type']) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="w-12 h-12 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-12 h-12 text-red-500" />;
      default:
        return <File className="w-12 h-12 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'ajout */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 h-14"
        >
          <Camera className="w-5 h-5 mr-2" />
          Appareil photo
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          className={`h-14 ${isDark ? 'bg-transparent border-white/10 text-white hover:bg-white/5' : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          <Upload className="w-5 h-5 mr-2" />
          Fichiers
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
        onChange={(e) => handleDocumentUpload(e.target.files, 'camera')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
        className="hidden"
        onChange={(e) => handleDocumentUpload(e.target.files, 'file')}
      />

      {/* État de chargement */}
      {isUploading && (
        <Card className={`p-4 ${isDark ? 'bg-[#12121a] border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Upload en cours...</p>
          </div>
        </Card>
      )}

      {/* Liste des documents */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className={`p-4 transition-colors cursor-pointer group ${isDark ? 'bg-[#12121a] border-white/5 hover:border-cyan-500/50' : 'bg-white border-gray-200 hover:border-blue-300'}`}
              onClick={() => handleOpenDocument(doc)}
            >
              <div className="flex items-center gap-4">
                {/* Icône ou miniature */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
                  {doc.type === 'photo' ? (
                    <ImageWithFallback
                      src={doc.url}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getDocumentIcon(doc.type)
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm sm:text-base truncate mb-1 transition-colors ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-blue-500'}`}>
                    {doc.name}
                  </h4>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    <span className="capitalize">{doc.type}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.size)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDocument(doc);
                    }}
                    className="w-10 h-10 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-500 transition-colors"
                    title="Ouvrir"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDownloadDocument(doc, e)}
                    className="w-10 h-10 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                    className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
            <FileText className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Aucun document</h3>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Ajoutez des factures, papiers ou documents</p>
        </div>
      )}

      {/* Modal photo plein écran */}
      {selectedDocument && selectedDocument.type === 'photo' && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <button
            onClick={() => setSelectedDocument(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <img
              src={selectedDocument.url}
              alt={selectedDocument.name}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white mt-4">{selectedDocument.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}