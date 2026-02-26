import React from 'react';
import { X, CheckCircle2, Circle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { formatDateTime } from '../../utils/formatDate';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { vehicles, toggleTaskComplete } = useApp();
  const { isDark } = useTheme();
  const { t } = useI18n();
  const vehicle = vehicles.find(v => v.id === task.vehicleId);

  const cardBg = isDark ? 'bg-[#1a1a2e]/50' : 'bg-gray-50';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-gray-200';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`${isDark ? 'bg-[#12121a]' : 'bg-white'} w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => toggleTaskComplete(task.id)} className={`flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-400 hover:text-blue-500'} transition-colors`}>
              {task.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Circle className="w-6 h-6" />}
            </button>
            <h2 className={`text-xl truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h2>
          </div>
          <button onClick={onClose} className={`ml-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {vehicle && (
            <div className={`${cardBg} rounded-lg p-4`}>
              <div className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Véhicule</div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{vehicle.name}</div>
            </div>
          )}

          {task.links && task.links.length > 0 && (
            <div>
              <div className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('tasks.usefulLinks')}</div>
              <div className="space-y-2">
                {task.links.map((link, index) => (
                  <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-lg p-4 group transition-colors ${isDark ? 'bg-[#1a1a2e]/50 hover:bg-[#1a1a2e]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <LinkIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{link.name || link.url}</div>
                      {link.name && <div className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{link.url}</div>}
                    </div>
                    <ExternalLink className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400 group-hover:text-cyan-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {task.description && (
            <div>
              <div className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('tasks.description')}</div>
              <div className={`${cardBg} rounded-lg p-4`}>
                <p className={`whitespace-pre-wrap break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.description}</p>
              </div>
            </div>
          )}

          <div className={`${cardBg} rounded-lg p-4`}>
            <div className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t('tasks.createdAt')}</div>
            <div className={isDark ? 'text-white' : 'text-gray-900'}>{formatDateTime(task.createdAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
