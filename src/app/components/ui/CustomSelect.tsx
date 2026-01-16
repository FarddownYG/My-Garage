import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  className = ''
}: CustomSelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 
          bg-zinc-800/50 
          border border-zinc-700/50 
          rounded-xl 
          text-white 
          appearance-none 
          cursor-pointer
          hover:bg-zinc-800/70
          focus:outline-none 
          focus:ring-2 
          focus:ring-blue-500/50 
          focus:border-blue-500/50
          transition-all
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" 
      />
    </div>
  );
}
