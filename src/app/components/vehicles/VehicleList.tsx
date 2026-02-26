import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Car as CarIcon, Trash2, Edit2, Gauge } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { VehicleDetail } from './VehicleDetail';
import { AddVehicleModal } from './AddVehicleModal';
import { EditVehicleModal } from './EditVehicleModal';
import { EditMileageModal } from './EditMileageModal';
import { listTransitions, cardHover } from '../../utils/animations';

export function VehicleList() {
  const { currentProfile, deleteVehicle, getUserVehicles } = useApp();
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingMileageVehicle, setEditingMileageVehicle] = useState<any>(null);

  const userVehicles = getUserVehicles();
  const selectedVehicle = userVehicles.find(v => v.id === selectedVehicleId);

  if (selectedVehicle) {
    return <VehicleDetail vehicle={selectedVehicle} onBack={() => setSelectedVehicleId(null)} />;
  }

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      <div className={`px-4 sm:px-6 pt-12 pb-8 ${isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <h1 className={`text-2xl sm:text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('vehicles.title')}</h1>
        <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>{userVehicles.length} {userVehicles.length !== 1 ? t('vehicles.vehicles') : t('vehicles.vehicle')}</p>
      </div>

      <motion.div
        className="px-4 sm:px-6 py-6 space-y-4"
        variants={listTransitions.container}
        initial="initial"
        animate="animate"
      >
        {userVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            variants={listTransitions.item}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`overflow-hidden relative rounded-2xl transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#12121a]/80 border-white/5 hover:border-cyan-500/15 backdrop-blur-sm'
                  : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-0" onClick={() => setSelectedVehicleId(vehicle.id)}>
                <div className={`w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center flex-shrink-0 rounded-lg sm:rounded-none cursor-pointer ${isDark ? 'bg-[#1a1a2e]' : 'bg-gray-100'}`}>
                  {vehicle.photo ? (
                    <img src={vehicle.photo} alt={vehicle.name} className="w-full h-full object-cover rounded-lg sm:rounded-none" />
                  ) : (
                    <CarIcon className={`w-8 h-8 sm:w-12 sm:h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="flex-1 py-2 sm:py-4 pr-2 sm:pr-4 cursor-pointer min-w-0">
                  <h3 className={`text-base sm:text-xl mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{vehicle.name}</h3>
                  {vehicle.licensePlate && (
                    <p className={`text-xs sm:text-sm mb-2 truncate ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{vehicle.licensePlate}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap ${isDark ? 'bg-[#1a1a2e] text-slate-400 border border-white/5' : 'bg-blue-50 text-blue-700'}`}>
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  </div>
                </div>
                {/* Boutons d'action mobile */}
                <div className="flex sm:hidden flex-col gap-1 absolute top-2 right-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingVehicle(vehicle); }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/90 hover:bg-cyan-600/20 text-slate-500 hover:text-cyan-400' : 'bg-white/90 hover:bg-blue-50 text-gray-400 hover:text-blue-500'}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingMileageVehicle(vehicle); }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/90 hover:bg-emerald-600/20 text-slate-500 hover:text-emerald-400' : 'bg-white/90 hover:bg-green-50 text-gray-400 hover:text-green-500'}`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer ${vehicle.name} ?`)) deleteVehicle(vehicle.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/90 hover:bg-red-600/20 text-slate-500 hover:text-red-400' : 'bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Boutons desktop */}
                <div className="hidden sm:flex">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer ${vehicle.name} ?`)) deleteVehicle(vehicle.id); }}
                    className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/80 hover:bg-red-600/20 text-slate-500 hover:text-red-400' : 'bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingVehicle(vehicle); }}
                    className={`absolute top-3 right-14 p-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/80 hover:bg-cyan-600/20 text-slate-500 hover:text-cyan-400' : 'bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-500'}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingMileageVehicle(vehicle); }}
                    className={`absolute top-3 right-28 p-2 rounded-lg transition-colors ${isDark ? 'bg-[#1a1a2e]/80 hover:bg-emerald-600/20 text-slate-500 hover:text-emerald-400' : 'bg-gray-100 hover:bg-green-50 text-gray-400 hover:text-green-500'}`}
                  >
                    <Gauge className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {userVehicles.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
              <CarIcon className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('vehicles.noVehicle')}</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{t('vehicles.addFirst')}</p>
          </motion.div>
        )}
      </motion.div>

      <div className="fixed bottom-28 right-6 z-10">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
          <Button
            onClick={() => setShowAddModal(true)}
            className="floating-action-button w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} />}
        {editingVehicle && <EditVehicleModal vehicle={editingVehicle} onClose={() => setEditingVehicle(null)} />}
        {editingMileageVehicle && <EditMileageModal vehicle={editingMileageVehicle} onClose={() => setEditingMileageVehicle(null)} />}
      </AnimatePresence>
    </div>
  );
}
