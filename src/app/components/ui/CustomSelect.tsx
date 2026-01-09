import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  className = '',
  required = false,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}} // Empty handler to avoid warning
          required={required}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
          id={id}
          readOnly
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-10 px-4 rounded-xl
          bg-gradient-to-r from-zinc-800/80 to-zinc-800/60
          border border-zinc-700/50
          text-white text-left
          flex items-center justify-between gap-3
          transition-all duration-200
          hover:border-zinc-600
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''}
        `}
      >
        <span className="flex items-center gap-2 flex-1">
          {selectedOption?.icon && (
            <span className="text-lg">{selectedOption.icon}</span>
          )}
          <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-2
            bg-zinc-900/95 backdrop-blur-xl
            border border-zinc-700/50
            rounded-xl shadow-2xl
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 rounded-lg
                    flex items-center justify-between gap-3
                    text-left transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/80'
                    }
                  `}
                >
                  <span className="flex items-center gap-2 flex-1">
                    {option.icon && (
                      <span className="text-lg">{option.icon}</span>
                    )}
                    <span className="font-medium">{option.label}</span>
                  </span>
                  {isSelected && (
                    <Check className="w-5 h-5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </div>
  );
}