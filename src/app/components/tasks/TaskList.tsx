import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, Edit2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';

export function TaskList() {
  const { tasks, vehicles, updateTask, deleteTask } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
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
              <Card key={task.id} className="bg-zinc-900 border-zinc-800 p-4 rounded-2xl shadow-soft hover-lift">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => updateTask(task.id, { completed: !task.completed })}
                    className="mt-1 text-zinc-400 hover:text-blue-500 transition-colors"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h3 className={`text-white mb-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-zinc-500 mb-2">{task.description}</p>
                    )}
                    {vehicle && (
                      <p className="text-xs text-zinc-600">{vehicle.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette tâche ?')) {
                        deleteTask(task.id);
                      }
                    }}
                    className="text-zinc-600 hover:text-red-500 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-zinc-600 hover:text-blue-500 transition-all p-1.5 hover:bg-blue-500/10 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
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
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-glow-blue hover:shadow-2xl transition-all"
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
    </div>
  );
}