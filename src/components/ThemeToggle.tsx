import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext.tsx';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: 'dark', label: 'Escuro', icon: <Moon className="w-3.5 h-3.5 text-cyan-400" /> },
    { key: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { key: 'system', label: 'Sistema', icon: <Laptop className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar tema visual"
        title={`Tema: ${theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}`}
        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer shadow-sm"
      >
        {effectiveTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-cyan-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1 z-50 animate-fade-in text-xs font-semibold">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Tema
          </div>
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setTheme(opt.key);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center justify-between text-left transition cursor-pointer ${
                theme === opt.key
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              {theme === opt.key && <Check className="w-3.5 h-3.5 text-cyan-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
