import React, { useState, useEffect, useRef } from 'react';

interface DateInputFRProps {
  value: string; // Format YYYY-MM-DD
  onChange: (value: string) => void; // Retourne YYYY-MM-DD
  className?: string;
  required?: boolean;
  id?: string;
}

/**
 * Sélecteur de date en format JJ/MM/AAAA
 * Stocke et retourne la valeur au format ISO YYYY-MM-DD
 * Compatible iOS, Android, Desktop
 */
export function DateInputFR({ value, onChange, className = '', required, id }: DateInputFRProps) {
  // Décomposer la valeur ISO en DD, MM, YYYY
  const parseValue = (iso: string) => {
    if (!iso) return { dd: '', mm: '', yyyy: '' };
    const parts = iso.split('-');
    if (parts.length === 3) {
      return { dd: parts[2], mm: parts[1], yyyy: parts[0] };
    }
    return { dd: '', mm: '', yyyy: '' };
  };

  const { dd: initDD, mm: initMM, yyyy: initYYYY } = parseValue(value);
  const [dd, setDD] = useState(initDD);
  const [mm, setMM] = useState(initMM);
  const [yyyy, setYYYY] = useState(initYYYY);

  const mmRef = useRef<HTMLInputElement>(null);
  const yyyyRef = useRef<HTMLInputElement>(null);

  // Synchroniser si la valeur externe change
  useEffect(() => {
    const { dd: d, mm: m, yyyy: y } = parseValue(value);
    setDD(d);
    setMM(m);
    setYYYY(y);
  }, [value]);

  // Émettre la date ISO quand les trois champs sont remplis
  const emit = (newDD: string, newMM: string, newYYYY: string) => {
    const d = parseInt(newDD, 10);
    const m = parseInt(newMM, 10);
    const y = parseInt(newYYYY, 10);

    if (
      newDD.length === 2 && newMM.length === 2 && newYYYY.length === 4 &&
      d >= 1 && d <= 31 &&
      m >= 1 && m <= 12 &&
      y >= 1900 && y <= 2100
    ) {
      const iso = `${newYYYY}-${newMM.padStart(2, '0')}-${newDD.padStart(2, '0')}`;
      onChange(iso);
    }
  };

  const handleDD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDD(raw);
    emit(raw, mm, yyyy);
    // Auto-avance quand 2 chiffres entrés
    if (raw.length === 2) mmRef.current?.focus();
  };

  const handleMM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMM(raw);
    emit(dd, raw, yyyy);
    if (raw.length === 2) yyyyRef.current?.focus();
  };

  const handleYYYY = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYYYY(raw);
    emit(dd, mm, raw);
  };

  // Retour arrière sur champ vide → focus au champ précédent
  const handleMMKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && mm === '') {
      const ddInput = document.getElementById(id ? `${id}-dd` : 'date-dd');
      (ddInput as HTMLInputElement)?.focus();
    }
  };

  const handleYYYYKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && yyyy === '') {
      mmRef.current?.focus();
    }
  };

  const baseInput =
    'w-full bg-transparent text-center text-white outline-none caret-blue-400 tabular-nums';

  return (
    <div
      className={`flex items-center bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 gap-1 focus-within:border-blue-500 transition-colors ${className}`}
    >
      {/* Jour */}
      <input
        id={id ? `${id}-dd` : 'date-dd'}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="JJ"
        value={dd}
        onChange={handleDD}
        required={required}
        maxLength={2}
        className={`${baseInput} w-8`}
      />
      <span className="text-zinc-500 select-none">/</span>
      {/* Mois */}
      <input
        ref={mmRef}
        id={id ? `${id}-mm` : 'date-mm'}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="MM"
        value={mm}
        onChange={handleMM}
        onKeyDown={handleMMKeyDown}
        maxLength={2}
        className={`${baseInput} w-8`}
      />
      <span className="text-zinc-500 select-none">/</span>
      {/* Année */}
      <input
        ref={yyyyRef}
        id={id ? `${id}-yyyy` : 'date-yyyy'}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="AAAA"
        value={yyyy}
        onChange={handleYYYY}
        onKeyDown={handleYYYYKeyDown}
        maxLength={4}
        className={`${baseInput} w-14`}
      />
    </div>
  );
}
