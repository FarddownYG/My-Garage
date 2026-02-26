import React, { useState } from 'react';
import { Users, Shield, Database, ChevronRight, Wrench, User, Type, Link as LinkIcon, Bell, Sun, Moon, Globe } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { ProfileManagement } from './ProfileManagement';
import { AdminPinModal } from './AdminPinModal';
import { MaintenanceSettings } from './MaintenanceSettings';
import { CustomMaintenanceProfiles } from './CustomMaintenanceProfiles';
import { MaintenanceProfileDetail } from './MaintenanceProfileDetail';
import { EditProfileModal } from './EditProfileModal';
import { LinkProfileModal } from './LinkProfileModal';
import { AlertThresholdSettings } from './AlertThresholdSettings';
import { Footer } from '../shared/Footer';

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const { currentProfile, resetData, updateFontSize } = useApp();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme, isDark } = useTheme();
  const [showProfileManagement, setShowProfileManagement] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showMaintenanceSettings, setShowMaintenanceSettings] = useState(false);
  const [showCustomProfiles, setShowCustomProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLinkProfileModal, setShowLinkProfileModal] = useState(false);
  const [showAlertThresholds, setShowAlertThresholds] = useState(false);
  
  const fontSize = currentProfile?.fontSize || 50;

  const handleResetData = () => {
    if (!currentProfile) return;
    const message = `⚠️ Cette action supprimera TOUTES les données du profil "${currentProfile.name}" :\n\n• Tous les véhicules\n• Tous les entretiens\n• Toutes les tâches\n• Tous les rappels\n• Les templates personnalisés\n\nLe profil lui-même sera conservé.\n\nÊtes-vous sûr ?`;
    if (confirm(message)) {
      if (confirm(`Dernière confirmation : toutes les données de "${currentProfile.name}" seront perdues définitivement.`)) {
        resetData();
        alert('✅ Données du profil réinitialisées avec succès !');
      }
    }
  };

  if (showAlertThresholds) return <AlertThresholdSettings onBack={() => setShowAlertThresholds(false)} />;
  if (showProfileManagement) return <ProfileManagement onBack={() => setShowProfileManagement(false)} />;
  if (showMaintenanceSettings) return <MaintenanceSettings onBack={() => setShowMaintenanceSettings(false)} onOpenCustomProfiles={() => { setShowMaintenanceSettings(false); setShowCustomProfiles(true); }} />;
  if (selectedProfileId) return <MaintenanceProfileDetail profileId={selectedProfileId} onBack={() => setSelectedProfileId(null)} />;
  if (showCustomProfiles) return <CustomMaintenanceProfiles onBack={() => setShowCustomProfiles(false)} onOpenProfileDetail={(id) => setSelectedProfileId(id)} />;

  const cardClass = isDark
    ? 'bg-[#12121a]/80 border-white/5 p-4 cursor-pointer hover:bg-[#1a1a2e] transition-colors rounded-2xl'
    : 'bg-white border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-2xl shadow-sm';
  const sectionTitle = isDark ? 'text-sm text-slate-500 mb-3' : 'text-sm text-gray-500 mb-3';
  const titleColor = isDark ? 'text-white' : 'text-gray-900';
  const subtitleColor = isDark ? 'text-sm text-slate-500' : 'text-sm text-gray-500';
  const chevronColor = isDark ? 'text-slate-600' : 'text-gray-400';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      <div className={`px-6 pt-12 pb-8 ${isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <h1 className={`text-3xl mb-2 ${titleColor}`}>{t('settings.title')}</h1>
        <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>{currentProfile?.name}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Admin Section */}
        {currentProfile?.isAdmin && (
          <div>
            <h2 className={sectionTitle}>{t('settings.admin')}</h2>
            <div className="space-y-2">
              <Card className={cardClass} onClick={() => setShowProfileManagement(true)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className={titleColor}>{t('settings.manageProfiles')}</p>
                      <p className={subtitleColor}>{t('settings.createModifyDelete')}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
                </div>
              </Card>

              <Card className={cardClass} onClick={() => setShowAdminPinModal(true)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500/15 to-purple-500/15 rounded-xl border border-violet-500/10">
                      <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className={titleColor}>{t('settings.adminPin')}</p>
                      <p className={subtitleColor}>{t('settings.security')}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
                </div>
              </Card>

              <Card className={cardClass} onClick={() => setShowLinkProfileModal(true)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                      <LinkIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className={titleColor}>{t('settings.linkOldProfile')}</p>
                      <p className={subtitleColor}>{t('settings.recoverData')}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Profile */}
        <div>
          <h2 className={sectionTitle}>{t('settings.profile')}</h2>
          <Card className={cardClass} onClick={() => setShowEditProfileModal(true)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className={titleColor}>{t('settings.editProfile')}</p>
                  <p className={subtitleColor}>{t('settings.nameAvatar')}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
            </div>
          </Card>
        </div>

        {/* Display */}
        <div>
          <h2 className={sectionTitle}>{t('settings.display')}</h2>
          <div className="space-y-2">
            {/* Font size */}
            <Card className={`${isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl`}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 rounded-xl border border-violet-500/10 flex-shrink-0">
                  <Type className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={titleColor}>{t('settings.fontSize')}</p>
                      <p className={subtitleColor}>{t('settings.adjustFontSize')}</p>
                    </div>
                    <div className="text-cyan-400 font-semibold text-lg">{fontSize}%</div>
                  </div>
                  <div className="space-y-2">
                    <input type="range" min="0" max="100" step="5" value={fontSize}
                      onChange={(e) => updateFontSize(Number(e.target.value))}
                      className="w-full h-2 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{ background: `linear-gradient(to right, rgb(34 211 238) 0%, rgb(34 211 238) ${fontSize}%, ${isDark ? 'rgb(26 26 46)' : 'rgb(229 231 235)'} ${fontSize}%, ${isDark ? 'rgb(26 26 46)' : 'rgb(229 231 235)'} 100%)` }} />
                    <div className={`flex justify-between text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Theme Toggle */}
            <Card className={`${isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10 flex-shrink-0">
                  {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                </div>
                <div className="flex-1">
                  <p className={titleColor}>{t('settings.theme')}</p>
                  <p className={subtitleColor}>{t('settings.themeDesc')}</p>
                </div>
                <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <button onClick={() => setTheme('dark')}
                    className={`px-3 py-1.5 text-xs transition-colors ${theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : isDark ? 'bg-[#1a1a2e] text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    <Moon className="w-3.5 h-3.5 inline mr-1" />{t('settings.dark')}
                  </button>
                  <button onClick={() => setTheme('light')}
                    className={`px-3 py-1.5 text-xs transition-colors ${theme === 'light' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' : isDark ? 'bg-[#1a1a2e] text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    <Sun className="w-3.5 h-3.5 inline mr-1" />{t('settings.light')}
                  </button>
                </div>
              </div>
            </Card>

            {/* Language */}
            <Card className={`${isDark ? 'bg-[#12121a]/80 border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-xl border border-emerald-500/10 flex-shrink-0">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className={titleColor}>{t('settings.language')}</p>
                  <p className={subtitleColor}>{t('settings.languageDesc')}</p>
                </div>
                <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <button onClick={() => setLang('fr')}
                    className={`px-3 py-1.5 text-xs transition-colors ${lang === 'fr' ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : isDark ? 'bg-[#1a1a2e] text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    FR
                  </button>
                  <button onClick={() => setLang('en')}
                    className={`px-3 py-1.5 text-xs transition-colors ${lang === 'en' ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' : isDark ? 'bg-[#1a1a2e] text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    EN
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Maintenance */}
        <div>
          <h2 className={sectionTitle}>{t('settings.maintenanceSection')}</h2>
          <div className="space-y-2">
            <Card className={cardClass} onClick={() => setShowMaintenanceSettings(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500/15 to-amber-500/15 rounded-xl border border-orange-500/10">
                    <Wrench className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className={titleColor}>{t('settings.maintenanceSettings')}</p>
                    <p className={subtitleColor}>{t('settings.typesAndIntervals')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
              </div>
            </Card>
            <Card className={cardClass} onClick={() => setShowCustomProfiles(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500/15 to-amber-500/15 rounded-xl border border-orange-500/10">
                    <Wrench className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className={titleColor}>{t('settings.customProfiles')}</p>
                    <p className={subtitleColor}>{t('settings.typesAndIntervals')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
              </div>
            </Card>
            <Card className={cardClass} onClick={() => setShowAlertThresholds(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-xl border border-cyan-500/10">
                    <Bell className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className={titleColor}>{t('settings.alertThresholds')}</p>
                    <p className={subtitleColor}>{t('settings.alertThresholdsDesc')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
              </div>
            </Card>
          </div>
        </div>

        {/* Data */}
        <div>
          <h2 className={sectionTitle}>{t('settings.data')}</h2>
          <div className="space-y-2">
            <Card className={cardClass} onClick={() => setShowLinkProfileModal(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-xl border border-amber-500/10">
                    <LinkIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className={titleColor}>{t('settings.linkOldProfile')}</p>
                    <p className={subtitleColor}>{t('settings.recoverOldData')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
              </div>
            </Card>
            <Card className={cardClass} onClick={handleResetData}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500/15 to-rose-500/15 rounded-xl border border-red-500/10">
                    <Database className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className={titleColor}>{t('settings.resetData')}</p>
                    <p className={subtitleColor}>{t('settings.resetDataDesc')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${chevronColor}`} />
              </div>
            </Card>
          </div>
        </div>

        {/* App Info */}
        <div className="pt-8 text-center">
          <p className={`text-sm mb-1 ${isDark ? 'text-slate-600' : 'text-gray-500'}`}>Valcar</p>
          <p className={`text-xs ${isDark ? 'text-slate-700' : 'text-gray-400'}`}>Version 1.0.0</p>
        </div>
      </div>

      {showAdminPinModal && <AdminPinModal onClose={() => setShowAdminPinModal(false)} />}
      {showEditProfileModal && currentProfile && <EditProfileModal profile={currentProfile} onClose={() => setShowEditProfileModal(false)} />}
      {showLinkProfileModal && <LinkProfileModal onClose={() => setShowLinkProfileModal(false)} />}
      <Footer />
    </div>
  );
}
