import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Header, AppActiveTab } from './components/Header.tsx';
import { KPIOverview } from './components/KPIOverview.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { SheetRTab } from './components/SheetRTab.tsx';
import { SheetVendasTab } from './components/SheetVendasTab.tsx';
import { OperationsMix } from './components/OperationsMix.tsx';
import { SalesTable } from './components/SalesTable.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import {
  SalesRecord,
  FilterState,
  parseSalesCSV,
  filterRecords,
  calculateKPIs,
  SheetRResult,
} from './lib/salesEngine.ts';
import {
  fetchPeriodUnified,
  getCachedPeriodEntry,
  getPeriodKey,
  initSheetCache,
  MonthDataState,
  CachedPeriodEntry,
  calculateDeterministicMetrics,
} from './lib/sheetCache.ts';
import { ShareProvider, useShareCard } from './context/ShareContext.tsx';
import { ShareCardRenderer } from './components/share/ShareCardRenderer.tsx';

const LOCAL_STORAGE_CSV_KEY = 'crediflow_custom_csv_2026';
const LOCAL_STORAGE_SYNC_KEY = 'crediflow_last_sync_2026';

const isValidCSV = (content: any): content is string => {
  return typeof content === 'string' && content.length > 200 && (content.includes(',') || content.includes(';'));
};

function AppContent() {
  const { updateShareData, lastShareResult } = useShareCard();

  // Dynamic calendar current month detection
  const defaultDates = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const monthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
    const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();
    const start = `${monthKey}-01`;
    const end = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`;
    return { monthKey, start, end };
  }, []);

  // Synchronous initialization from localStorage
  const [allRecords, setAllRecords] = useState<SalesRecord[]>(() => {
    try {
      const cachedCSV = localStorage.getItem(LOCAL_STORAGE_CSV_KEY);
      if (isValidCSV(cachedCSV)) {
        const parsed = parseSalesCSV(cachedCSV);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed reading localStorage on startup:', err);
    }
    return [];
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_CSV_KEY);
      return !isValidCSV(cached);
    } catch {
      return true;
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [lastSync, setLastSync] = useState<Date | null>(() => {
    try {
      const savedSync = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY);
      return savedSync ? new Date(savedSync) : null;
    } catch {
      return null;
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic filter state: opens in current month (2026-10)
  const [filters, setFilters] = useState<FilterState>({
    dataInicio: defaultDates.start,
    dataFim: defaultDates.end,
  });

  const selectedMonthKey = filters.dataInicio
    ? filters.dataInicio.substring(0, 7)
    : defaultDates.monthKey;

  const currentPeriodKey = getPeriodKey(selectedMonthKey, filters.dataInicio, filters.dataFim);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonthKey === '2026-06') return 'Junho / 2026';
    if (selectedMonthKey === '2026-07') return 'Julho / 2026';
    if (selectedMonthKey === '2026-08') return 'Agosto / 2026';
    if (selectedMonthKey === '2026-09') return 'Setembro / 2026';
    if (selectedMonthKey === '2026-10') return 'Outubro / 2026';
    return selectedMonthKey;
  }, [selectedMonthKey]);

  // Synchronous cache retrieval for instant render
  const [periodEntry, setPeriodEntry] = useState<CachedPeriodEntry | null>(() => {
    return getCachedPeriodEntry(selectedMonthKey, defaultDates.start, defaultDates.end);
  });

  const [monthState, setMonthState] = useState<MonthDataState>(() => {
    const cached = getCachedPeriodEntry(selectedMonthKey, defaultDates.start, defaultDates.end);
    return cached ? 'ready' : 'idle';
  });

  const [isAppsScriptLoading, setIsAppsScriptLoading] = useState<boolean>(false);
  const [appsScriptError, setAppsScriptError] = useState<string | null>(null);

  // Active period refs to prevent race conditions
  const activePeriodKeyRef = useRef<string>(currentPeriodKey);
  activePeriodKeyRef.current = currentPeriodKey;

  // Active Tab navigation (Comparativo menu removed)
  const [activeTab, setActiveTab] = useState<AppActiveTab>('sheet_r');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Background non-blocking preloader for prior 3 months
  const preloadPriorMonths = useCallback(async (baseMonth: string, records: SalesRecord[]) => {
    const parts = baseMonth.split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 10;

    // Wait 2.5s after current month is visible before starting background preload
    await new Promise((r) => setTimeout(r, 2500));

    for (let i = 1; i <= 3; i++) {
      const prevDate = new Date(y, m - 1 - i, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonthNum = prevDate.getMonth() + 1;
      const prevKey = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;
      const prevLastDay = new Date(prevYear, prevMonthNum, 0).getDate();
      const pStart = `${prevKey}-01`;
      const pEnd = `${prevKey}-${String(prevLastDay).padStart(2, '0')}`;

      const existing = getCachedPeriodEntry(prevKey, pStart, pEnd);
      if (!existing) {
        try {
          console.log(`[Background Preloader] Preloading ${prevKey}...`);
          await fetchPeriodUnified(prevKey, pStart, pEnd, records, false);
          // 1.5s interval between requests to avoid Apps Script document locks
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
          console.warn(`[Background Preloader] Preload failed for ${prevKey}:`, err);
        }
      }
    }
  }, []);

  // Fetch or retrieve unified period data
  const loadPeriodData = useCallback(async (
    month: string,
    dataInicio?: string,
    dataFim?: string,
    force = false
  ) => {
    const pKey = getPeriodKey(month, dataInicio, dataFim);

    // 1. Check valid cache if not forcing refresh
    if (!force) {
      const cached = getCachedPeriodEntry(month, dataInicio, dataFim);
      if (cached) {
        setPeriodEntry(cached);
        setMonthState('ready');
        setIsAppsScriptLoading(false);
        setAppsScriptError(null);
        return;
      }
    }

    // 2. Query online
    setIsAppsScriptLoading(true);
    setMonthState('syncing');
    setAppsScriptError(null);

    const res = await fetchPeriodUnified(month, dataInicio, dataFim, allRecords, force);

    // Guard against race conditions
    if (activePeriodKeyRef.current !== pKey) {
      return;
    }

    if (res.entry) {
      setPeriodEntry(res.entry);
      setMonthState('ready');
      setAppsScriptError(null);
      // Trigger background preloading of prior 3 months after current period loads
      preloadPriorMonths(month, allRecords);
    } else {
      setPeriodEntry(null);
      setMonthState('error');
      setAppsScriptError(res.error || 'Período não carregado.');
    }
    setIsAppsScriptLoading(false);
  }, [allRecords, preloadPriorMonths]);

  // Period change effect: check cache immediately or prompt sync
  useEffect(() => {
    const cached = getCachedPeriodEntry(selectedMonthKey, filters.dataInicio, filters.dataFim);
    if (cached) {
      setPeriodEntry(cached);
      setMonthState('ready');
      setIsAppsScriptLoading(false);
      setAppsScriptError(null);
      // Trigger background preload for prior months
      preloadPriorMonths(selectedMonthKey, allRecords);
    } else {
      // Uncached period: clear screen data, do not show previous month!
      setPeriodEntry(null);
      setMonthState('empty');
      setIsAppsScriptLoading(false);
      setAppsScriptError(null);
    }
  }, [selectedMonthKey, filters.dataInicio, filters.dataFim, allRecords, preloadPriorMonths]);

  // Load CSV data on mount if needed
  const loadData = useCallback(async (force = false) => {
    setIsLoadingData(true);
    try {
      let csvContent = !force ? localStorage.getItem(LOCAL_STORAGE_CSV_KEY) : null;

      if (!isValidCSV(csvContent)) {
        try {
          const response = await fetch('/api/data/default');
          if (response.ok) {
            const json = await response.json();
            if (json && isValidCSV(json.csv)) {
              csvContent = json.csv;
            }
          }
        } catch (fetchErr) {
          console.warn('API /api/data/default fetch failed, trying direct asset:', fetchErr);
        }

        if (!isValidCSV(csvContent)) {
          try {
            const directRes = await fetch('/assets/aistudio/2026_-_Acompanhamento_das_Vendas_4aafaa11');
            if (directRes.ok) {
              const text = await directRes.text();
              if (isValidCSV(text)) {
                csvContent = text;
              }
            }
          } catch (directErr) {
            console.warn('Direct asset fetch failed:', directErr);
          }
        }
      }

      if (isValidCSV(csvContent)) {
        localStorage.setItem(LOCAL_STORAGE_CSV_KEY, csvContent);
        const parsed = parseSalesCSV(csvContent);
        if (parsed && parsed.length > 0) {
          setAllRecords(parsed);
          const now = new Date();
          localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, now.toISOString());
          setLastSync(now);
        }
      }
    } catch (err: any) {
      console.error('Failed to load sales data:', err);
      showToast('Erro ao carregar dados: ' + (err?.message || 'Falha de rede'));
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (allRecords.length === 0) {
      loadData();
    } else {
      // Initial fetch for current month if not cached
      const cached = getCachedPeriodEntry(selectedMonthKey, filters.dataInicio, filters.dataFim);
      if (!cached) {
        loadPeriodData(selectedMonthKey, filters.dataInicio, filters.dataFim, false);
      }
    }
  }, [loadData, allRecords.length]);

  // Refresh handler: explicitly queries online and updates cache
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      showToast(`Sincronizando ${selectedMonthLabel} e salvando no cache unificado...`);
      await loadPeriodData(selectedMonthKey, filters.dataInicio, filters.dataFim, true);
      const now = new Date();
      localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, now.toISOString());
      setLastSync(now);
      showToast('Sincronização concluída com sucesso!');
    } catch (err: any) {
      console.error('Refresh error:', err);
      showToast('Erro ao atualizar: ' + (err?.message || 'Erro de rede'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Header period selection
  const handleSelectPeriod = (start?: string, end?: string) => {
    setFilters((prev) => ({
      ...prev,
      dataInicio: start,
      dataFim: end,
    }));
  };

  // Filtered records for current period from periodEntry or allRecords
  const filteredRecords = useMemo(() => {
    if (periodEntry && periodEntry.contratos && periodEntry.contratos.length > 0) {
      return filterRecords(periodEntry.contratos, filters);
    }
    return filterRecords(allRecords, filters);
  }, [periodEntry, allRecords, filters]);

  // KPIs
  const kpis = useMemo(() => {
    return calculateKPIs(filteredRecords);
  }, [filteredRecords]);

  // Previous month data from V5 cache for executive comparison
  const previousMonthKey = useMemo(() => {
    const parts = selectedMonthKey.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1], 10) || 10;
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = String(prevDate.getMonth() + 1).padStart(2, '0');
    return `${prevDate.getFullYear()}-${prevMonthStr}`;
  }, [selectedMonthKey]);

  const previousMonthData = useMemo(() => {
    const entry = getCachedPeriodEntry(previousMonthKey);
    return entry ? entry.sheetR : null;
  }, [previousMonthKey]);

  const toggleSemComissaoFilter = () => {
    setFilters((prev) => ({
      ...prev,
      apenasSemComissao: !prev.apenasSemComissao,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  const appsScriptData = periodEntry ? periodEntry.sheetR : null;

  const deterministicMetrics = useMemo(() => {
    if (!periodEntry?.sheetR) return null;
    return calculateDeterministicMetrics(
      periodEntry.sheetR,
      selectedMonthKey,
      previousMonthData,
      periodEntry?.vendas?.ranking
    );
  }, [periodEntry, selectedMonthKey, previousMonthData]);

  // Synchronize unified share data snapshot for all 14 shareable cards
  useEffect(() => {
    updateShareData({
      periodLabel: filters.dataInicio && filters.dataFim
        ? `${filters.dataInicio.split('-').reverse().join('/')} a ${filters.dataFim.split('-').reverse().join('/')}`
        : selectedMonthLabel,
      monthKey: selectedMonthKey,
      sheetRTotais: periodEntry?.sheetR?.totais || null,
      sheetRData: periodEntry?.sheetR || null,
      deterministicMetrics,
      kpis,
      allRecords: filteredRecords,
      vendasData: periodEntry?.vendas || null,
    });
  }, [
    periodEntry,
    filteredRecords,
    kpis,
    selectedMonthKey,
    selectedMonthLabel,
    filters.dataInicio,
    filters.dataFim,
    deterministicMetrics,
    updateShareData,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors">
        {/* Executive Header */}
        <Header
          totalRecords={allRecords.length}
          filteredCount={filteredRecords.length}
          lastSync={lastSync}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedMonthKey={selectedMonthKey}
          dataInicio={filters.dataInicio}
          dataFim={filters.dataFim}
          onSelectPeriod={handleSelectPeriod}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
          refreshError={appsScriptError}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-4 sm:space-y-5 pb-12">
          {/* Toast Alert */}
          {toastMessage && (
            <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white shadow-2xl animate-fade-in backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Global Filter Bar */}
          {activeTab !== 'sheet_r' && (
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              records={allRecords}
              onReset={resetFilters}
            />
          )}

          {/* Loading Spinner */}
          {isLoadingData ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
              <span className="text-sm font-semibold">Carregando dados da planilha Lívia Cred 2026...</span>
            </div>
          ) : (
            <>
              {/* Custom Date Range Badge */}
              {filters.dataInicio && filters.dataFim && (filters.dataInicio !== `${selectedMonthKey}-01` || (!filters.dataFim.endsWith('-30') && !filters.dataFim.endsWith('-31') && !filters.dataFim.endsWith('-28') && !filters.dataFim.endsWith('-29'))) && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-sm">
                  <span className="font-semibold">
                    Intervalo personalizado ativo ({filters.dataInicio.split('-').slice(1).reverse().join('/')} a {filters.dataFim.split('-').slice(1).reverse().join('/')}).
                  </span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    Cache de intervalo isolado
                  </span>
                </div>
              )}

              {/* Syncing State Indicator */}
              {isAppsScriptLoading && !periodEntry && (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-3 text-slate-700 dark:text-slate-300 shadow-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                  <span className="text-xs sm:text-sm font-semibold">Consultando dados oficiais da planilha para {selectedMonthLabel}...</span>
                </div>
              )}

              {/* Empty State for Uncached Period */}
              {!periodEntry && !isAppsScriptLoading && (
                <div className="py-16 px-6 text-center space-y-4 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto shadow-sm">
                  <AlertCircle className="w-10 h-10 text-cyan-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Período ainda não carregado</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Clique em Sincronizar para buscar os dados oficiais de {selectedMonthLabel} diretamente do Google Apps Script.
                    </p>
                  </div>
                  <button
                    onClick={() => loadPeriodData(selectedMonthKey, filters.dataInicio, filters.dataFim, true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 mx-auto shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sincronizar Período</span>
                  </button>
                </div>
              )}

              {/* Error Notice */}
              {!periodEntry && appsScriptError && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 text-slate-800 dark:text-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>Falha ao consultar período</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                    {appsScriptError}
                  </p>
                  <button
                    onClick={() => loadPeriodData(selectedMonthKey, filters.dataInicio, filters.dataFim, true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tentar novamente</span>
                  </button>
                </div>
              )}

              {/* TAB 1: 📊 Faturamento & Rentabilidade (Sheet R$) */}
              {activeTab === 'sheet_r' && periodEntry && (
                <div className="space-y-4">
                  <KPIOverview
                    kpis={kpis}
                    sheetRTotais={periodEntry.sheetR.totais}
                    onFilterSemComissao={toggleSemComissaoFilter}
                    isFilterSemComissaoActive={filters.apenasSemComissao}
                    isEmptyMonth={false}
                    lastSync={lastSync}
                  />

                  <SheetRTab
                    sheetRData={periodEntry.sheetR}
                    records={filteredRecords}
                    monthKey={selectedMonthKey}
                    previousMonthData={previousMonthData}
                  />
                </div>
              )}

              {/* TAB 2: 🎯 Acompanhamento de Metas & Produção (Sheet Vendas) */}
              {activeTab === 'sheet_vendas' && periodEntry && (
                <div className="space-y-4">
                  <SheetVendasTab
                    records={filteredRecords}
                    monthKey={selectedMonthKey}
                    vendasData={periodEntry.vendas}
                  />
                </div>
              )}

              {/* TAB 3: ⚖️ Mix de Operações */}
              {activeTab === 'mix_operacoes' && periodEntry && (
                <div className="space-y-4">
                  <OperationsMix records={filteredRecords} />
                </div>
              )}

              {/* TAB 4: 📑 Auditoria & Contratos */}
              {activeTab === 'contratos' && periodEntry && (
                <div className="space-y-4">
                  <SalesTable records={filteredRecords} defaultCollapsed={false} />
                </div>
              )}
            </>
          )}
        </main>

        {/* Offline Status */}
        <OfflineIndicator />

        {/* High-Resolution Share Feedback Toast */}
        {lastShareResult && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold shadow-2xl border backdrop-blur-xl animate-fade-in ${
              lastShareResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                : 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
            }`}
          >
            {lastShareResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <div>{lastShareResult.message}</div>
              {lastShareResult.dimensions && (
                <div className="text-[10px] font-mono opacity-80 mt-0.5">
                  Dimensões geradas: {lastShareResult.dimensions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dedicated 1600px High-Definition Offscreen Share Card Renderer */}
        <ShareCardRenderer />
      </div>
  );
}

export default function App() {
  initSheetCache();
  return (
    <ThemeProvider>
      <ShareProvider>
        <AppContent />
      </ShareProvider>
    </ThemeProvider>
  );
}

