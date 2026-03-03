import React, { useState, useEffect } from 'react';
import { Bell, Gauge, Calendar, RotateCcw } from 'lucide-react';
import { Card } from '../ui/card';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_MILEAGE_THRESHOLD = 1500;
const DEFAULT_DATE_THRESHOLD_MONTHS = 1;

export function getAlertThresholds() {
  const mileage = parseInt(localStorage.getItem('valcar-mileage-threshold') || '', 10);
  const months = parseInt(localStorage.getItem('valcar-date-threshold-months') || '', 10);
  return {
    mileageThreshold: isNaN(mileage) ? DEFAULT_MILEAGE_THRESHOLD : mileage,
    dateThresholdDays: isNaN(months) ? DEFAULT_DATE_THRESHOLD_MONTHS * 30 : months * 30,
    dateThresholdMonths: isNaN(months) ? DEFAULT_DATE_THRESHOLD_MONTHS : months,
  };
}

interface AlertThresholdSettingsProps {
  onBack: () => void;
}

export function AlertThresholdSettings({ onBack }: AlertThresholdSettingsProps) {
  const [mileageThreshold, setMileageThreshold] = useState(DEFAULT_MILEAGE_THRESHOLD);
  const [dateThresholdMonths, setDateThresholdMonths] = useState(DEFAULT_DATE_THRESHOLD_MONTHS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const thresholds = getAlertThresholds();
    setMileageThreshold(thresholds.mileageThreshold);
    setDateThresholdMonths(thresholds.dateThresholdMonths);
  }, []);

  const handleSave = () => {
    localStorage.setItem('valcar-mileage-threshold', String(mileageThreshold));
    localStorage.setItem('valcar-date-threshold-months', String(dateThresholdMonths));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setMileageThreshold(DEFAULT_MILEAGE_THRESHOLD);
    setDateThresholdMonths(DEFAULT_DATE_THRESHOLD_MONTHS);
    localStorage.setItem('valcar-mileage-threshold', String(DEFAULT_MILEAGE_THRESHOLD));
    localStorage.setItem('valcar-date-threshold-months', String(DEFAULT_DATE_THRESHOLD_MONTHS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const { t } = useI18n();
  const { isDark } = useTheme();

  const bgMain = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const bgHeader = isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-500' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200 shadow-sm';
  const sliderTrack = isDark ? 'rgb(30 30 50)' : 'rgb(229 231 235)';

  return (
    <div className={`min-h-screen ${bgMain} pb-24`}>
      <div className={`${bgHeader} px-6 pt-12 pb-8`}>
        <button
          onClick={onBack}
          className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2 transition-colors"
        >
          {t('alertSettings.back')}
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/10">
            <Bell className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className={`text-2xl ${textMain}`}>{t('alertSettings.title')}</h1>
            <p className={`text-sm ${textMuted}`}>{t('alertSettings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Explication */}
        <Card className={`${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-500/10' : 'bg-blue-50 border-blue-200'} p-4 rounded-2xl`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-blue-700'}`}>
            {t('alertSettings.explanation')}{' '}
            <span className="text-cyan-400">{mileageThreshold.toLocaleString()} km</span> {t('alertSettings.explanationOr')}{' '}
            <span className="text-cyan-400">{dateThresholdMonths} {t('alertSettings.months')}</span> {t('alertSettings.explanationEnd')}
          </p>
        </Card>

        {/* Seuil kilométrique */}
        <Card className={`${cardBg} p-5 rounded-2xl backdrop-blur-sm`}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10">
              <Gauge className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className={textMain}>{t('alertSettings.mileageThreshold')}</p>
              <p className={`text-sm ${textMuted}`}>{t('alertSettings.mileageThresholdDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={mileageThreshold}
                onChange={(e) => setMileageThreshold(Number(e.target.value))}
                className="flex-1 h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, rgb(16 185 129) 0%, rgb(16 185 129) ${((mileageThreshold - 500) / 4500) * 100}%, ${sliderTrack} ${((mileageThreshold - 500) / 4500) * 100}%, ${sliderTrack} 100%)`
                }}
              />
              <span className="text-emerald-400 min-w-[70px] text-right tabular-nums">
                {mileageThreshold.toLocaleString()} km
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>500 km</span>
              <span>2500 km</span>
              <span>5000 km</span>
            </div>
          </div>
        </Card>

        {/* Seuil temporel */}
        <Card className={`${cardBg} p-5 rounded-2xl backdrop-blur-sm`}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-violet-500/10">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className={textMain}>{t('alertSettings.dateThreshold')}</p>
              <p className={`text-sm ${textMuted}`}>{t('alertSettings.dateThresholdDesc')}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={dateThresholdMonths}
                onChange={(e) => setDateThresholdMonths(Number(e.target.value))}
                className="flex-1 h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, rgb(139 92 246) 0%, rgb(139 92 246) ${((dateThresholdMonths - 1) / 5) * 100}%, ${sliderTrack} ${((dateThresholdMonths - 1) / 5) * 100}%, ${sliderTrack} 100%)`
                }}
              />
              <span className="text-violet-400 min-w-[50px] text-right tabular-nums">
                {dateThresholdMonths} {t('alertSettings.months')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>1 {t('alertSettings.month')}</span>
              <span>3 {t('alertSettings.months')}</span>
              <span>6 {t('alertSettings.months')}</span>
            </div>
          </div>
        </Card>

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#12121a] border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:border-white/10 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            {t('alertSettings.default')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl hover:from-cyan-400 hover:to-blue-400 transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20"
          >
            {saved ? t('alertSettings.saved') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}