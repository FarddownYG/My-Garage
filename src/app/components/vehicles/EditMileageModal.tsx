import React, { useState } from 'react';
import { X, Gauge } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Vehicle } from '../../types';

interface EditMileageModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function EditMileageModal({ vehicle, onClose }: EditMileageModalProps) {
  const { updateVehicle } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const [mileage, setMileage] = useState(vehicle.mileage.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicle(vehicle.id, { mileage: parseInt(mileage) || 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${isDark ? 'bg-[#12121a]' : 'bg-white'} w-full md:max-w-md md:rounded-2xl rounded-t-2xl overflow-hidden`}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <h2 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('vehicles.mileage')}</h2>
          </div>
          <button onClick={onClose} className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="mileage" className={`${isDark ? 'text-slate-400' : 'text-gray-500'} mb-2 block`}>{vehicle.name}</Label>
            <div className="relative">
              <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="50000"
                className={`${isDark ? 'bg-[#1a1a2e] border-white/[0.06] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} text-2xl pr-16 h-14`} autoFocus required />
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>km</span>
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              Kilométrage actuel : {vehicle.mileage.toLocaleString()} km
            </p>
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