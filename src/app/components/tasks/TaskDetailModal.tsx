import React from 'react';
import { X, CheckCircle2, Circle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { formatDateTime } from '../../utils/formatDate';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { vehicles, toggleTaskComplete } = useApp();
  const vehicle = vehicles.find(v => v.id === task.vehicleId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-modal z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-zinc-900 w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => toggleTaskComplete(task.id)}
              className="flex-shrink-0 text-zinc-400 hover:text-blue-400 transition-colors"
            >
              {task.completed ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>
            <h2 className="text-xl text-white truncate">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors ml-4">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vehicle Info */}
          {vehicle && (
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="text-zinc-400 text-sm mb-1">Véhicule</div>
              <div className="text-white font-medium">{vehicle.name}</div>
            </div>
          )}

          {/* Links */}
          {task.links && task.links.length > 0 && (
            <div>
              <div className="text-zinc-400 text-sm mb-3">Liens utiles</div>
              <div className="space-y-2">
                {task.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg p-4 group"
                  >
                    <LinkIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {link.name || link.url}
                      </div>
                      {link.name && (
                        <div className="text-zinc-400 text-sm truncate">{link.url}</div>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <div className="text-zinc-400 text-sm mb-3">Description</div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap break-words">{task.description}</p>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-zinc-400 text-sm mb-1">Créée le</div>
            <div className="text-white">
              {formatDateTime(task.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}