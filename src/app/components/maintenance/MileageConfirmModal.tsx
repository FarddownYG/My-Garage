import React from 'react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';

interface MileageConfirmModalProps {
  type: 'lower' | 'higher';
  enteredMileage: number;
  vehicleMileage: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MileageConfirmModal({
  type,
  enteredMileage,
  vehicleMileage,
  onConfirm,
  onCancel,
}: MileageConfirmModalProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();

  const modalBg = isDark ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';
  const cardBg = isDark ? 'bg-[#1a1a2e]/50' : 'bg-gray-50';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className={`${modalBg} w-full max-w-md rounded-2xl overflow-hidden border ${borderColor} shadow-2xl`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              type === 'lower' ? 'bg-red-500/10' : 'bg-cyan-500/10'
            }`}>
              {type === 'lower' ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <ArrowUpDown className="w-6 h-6 text-cyan-500" />
              )}
            </div>
            <h2 className={`text-xl ${textPrimary}`}>
              {type === 'lower' ? 'Kilométrage incorrect ?' : 'Mettre à jour le kilométrage ?'}
            </h2>
          </div>
          <p className={`text-sm ${textMuted}`}>
            {type === 'lower'
              ? 'Le kilométrage entré est inférieur au kilométrage actuel du véhicule.'
              : 'Le kilométrage entré est supérieur. Voulez-vous aussi mettre à jour le kilométrage du véhicule ?'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className={`${cardBg} rounded-xl p-4 space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${textMuted}`}>Kilométrage entré</span>
              <span className={`font-medium ${textPrimary}`}>{enteredMileage.toLocaleString()} km</span>
            </div>
            <div className={`h-px ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />
            <div className="flex justify-between items-center">
              <span className={`text-sm ${textMuted}`}>Kilométrage voiture</span>
              <span className={`font-medium ${type === 'lower' ? 'text-red-400' : 'text-cyan-400'}`}>
                {vehicleMileage.toLocaleString()} km
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className={`flex-1 ${isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500'}`}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${
                type === 'lower'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400'
              } text-white`}
            >
              {type === 'lower' ? 'Confirmer quand même' : 'Mettre à jour'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}