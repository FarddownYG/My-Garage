import React from 'react';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs py-4">
      <span>Créé par Juste un Gas</span>
      <a
        href="https://www.instagram.com/juste_un_gas/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/15 rounded-full px-2.5 py-1 group border border-cyan-500/10"
        aria-label="Instagram de Juste un Gas"
      >
        <Instagram className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Instagram</span>
      </a>
    </div>
  );
}