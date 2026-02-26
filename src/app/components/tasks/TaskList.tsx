import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckSquare, Square, Trash2, Edit2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { listTransitions } from '../../utils/animations';

export function TaskList() {
  const { tasks, vehicles, currentProfile, updateTask, deleteTask, getUserVehicles } = useApp();
  const { t } = useI18n();
  const { isDark } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');

  const userVehicles = useMemo(() => getUserVehicles(), [getUserVehicles]);
  const userVehicleIds = useMemo(() => userVehicles.map(v => v.id), [userVehicles]);

  const filteredTasks = useMemo(() => tasks
    .filter(task => {
      if (selectedVehicleId !== 'all' && task.vehicleId !== selectedVehicleId) return false;
      if (!userVehicleIds.includes(task.vehicleId)) return false;
      if (filter === 'pending') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    }), [tasks, userVehicleIds, selectedVehicleId, filter]);

  const pendingCount = useMemo(() =>
    tasks.filter(t => userVehicleIds.includes(t.vehicleId) && !t.completed).length,
    [tasks, userVehicleIds]
  );
  
  const completedCount = useMemo(() =>
    tasks.filter(t => userVehicleIds.includes(t.vehicleId) && t.completed).length,
    [tasks, userVehicleIds]
  );

  const filterBtnClass = (isActive: boolean) =>
    isActive
      ? isDark ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent' : 'bg-blue-600 text-white border-transparent'
      : isDark ? 'bg-transparent border-white/10 text-slate-400' : 'bg-transparent border-gray-300 text-gray-500';

  const vehicleBtnClass = (isActive: boolean) =>
    isActive
      ? isDark ? 'bg-violet-600 text-white whitespace-nowrap' : 'bg-violet-600 text-white whitespace-nowrap'
      : isDark ? 'bg-transparent border-white/10 text-slate-400 whitespace-nowrap' : 'bg-transparent border-gray-300 text-gray-500 whitespace-nowrap';

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      <div className={`px-4 sm:px-6 pt-12 pb-8 ${isDark ? 'bg-gradient-to-b from-[#12121a] to-[#0a0a0f]' : 'bg-gradient-to-b from-white to-gray-50'}`}>
        <h1 className={`text-2xl sm:text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tasks.title')}</h1>
        <p className={isDark ? 'text-slate-500' : 'text-gray-500'}>
          {pendingCount} {t('tasks.pending')} · {completedCount} {completedCount !== 1 ? t('tasks.completeds') : t('tasks.completed')}
        </p>
      </div>

      {/* Vehicle selector */}
      {userVehicles.length > 1 && (
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <Button onClick={() => setSelectedVehicleId('all')} variant={selectedVehicleId === 'all' ? 'default' : 'outline'} size="sm" className={vehicleBtnClass(selectedVehicleId === 'all')}>
              {t('tasks.allVehicles')}
            </Button>
            {userVehicles.map(vehicle => (
              <Button key={vehicle.id} onClick={() => setSelectedVehicleId(vehicle.id)}
                variant={selectedVehicleId === vehicle.id ? 'default' : 'outline'} size="sm"
                className={vehicleBtnClass(selectedVehicleId === vehicle.id)}>
                {vehicle.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 sm:px-6 py-4 flex gap-2">
        <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'default' : 'outline'} size="sm" className={filterBtnClass(filter === 'all')}>
          {t('tasks.all')} ({tasks.filter(t => userVehicleIds.includes(t.vehicleId)).length})
        </Button>
        <Button onClick={() => setFilter('pending')} variant={filter === 'pending' ? 'default' : 'outline'} size="sm" className={filterBtnClass(filter === 'pending')}>
          {t('tasks.todo')} ({pendingCount})
        </Button>
        <Button onClick={() => setFilter('completed')} variant={filter === 'completed' ? 'default' : 'outline'} size="sm" className={filterBtnClass(filter === 'completed')}>
          {t('tasks.done')} ({completedCount})
        </Button>
      </div>

      <motion.div className="px-4 sm:px-6 py-4 space-y-3" variants={listTransitions.container} initial="initial" animate="animate">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const vehicle = userVehicles.find(v => v.id === task.vehicleId);
            return (
              <motion.div key={task.id} variants={listTransitions.item} whileTap={{ scale: 0.98 }}>
                <Card className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#12121a]/80 border-white/5 hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                  {/* Links */}
                  {task.links && task.links.length > 0 && (
                    <div className={`px-4 py-2 border-b ${isDark ? 'bg-[#1a1a2e]/30 border-white/5' : 'bg-blue-50/50 border-gray-100'}`}>
                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {task.links.map((link, index) => (
                          <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap group transition-colors ${isDark ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'}`}>
                            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{link.name || link.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Task content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completed: !task.completed }); }}
                        className={`mt-1 transition-colors flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-gray-400 hover:text-blue-500'}`}>
                        {task.completed ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5" />}
                      </button>
                      
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewingTask(task)}>
                        <h3 className={`mb-1 truncate ${task.completed ? 'line-through opacity-60' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mb-2 break-words overflow-hidden line-clamp-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        )}
                        {vehicle && (
                          <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>{vehicle.name}</p>
                        )}
                      </div>
                      
                      <div className="flex items-start gap-1 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer cette tâche ?')) deleteTask(task.id); }}
                          className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-[#12121a] border border-white/5' : 'bg-gray-100'}`}>
              <CheckSquare className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('tasks.noTask')}</h3>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              {filter === 'pending' ? t('tasks.allDone') : t('tasks.addFirst')}
            </p>
          </motion.div>
        )}
      </motion.div>

      <div className="fixed bottom-28 right-6">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
          <Button onClick={() => setShowAddModal(true)}
            className="floating-action-button w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-lg shadow-cyan-500/20 transition-all">
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
        {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
        {viewingTask && <TaskDetailModal task={viewingTask} onClose={() => setViewingTask(null)} />}
      </AnimatePresence>
    </div>
  );
}
