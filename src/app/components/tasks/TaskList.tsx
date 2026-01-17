import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, Edit2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { TaskDetailModal } from './TaskDetailModal';

export function TaskList() {
  const { tasks, vehicles, updateTask, deleteTask } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  }).sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.completed ? 1 : -1;
  });

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8">
        <h1 className="text-3xl text-white mb-2">Tâches</h1>
        <p className="text-zinc-500">{pendingCount} en attente · {completedCount} terminée{completedCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex gap-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'all' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
        >
          Toutes ({tasks.length})
        </Button>
        <Button
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'pending' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
        >
          À faire ({pendingCount})
        </Button>
        <Button
          onClick={() => setFilter('completed')}
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          className={filter === 'completed' ? 'bg-blue-600' : 'bg-transparent border-zinc-700 text-zinc-400'}
        >
          Terminées ({completedCount})
        </Button>
      </div>

      <div className="px-6 py-4 space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const vehicle = vehicles.find(v => v.id === task.vehicleId);
            return (
              <Card key={task.id} className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-soft overflow-hidden">
                {/* Liens en haut */}
                {task.links && task.links.length > 0 && (
                  <div className="bg-zinc-800/30 px-4 py-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                      {task.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-colors rounded-lg px-3 py-1.5 text-xs whitespace-nowrap group"
                        >
                          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{link.name || link.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contenu de la tâche */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTask(task.id, { completed: !task.completed });
                      }}
                      className="mt-1 text-zinc-400 hover:text-blue-500 transition-colors flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-green-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Zone cliquable pour voir les détails */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setViewingTask(task)}
                    >
                      <h3 className={`text-white mb-1 truncate ${task.completed ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-zinc-500 mb-2 break-words overflow-hidden line-clamp-3">
                          {task.description}
                        </p>
                      )}
                      {vehicle && (
                        <p className="text-xs text-zinc-600">{vehicle.name}</p>
                      )}
                    </div>
                    
                    {/* Boutons d'action - restent dans le rectangle */}
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                        }}
                        className="text-zinc-600 hover:text-blue-500 transition-all p-1.5 hover:bg-blue-500/10 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer cette tâche ?')) {
                            deleteTask(task.id);
                          }
                        }}
                        className="text-zinc-600 hover:text-red-500 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-white mb-2">Aucune tâche</h3>
            <p className="text-zinc-500 text-sm">
              {filter === 'pending' ? 'Toutes les tâches sont terminées !' : 'Ajoutez votre première tâche'}
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-28 right-6">
        <Button
          onClick={() => setShowAddModal(true)}
          className="floating-action-button w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-glow-blue hover:shadow-2xl transition-all"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} />
      )}
      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
      {viewingTask && (
        <TaskDetailModal task={viewingTask} onClose={() => setViewingTask(null)} />
      )}
    </div>
  );
}