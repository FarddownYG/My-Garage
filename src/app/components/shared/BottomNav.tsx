import React from 'react';
import { Home, Car, CheckSquare, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Accueil' },
    { id: 'vehicles', icon: Car, label: 'Véhicules' },
    { id: 'tasks', icon: CheckSquare, label: 'Tâches' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800 pb-safe shadow-2xl">
      <div className="flex items-center justify-around px-2 py-3">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-95 ${
              activeTab === id
                ? 'text-blue-500 bg-blue-500/10 shadow-glow-blue'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 hover:shadow-lg'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}