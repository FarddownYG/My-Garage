import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Wrench, Image as ImageIcon, Gauge, Edit, Trash2, Edit2, FileText, Download } from 'lucide-react';
import type { Vehicle } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { MaintenanceLog } from '../maintenance/MaintenanceLog';
import { MaintenanceSettings } from '../settings/MaintenanceSettings';
import { EditVehicleModal } from './EditVehicleModal';
import { EditMileageModal } from './EditMileageModal';
import { PhotosGallery } from './PhotosGallery';
import { DocumentsGallery } from './DocumentsGallery';
import { exportMaintenancePdf } from '../../utils/exportPdf';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  prefilledMaintenanceType?: string | null;
}

export function VehicleDetail({ vehicle, onBack, prefilledMaintenanceType }: VehicleDetailProps) {
  const { maintenanceEntries, deleteVehicle } = useApp();
  const { t, lang } = useI18n();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'info' | 'maintenance' | 'gallery' | 'documents'>(() => {
    return prefilledMaintenanceType ? 'maintenance' : 'info';
  });
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);

  const vehicleMaintenanceEntries = maintenanceEntries
    .filter(e => e.vehicleId === vehicle.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${vehicle.name} ?`)) {
      deleteVehicle(vehicle.id);
      onBack();
    }
  };

  const handleExportPdf = () => {
    exportMaintenancePdf(vehicle, vehicleMaintenanceEntries, lang);
  };

  if (showMaintenanceSettings) {
    return <MaintenanceSettings onBack={() => setShowMaintenanceSettings(false)} />;
  }

  const tabBtnClass = (isActive: boolean) =>
    isActive
      ? isDark
        ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent'
        : 'bg-blue-600 text-white border-transparent'
      : isDark
        ? 'bg-transparent border-white/10 text-slate-400 hover:border-white/20'
        : 'bg-transparent border-gray-300 text-gray-500 hover:border-gray-400';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="relative">
        <div className={`h-56 sm:h-64 flex items-center justify-center ${isDark ? 'bg-[#12121a]' : 'bg-gray-200'}`}>
          {vehicle.photo ? (
            <img src={vehicle.photo} alt={vehicle.name} className="w-full h-full object-cover" />
          ) : (
            <Gauge className={`w-24 h-24 ${isDark ? 'text-slate-700' : 'text-gray-400'}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 to-transparent" />
        </div>
        <motion.button
          onClick={onBack}
          className={`absolute top-6 left-6 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${isDark ? 'bg-black/50 text-white' : 'bg-white/80 text-gray-800'}`}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Vehicle Info */}
      <div className="px-4 sm:px-6 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{vehicle.name}</h1>
            {vehicle.licensePlate && (
              <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>{vehicle.licensePlate}</p>
            )}
          </div>
          <div className="flex gap-2">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button onClick={() => setShowMileageModal(true)} variant="outline" size="sm"
                className={isDark ? 'bg-transparent border-white/10 text-emerald-400 hover:bg-emerald-500/10' : 'bg-transparent border-gray-300 text-green-600 hover:bg-green-50'}>
                <Gauge className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm"
                className={isDark ? 'bg-transparent border-white/10 text-cyan-400 hover:bg-cyan-500/10' : 'bg-transparent border-gray-300 text-blue-600 hover:bg-blue-50'}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="outline" size="sm" onClick={handleDelete}
                className={isDark ? 'bg-transparent border-white/10 text-red-400 hover:bg-red-500/10' : 'bg-transparent border-gray-300 text-red-600 hover:bg-red-50'}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        <Card className={`p-4 mb-6 rounded-2xl ${isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-2 gap-4">
            {vehicle.brand && (
              <div>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('vehicles.brand')}</p>
                <p className={isDark ? 'text-white' : 'text-gray-900'}>{vehicle.brand}</p>
              </div>
            )}
            {vehicle.model && (
              <div>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('vehicles.model')}</p>
                <p className={isDark ? 'text-white' : 'text-gray-900'}>{vehicle.model}</p>
              </div>
            )}
            {vehicle.year && (
              <div>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('vehicles.year')}</p>
                <p className={isDark ? 'text-white' : 'text-gray-900'}>{vehicle.year}</p>
              </div>
            )}
            <div>
              <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('vehicles.mileage')}</p>
              <p className={isDark ? 'text-white' : 'text-gray-900'}>{vehicle.mileage.toLocaleString()} km</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <Button onClick={() => setActiveTab('info')} variant="outline" className={tabBtnClass(activeTab === 'info')}>
            <Gauge className="w-4 h-4 mr-2" />{t('vehicles.infos')}
          </Button>
          <Button onClick={() => setActiveTab('maintenance')} variant="outline" className={tabBtnClass(activeTab === 'maintenance')}>
            <Wrench className="w-4 h-4 mr-2" />{t('vehicles.maintenance')} ({vehicleMaintenanceEntries.length})
          </Button>
          <Button onClick={() => setActiveTab('gallery')} variant="outline" className={tabBtnClass(activeTab === 'gallery')}>
            <ImageIcon className="w-4 h-4 mr-2" />{t('vehicles.photos')}
          </Button>
          <Button onClick={() => setActiveTab('documents')} variant="outline" className={tabBtnClass(activeTab === 'documents')}>
            <FileText className="w-4 h-4 mr-2" />{t('vehicles.documents')}
          </Button>
        </div>

        {/* Export PDF button on maintenance tab */}
        {activeTab === 'maintenance' && vehicleMaintenanceEntries.length > 0 && (
          <motion.div className="mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Button onClick={handleExportPdf}
              className={`w-full h-12 rounded-xl ${isDark ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20' : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
              <Download className="w-5 h-5 mr-2" />
              {t('maintenance.exportPdf')}
            </Button>
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === 'maintenance' && (
          <MaintenanceLog vehicleId={vehicle.id} onOpenSettings={() => setShowMaintenanceSettings(true)} />
        )}
        {activeTab === 'gallery' && <PhotosGallery vehicle={vehicle} />}
        {activeTab === 'documents' && <DocumentsGallery vehicle={vehicle} />}
      </div>

      {/* Modals */}
      {showEditModal && <EditVehicleModal vehicle={vehicle} onClose={() => setShowEditModal(false)} />}
      {showMileageModal && <EditMileageModal vehicle={vehicle} onClose={() => setShowMileageModal(false)} />}
    </div>
  );
}
