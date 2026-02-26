import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Wrench, Calendar, Gauge, Edit2, Trash2, Search, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddMaintenanceModal } from './AddMaintenanceModal';
import { EditMaintenanceModal } from './EditMaintenanceModal';
import { formatDate } from '../../utils/formatDate';
import type { MaintenanceEntry } from '../../types';
import { listTransitions } from '../../utils/animations';

interface MaintenanceLogProps {
  vehicleId: string;
  onOpenSettings?: () => void;
}

const maintenanceTypeLabels: Record<string, string> = {
  oil: 'Vidange',
  tires: 'Pneus',
  brakes: 'Freins',
  filter: 'Filtre',
  battery: 'Batterie',
  inspection: 'Contrôle technique',
  other: 'Autre',
};

const maintenanceTypeIcons: Record<string, string> = {
  oil: '💧',
  tires: '🔩',
  brakes: '⚙️',
  filter: '🔧',
  battery: '⚡',
  inspection: '✅',
  other: '🔧',
};

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function MaintenanceLog({ vehicleId, onOpenSettings }: MaintenanceLogProps) {
  const { maintenanceEntries } = useApp();
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MaintenanceEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const vehicleEntries = useMemo(() =>
    maintenanceEntries
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [maintenanceEntries, vehicleId]
  );

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return vehicleEntries;
    const q = normalizeText(searchQuery);
    return vehicleEntries.filter(entry => {
      const typeName = entry.customType || maintenanceTypeLabels[entry.type] || entry.type;
      const notes = entry.notes || '';
      return normalizeText(typeName).includes(q) || normalizeText(notes).includes(q) || formatDate(entry.date).includes(q);
    });
  }, [vehicleEntries, searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('maintenance.title')}</h2>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button onClick={() => setShowAddModal(true)} size="sm"
            className={isDark ? 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400' : 'bg-blue-600 hover:bg-blue-700'}>
            <Plus className="w-4 h-4 mr-2" />{t('maintenance.add')}
          </Button>
        </motion.div>
      </div>

      {/* Search bar */}
      {vehicleEntries.length > 0 && (
        <motion.div className="mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('maintenance.search')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#1a1a2e] border-white/[0.06] text-white placeholder-slate-500 focus:border-cyan-500/50'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {filteredEntries.length} {t('maintenance.searchResults')}
            </p>
          )}
        </motion.div>
      )}

      {filteredEntries.length > 0 ? (
        <motion.div className="space-y-3" variants={listTransitions.container} initial="initial" animate="animate">
          {filteredEntries.map((entry) => (
            <motion.div key={entry.id} variants={listTransitions.item} whileTap={{ scale: 0.98 }}>
              <Card className={`p-4 rounded-2xl transition-all ${
                isDark
                  ? 'bg-[#12121a]/80 border-white/5 hover:border-white/10'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {entry.customIcon || maintenanceTypeIcons[entry.type]}
                  </div>
                  <div className="flex-1">
                    <h3 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {entry.customType || maintenanceTypeLabels[entry.type]}
                    </h3>
                    <div className={`flex items-center gap-4 text-sm mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {entry.mileage.toLocaleString()} km
                      </div>
                    </div>
                    {entry.notes && (
                      <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{entry.notes}</p>
                    )}
                    {entry.cost && (
                      <p className="text-sm text-emerald-500">{entry.cost.toFixed(2)} €</p>
                    )}
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => { setEditingEntry(entry); setShowEditModal(true); }}
                        size="sm"
                        className={isDark ? 'bg-[#1a1a2e] hover:bg-[#252540] border border-white/5 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}>
                        <Edit2 className="w-4 h-4 mr-2" />{t('maintenance.modify')}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
            <Wrench className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {searchQuery ? t('maintenance.noResult') : t('maintenance.noEntry')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            {searchQuery ? '' : t('maintenance.addFirst')}
          </p>
        </motion.div>
      )}

      {showAddModal && (
        <AddMaintenanceModal vehicleId={vehicleId} onClose={() => setShowAddModal(false)} onOpenSettings={onOpenSettings} />
      )}
      {showEditModal && editingEntry && (
        <EditMaintenanceModal entry={editingEntry} onClose={() => setShowEditModal(false)} onOpenSettings={onOpenSettings} />
      )}
    </div>
  );
}
