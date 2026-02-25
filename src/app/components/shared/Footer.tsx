import React from 'react';
import { Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs py-4">
      <span>Créé par Yanis</span>
      <a
        href="https://fr.linkedin.com/in/yanis-gely"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 hover:bg-cyan-500/15 rounded-full px-2.5 py-1 group border border-cyan-500/10"
        aria-label="LinkedIn de Yanis Gely"
      >
        <Linkedin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">LinkedIn</span>
      </a>
    </div>
  );
}