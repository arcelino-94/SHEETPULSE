import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';

interface PeriodDropdownProps {
  dataInicio?: string;
  dataFim?: string;
  onSelectPeriod: (start?: string, end?: string) => void;
}

export const PeriodDropdown: React.FC<PeriodDropdownProps> = ({
  dataInicio,
  dataFim,
  onSelectPeriod,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState(dataInicio || '2026-09-01');
  const [customEnd, setCustomEnd] = useState(dataFim || '2026-09-30');
  const [validationError, setValidationError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current active label
  const getActiveLabel = () => {
    if (!dataInicio && !dataFim) return 'Ano 2026';
    if (dataInicio === '2026-10-01' && dataFim === '2026-10-31') return 'Outubro / 26';
    if (dataInicio === '2026-09-01' && dataFim === '2026-09-30') return 'Setembro / 26';
    if (dataInicio === '2026-08-01' && dataFim === '2026-08-31') return 'Agosto / 26';
    if (dataInicio === '2026-07-01' && dataFim === '2026-07-31') return 'Julho / 26';
    if (dataInicio === '2026-06-01' && dataFim === '2026-06-30') return 'Junho / 26';

    // Format custom dates nicely: DD/MM a DD/MM
    if (dataInicio && dataFim) {
      const s = dataInicio.split('-').slice(1).reverse().join('/');
      const e = dataFim.split('-').slice(1).reverse().join('/');
      return `${s} a ${e}`;
    }
    return 'Personalizado';
  };

  const handleSelectMonth = (year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setCustomStart(start);
    setCustomEnd(end);
    setValidationError(null);
    onSelectPeriod(start, end);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const handleSelectAllYear = () => {
    setValidationError(null);
    onSelectPeriod(undefined, undefined);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      if (customEnd < customStart) {
        setValidationError('A data final não pode ser anterior à data inicial.');
        return;
      }
      setValidationError(null);
      onSelectPeriod(customStart, customEnd);
      setIsOpen(false);
    }
  };

  const handleQuickInterval = (type: 'quinzena1' | 'quinzena2' | 'mes') => {
    const baseDate = customStart || dataInicio || '2026-09-01';
    const [year, month] = baseDate.split('-');
    const y = parseInt(year, 10) || 2026;
    const m = parseInt(month, 10) || 9;
    const mStr = String(m).padStart(2, '0');
    const lastDay = new Date(y, m, 0).getDate();

    let s = '';
    let e = '';
    if (type === 'quinzena1') {
      s = `${y}-${mStr}-01`;
      e = `${y}-${mStr}-15`;
    } else if (type === 'quinzena2') {
      s = `${y}-${mStr}-16`;
      e = `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    } else {
      s = `${y}-${mStr}-01`;
      e = `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    }

    setCustomStart(s);
    setCustomEnd(e);
    setValidationError(null);
    onSelectPeriod(s, e);
    setIsOpen(false);
  };

  const isCurrentActive = (start?: string, end?: string) => {
    if (!start && !end) return !dataInicio && !dataFim;
    return dataInicio === start && dataFim === end;
  };

  const isCustomActive =
    dataInicio &&
    dataFim &&
    ![
      '2026-10-01:2026-10-31',
      '2026-09-01:2026-09-30',
      '2026-08-01:2026-08-31',
      '2026-07-01:2026-07-31',
      '2026-06-01:2026-06-30',
    ].includes(`${dataInicio}:${dataFim}`);

  return (
    <div className="relative notranslate" ref={dropdownRef} translate="no">
      {/* Discrete Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer select-none shadow-sm"
        title="Selecionar período"
      >
        <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
        <span className="font-bold text-xs truncate max-w-[110px] sm:max-w-none text-slate-900 dark:text-slate-100 notranslate" translate="no">
          {getActiveLabel()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu (No full-screen pop-up!) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 p-2 text-xs backdrop-blur-xl animate-fade-in notranslate" translate="no">
          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-2 py-1 tracking-wider border-b border-slate-200 dark:border-slate-800/80 mb-1 flex items-center justify-between">
            <span>Período da Planilha</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono">2026</span>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleSelectMonth(2026, 10)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive('2026-10-01', '2026-10-31')
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Outubro / 2026</span>
              {isCurrentActive('2026-10-01', '2026-10-31') && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonth(2026, 9)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive('2026-09-01', '2026-09-30')
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Setembro / 2026</span>
              {isCurrentActive('2026-09-01', '2026-09-30') && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonth(2026, 8)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive('2026-08-01', '2026-08-31')
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Agosto / 2026</span>
              {isCurrentActive('2026-08-01', '2026-08-31') && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonth(2026, 7)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive('2026-07-01', '2026-07-31')
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Julho / 2026</span>
              {isCurrentActive('2026-07-01', '2026-07-31') && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectMonth(2026, 6)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive('2026-06-01', '2026-06-30')
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Junho / 2026</span>
              {isCurrentActive('2026-06-01', '2026-06-30') && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={handleSelectAllYear}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCurrentActive(undefined, undefined)
                  ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Ano 2026 Completo</span>
              {isCurrentActive(undefined, undefined) && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
            </button>
          </div>

          {/* Opção Personalizado */}
          <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition cursor-pointer ${
                isCustomActive || isCustomMode
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Personalizado</span>
              </div>
              {isCustomActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>

            {/* Inline Custom Date Range Picker */}
            {isCustomMode && (
              <form onSubmit={handleApplyCustom} className="mt-2 p-2 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                {/* Quick Interval Shortcuts */}
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Atalhos do Mês</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickInterval('quinzena1')}
                      className="py-1 px-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-cyan-700 dark:text-cyan-300 font-bold rounded border border-slate-200 dark:border-slate-800 text-center transition cursor-pointer shadow-sm"
                    >
                      01 a 15
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickInterval('quinzena2')}
                      className="py-1 px-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold rounded border border-slate-200 dark:border-slate-800 text-center transition cursor-pointer shadow-sm"
                    >
                      16 ao Fim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickInterval('mes')}
                      className="py-1 px-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-800 text-center transition cursor-pointer shadow-sm"
                    >
                      Mês Todo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Data Início</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-0.5">Data Fim</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-cyan-500 shadow-sm"
                    required
                  />
                </div>

                {validationError && (
                  <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-[10px] font-semibold leading-tight">
                    {validationError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition text-xs shadow cursor-pointer mt-1"
                >
                  Aplicar Período
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
