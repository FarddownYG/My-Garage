import React from 'react';
import { Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs py-4">
      <span>Créé par Yanis</span>
      <a
        href="https://fr.linkedin.com/in/yanis-gely"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 rounded-full px-2.5 py-1 group"
        aria-label="LinkedIn de Yanis Gely"
      >
        <Linkedin className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">LinkedIn</span>
      </a>
    </div>
  );
}