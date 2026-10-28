import React from 'react';
import {
  FileSpreadsheet,
  BarChart3,
  Target,
  PieChart,
  ArrowLeftRight,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { PeriodDropdown } from './PeriodDropdown.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

export type AppActiveTab = 'sheet_r' | 'sheet_vendas' | 'mix_operacoes' | 'contratos';

interface HeaderProps {
  totalRecords: number;
  filteredCount: number;
  lastSync: Date | null;
  activeTab: AppActiveTab;
  setActiveTab: (tab: AppActiveTab) => void;
  selectedMonthKey?: string;
  dataInicio?: string;
  dataFim?: string;
  onSelectPeriod: (start?: string, end?: string) => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  refreshError?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  filteredCount,
  lastSync,
  activeTab,
  setActiveTab,
  selectedMonthKey,
  dataInicio,
  dataFim,
  onSelectPeriod,
  onRefreshData,
  isRefreshing = false,
  refreshError = null,
}) => {
  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'Não sincronizado';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} às ${hours}:${minutes}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          {/* Brand & Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-600 p-[2px] shadow-sm flex-shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-slate-900 via-cyan-900 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-cyan-200 bg-clip-text text-transparent whitespace-nowrap">
                    CrediFlow <span className="hidden min-[420px]:inline">Analytics</span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    2026
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {filteredCount !== totalRecords ? (
                  <span>
                    <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{filteredCount}</strong> de {totalRecords} contratos
                  </span>
                ) : (
                  <span>{totalRecords} contratos cadastrados</span>
                )}
                {lastSync && (
                  <span className="hidden sm:inline text-slate-400 dark:text-slate-500">
                    • Sincronizado: {formatSyncTime(lastSync)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('sheet_r')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sheet_r'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Faturamento R$</span>
            </button>
            <button
              onClick={() => setActiveTab('sheet_vendas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sheet_vendas'
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Metas & Vendas</span>
            </button>
            <button
              onClick={() => setActiveTab('mix_operacoes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'mix_operacoes'
                  ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Mix de Operações</span>
            </button>
            <button
              onClick={() => setActiveTab('contratos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'contratos'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contratos</span>
            </button>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Period Selector */}
            <PeriodDropdown
              dataInicio={dataInicio}
              dataFim={dataFim}
              onSelectPeriod={onSelectPeriod}
            />

            {/* Renamed Sync Action: 'Atualizar dados' with explicit state machine */}
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              title={
                isRefreshing
                  ? 'Atualizando dados...'
                  : refreshError
                  ? `Erro: ${refreshError}. Clique para tentar novamente.`
                  : lastSync
                  ? `Última sincronização: ${formatSyncTime(lastSync)}. Clique para atualizar dados.`
                  : 'Atualizar dados'
              }
              className={`min-h-[44px] min-w-[44px] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                refreshError
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-label="Atualizar dados"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? 'animate-spin text-cyan-500' : refreshError ? 'text-rose-500' : 'text-cyan-500'
                }`}
              />
              <span className="hidden md:inline font-bold">
                {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
              </span>
            </button>

            {/* Persistent Theme Selector */}
            <ThemeToggle />

            <PWAInstallButton />
          </div>
        </div>

        {/* Mobile Navigation Bar: Touch-optimized, horizontal scroll without page break */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-200 dark:border-slate-800/80 scrollbar-none -mx-3 px-3">
          <button
            onClick={() => setActiveTab('sheet_r')}
            className={`min-h-[44px] min-w-max px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'sheet_r'
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Faturamento R$</span>
          </button>
          <button
            onClick={() => setActiveTab('sheet_vendas')}
            className={`min-h-[44px] min-w-max px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'sheet_vendas'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Metas & Vendas</span>
          </button>
          <button
            onClick={() => setActiveTab('mix_operacoes')}
            className={`min-h-[44px] min-w-max px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'mix_operacoes'
                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Mix de Operações</span>
          </button>
          <button
            onClick={() => setActiveTab('contratos')}
            className={`min-h-[44px] min-w-max px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === 'contratos'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Contratos ({filteredCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
