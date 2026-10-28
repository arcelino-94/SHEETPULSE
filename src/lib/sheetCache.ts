import {
  SheetRResult,
  parseAppsScriptSheetR,
  calculateSheetR,
  parseCurrency,
  SalesRecord,
  calculateSheetVendasMatrix,
  calculateVendorGoalsRanking,
  getOfficialSheetVendasData,
  filterRecords,
} from './salesEngine.ts';

export const PERIOD_CACHE_KEY_V5 = 'crediflow_period_cache_v6_2026';
export const LEGACY_SHEET_CACHE_KEY = 'crediflow_sheet_cache_v5_2026';
export const ANALYSIS_CACHE_KEY = 'crediflow_analysis_cache_v1_2026';
const CACHE_VERSION_V5 = 6;
const ANALYSIS_VERSION = 1;

export type MonthDataState =
  | 'idle'
  | 'loading-cache'
  | 'ready'
  | 'empty'
  | 'error'
  | 'invalid-period'
  | 'syncing';

export interface MonthSyncSupport {
  supported: boolean;
  reason?: string;
}

export interface CachedPeriodEntry {
  period: { start: string; end: string; mes?: string };
  sheetR: SheetRResult;
  vendas?: any;
  contratos: SalesRecord[];
  fetchedAt: string; // ISO-8601
  sourceHash?: string;
  rawDados?: any;
}

export interface PeriodCacheStorageV5 {
  version: number;
  periods: Record<string, CachedPeriodEntry>;
}

export interface IntelligentAnalysis {
  resumo: string;
  situacao: 'positiva' | 'atencao' | 'critica';
  insightsPositivos: Array<{
    titulo: string;
    descricao: string;
    numeroBase: string;
    impacto?: string;
  }>;
  alertas: Array<{
    titulo: string;
    descricao: string;
    numeroBase: string;
    gravidade?: string;
  }>;
  recomendacoes: Array<{
    problemaOportunidade: string;
    numeroBase: string;
    acao: string;
    impactoPrioridade: string;
  }>;
  evidencias: string[];
}

export interface CachedAnalysisEntry {
  generatedAt: string;
  monthKey: string;
  metricsHash: string;
  promptVersion: number;
  analysis: IntelligentAnalysis;
  isFallback?: boolean;
}

export interface AnalysisCacheStorageV1 {
  version: number;
  months: Record<string, CachedAnalysisEntry>;
}

export interface DeterministicMetrics {
  periodo: string;
  vendasTotais: number; // B16
  j2: number; // B17
  dg: number; // B18
  gft: number; // B19
  sempre: number; // B20
  pagamentoTaxas: number; // B21
  lucro: number; // B22
  despesas: number; // B23
  lucroLiquido: number; // B24
  comissoesTotais: number; // B17+B18+B19+B20
  margemLiquida: number; // lucroLiquido / vendasTotais
  despesasSobreLucro: number; // despesas / lucro
  despesasSobreVendas: number; // despesas / vendasTotais
  mesAnterior?: {
    periodo: string;
    vendasTotais: number;
    taxas: number;
    comissoesTotais: number;
    lucro: number;
    despesas: number;
    lucroLiquido: number;
    margemLiquida: number;
    variacoes: {
      vendasTotaisDiff: number;
      vendasTotaisPercent: number;
      taxasDiff: number;
      taxasPercent: number;
      comissoesDiff: number;
      comissoesPercent: number;
      lucroDiff: number;
      lucroPercent: number;
      despesasDiff: number;
      despesasPercent: number;
      lucroLiquidoDiff: number;
      lucroLiquidoPercent: number;
      margemLiquidaDiff: number;
    };
  } | null;
  mediaTresMesesAnteriores?: {
    meses: string[];
    vendasTotais: number;
    taxas: number;
    lucro: number;
    despesas: number;
    lucroLiquido: number;
    margemLiquida: number;
    variacoes: {
      vendasTotaisDiff: number;
      vendasTotaisPercent: number;
      lucroDiff: number;
      lucroPercent: number;
      despesasDiff: number;
      despesasPercent: number;
      lucroLiquidoDiff: number;
      lucroLiquidoPercent: number;
      margemLiquidaDiff: number;
    };
  } | null;
  melhorDesempenho?: {
    nome: string;
    detalhe: string;
    valor: string;
  };
  piorDesempenho?: {
    nome: string;
    detalhe: string;
    valor: string;
  };
  conclusaoPrincipal?: string;
  alertasObjetivos?: string[];
  recomendacoesPraticas?: string[];
  participacaoComissoesNoLucro: {
    j2Percent: number;
    semprePercent: number;
    dgPercent: number;
    gftPercent: number;
    totalComissoesPercent: number;
    taxasPercent: number;
  };
  vendedores: Array<{
    nome: string;
    volumeTotal: number;
    volumeValidoMeta?: number;
    rentabilidade: number;
    faturamentoTotal: number;
    participacaoVolume: number;
  }>;
  operacoes?: Array<{
    operacao: string;
    volume: number;
    taxa: number;
    comissao: number;
    taxaMargin: number;
    comissaoMargin: number;
  }>;
}


/**
 * Validates the raw Apps Script API response according to Parte 2
 */
export function validateAppsScriptResponse(data: any, requestedMonth: string): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.ok !== true && data.success !== true) return false;
  if (!data.dados || typeof data.dados !== 'object') return false;

  const periodo = data.dados.periodo;
  if (!periodo || typeof periodo !== 'object') return false;
  if (periodo.mes && periodo.mes !== requestedMonth) return false;

  const funcionarios = data.dados.funcionarios;
  const totais = data.dados.totais;

  if (!Array.isArray(funcionarios) || funcionarios.length === 0) return false;
  if (!Array.isArray(totais) || totais.length === 0) return false;

  // Check that critical total rows exist
  let hasVendas = false;
  let hasLucro = false;
  let hasLucroLiquido = false;

  for (const row of totais) {
    if (Array.isArray(row)) {
      const label = String(row[0] || '').toUpperCase().trim();
      if (label.includes('VENDAS TOTAIS')) hasVendas = true;
      if (label === 'LUCRO') hasLucro = true;
      if (label.includes('LUCRO LÍQUIDO') || label.includes('LUCRO LIQUIDO')) hasLucroLiquido = true;
    }
  }

  // Must have at least the basic structure
  return hasVendas || hasLucro || hasLucroLiquido || totais.length >= 5;
}

/**
 * Generates unique cache key for any period or custom date range.
 * For full month: returns "YYYY-MM" (e.g. "2026-10")
 * For custom range: returns "custom:YYYY-MM-DD:YYYY-MM-DD"
 */
export function getPeriodKey(
  mes: string,
  dataInicio?: string,
  dataFim?: string
): string {
  const isFullMonth =
    (!dataInicio && !dataFim) ||
    (dataInicio?.endsWith('-01') &&
      (dataFim?.endsWith('-30') ||
        dataFim?.endsWith('-31') ||
        dataFim?.endsWith('-28') ||
        dataFim?.endsWith('-29')) &&
      dataInicio.substring(0, 7) === mes &&
      dataFim.substring(0, 7) === mes);

  if (isFullMonth) {
    return mes;
  }

  const s = dataInicio || `${mes}-01`;
  const e = dataFim || `${mes}-30`;
  return `custom:${s}:${e}`;
}

export function getPeriodCacheKey(
  mes: string,
  dataInicio?: string,
  dataFim?: string
): string {
  return getPeriodKey(mes, dataInicio, dataFim);
}

/**
 * Loads the complete V5 period cache storage from localStorage
 */
export function getPeriodCacheStorageV5(): PeriodCacheStorageV5 {
  try {
    const raw = localStorage.getItem(PERIOD_CACHE_KEY_V5);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.version === CACHE_VERSION_V5 || parsed.version === 5) && parsed.periods) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PeriodCacheV5] Failed to parse v5 cache from localStorage:', err);
  }
  return { version: CACHE_VERSION_V5, periods: {} };
}

/**
 * Saves the complete V5 period cache storage to localStorage
 */
export function savePeriodCacheStorageV5(storage: PeriodCacheStorageV5): void {
  try {
    localStorage.setItem(PERIOD_CACHE_KEY_V5, JSON.stringify(storage));
  } catch (err) {
    console.error('[PeriodCacheV5] Failed to save v5 cache to localStorage:', err);
  }
}

/**
 * Retrieves cached period entry if existing and valid
 */
export function getCachedPeriodEntry(
  mes: string,
  dataInicio?: string,
  dataFim?: string
): CachedPeriodEntry | null {
  const storage = getPeriodCacheStorageV5();
  const key = getPeriodKey(mes, dataInicio, dataFim);
  if (storage.periods[key]) {
    return storage.periods[key];
  }
  // Fallback for full month
  if (storage.periods[mes]) {
    return storage.periods[mes];
  }
  return null;
}

export function isPeriodEntryValid(entry: CachedPeriodEntry | null, mesKey: string): boolean {
  if (!entry || !entry.sheetR) return false;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Prior months remain valid indefinitely until manual sync
  if (mesKey < currentMonthKey) {
    return true;
  }

  // Current or future month: 24 hour validity
  try {
    const fetchedTime = new Date(entry.fetchedAt).getTime();
    const ageMs = now.getTime() - fetchedTime;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    return ageMs < maxAgeMs;
  } catch {
    return true;
  }
}

export function setCachedPeriodEntry(
  key: string,
  entry: CachedPeriodEntry
): void {
  const storage = getPeriodCacheStorageV5();
  storage.periods[key] = entry;
  savePeriodCacheStorageV5(storage);
}

// Backwards-compatible methods
export function getCachedPeriod(mes: string, dataInicio?: string, dataFim?: string) {
  const entry = getCachedPeriodEntry(mes, dataInicio, dataFim);
  if (!entry) return null;
  return {
    fetchedAt: entry.fetchedAt,
    sourcePeriod: { mes, inicio: entry.period.start, fim: entry.period.end },
    sheetR: entry.sheetR,
    rawDados: entry.rawDados,
  };
}

export function getCachedMonth(monthKey: string) {
  return getCachedPeriod(monthKey, undefined, undefined);
}

export function isPeriodCacheValid(mes: string, dataInicio?: string, dataFim?: string): boolean {
  const entry = getCachedPeriodEntry(mes, dataInicio, dataFim);
  return isPeriodEntryValid(entry, mes);
}

export function isMonthCacheValid(monthKey: string): boolean {
  return isPeriodCacheValid(monthKey, undefined, undefined);
}

export function initSheetCache(): PeriodCacheStorageV5 {
  const storage = getPeriodCacheStorageV5();
  savePeriodCacheStorageV5(storage);
  return storage;
}

export interface FetchUnifiedPeriodResult {
  entry: CachedPeriodEntry | null;
  fromCache: boolean;
  error?: string;
}

// In-memory Promise deduplication map
const inFlightRequests = new Map<string, Promise<FetchUnifiedPeriodResult>>();

/**
 * Unified fetch for any period:
 * 1. Queries Apps Script aba: "R$"
 * 2. Attempts Apps Script aba: "Vendas" or derives from contracts
 * 3. Filters contracts from allRecords
 * 4. Saves everything together into crediflow_period_cache_v5_2026
 */
export async function fetchPeriodUnified(
  mes: string,
  dataInicio?: string,
  dataFim?: string,
  allRecords: SalesRecord[] = [],
  forceRefresh = false
): Promise<FetchUnifiedPeriodResult> {
  const periodKey = getPeriodKey(mes, dataInicio, dataFim);

  // 1. Check valid cache if not forcing refresh
  if (!forceRefresh) {
    const cached = getCachedPeriodEntry(mes, dataInicio, dataFim);
    if (cached && isPeriodEntryValid(cached, mes)) {
      console.log(`[PeriodCacheV5] Cache HIT for ${periodKey}`);
      return { entry: cached, fromCache: true };
    }
  }

  // 2. Request deduplication
  if (inFlightRequests.has(periodKey)) {
    console.log(`[PeriodCacheV5] Sharing in-flight request for ${periodKey}`);
    return await inFlightRequests.get(periodKey)!;
  }

  const fetchPromise = (async (): Promise<FetchUnifiedPeriodResult> => {
    try {
      const start = dataInicio || `${mes}-01`;
      const year = parseInt(mes.split('-')[0], 10) || 2026;
      const monthNum = parseInt(mes.split('-')[1], 10) || 10;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const end = dataFim || `${mes}-${String(lastDay).padStart(2, '0')}`;

      const periodContratos = allRecords.length > 0
        ? filterRecords(allRecords, { dataInicio: start, dataFim: end })
        : [];

      // 1. Fetch Aba R$ from Google Apps Script
      const rPayload: Record<string, any> = {
        token: 'comissao-pwa-2026-seguranca-igara-95',
        mes,
        aba: 'R$',
      };
      if (dataInicio) rPayload.dataInicio = dataInicio;
      if (dataFim) rPayload.dataFim = dataFim;

      console.log(`[PeriodCacheV5] Requesting aba R$ for ${periodKey}:`, JSON.stringify(rPayload));
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let rResponse: Response;
      try {
        rResponse = await fetch('/api/apps-script/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rPayload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!rResponse.ok) {
        throw new Error(`Apps Script HTTP ${rResponse.status}: ${rResponse.statusText}`);
      }

      const rJson = await rResponse.json();

      if (rJson.ok === false || rJson.erro) {
        throw new Error(rJson.erro || 'Falha ao consultar período no Google Apps Script.');
      }

      if (!validateAppsScriptResponse(rJson, mes)) {
        throw new Error(`Resposta do Apps Script em formato inválido para o período ${periodKey}`);
      }

      const parsedSheetR = parseAppsScriptSheetR(rJson);
      if (!parsedSheetR) {
        throw new Error(`Não foi possível interpretar totais da planilha para ${periodKey}`);
      }

      // 2. Compile Matriz & Ranking directly from official Aba Vendas data
      const officialVendas = getOfficialSheetVendasData(mes);

      const entry: CachedPeriodEntry = {
        period: {
          start,
          end,
          mes,
        },
        sheetR: parsedSheetR,
        vendas: officialVendas,
        contratos: periodContratos,
        fetchedAt: new Date().toISOString(),
        sourceHash: `${periodKey}_${parsedSheetR.totais.pagos}_${parsedSheetR.totais.faturamentoTotal}`,
        rawDados: rJson.dados,
      };

      // Save to V5 cache
      setCachedPeriodEntry(periodKey, entry);

      // Also set bare mes if it was a full month
      if (periodKey !== mes && !dataInicio && !dataFim) {
        setCachedPeriodEntry(mes, entry);
      }

      return { entry, fromCache: false };
    } catch (err: any) {
      console.error(`[PeriodCacheV5] Fetch failed for ${periodKey}:`, err);
      const existing = getCachedPeriodEntry(mes, dataInicio, dataFim);
      if (existing) {
        return {
          entry: existing,
          fromCache: true,
          error: 'Falha na conexão ao vivo. Exibindo dados salvos no cache unificado.',
        };
      }

      // Fallback: If live network/lock error occurred, calculate fallback entry from local sales contracts
      const start = dataInicio || `${mes}-01`;
      const year = parseInt(mes.split('-')[0], 10) || 2026;
      const monthNum = parseInt(mes.split('-')[1], 10) || 10;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const end = dataFim || `${mes}-${String(lastDay).padStart(2, '0')}`;

      const periodContratos = allRecords.length > 0
        ? filterRecords(allRecords, { dataInicio: start, dataFim: end })
        : [];

      if (periodContratos.length > 0 || allRecords.length > 0) {
        console.log(`[PeriodCacheV5] Generating fallback entry from local contracts for ${periodKey}`);
        const fallbackSheetR = calculateSheetR(periodContratos, undefined, mes);
        const officialVendas = getOfficialSheetVendasData(mes);
        const fallbackEntry: CachedPeriodEntry = {
          period: { start, end, mes },
          sheetR: fallbackSheetR,
          vendas: officialVendas,
          contratos: periodContratos,
          fetchedAt: new Date().toISOString(),
          sourceHash: `fallback_${periodKey}`,
        };
        setCachedPeriodEntry(periodKey, fallbackEntry);
        return { entry: fallbackEntry, fromCache: false, error: 'Calculado a partir das vendas locais.' };
      }

      return {
        entry: null,
        fromCache: false,
        error: err?.message || 'Erro de comunicação com o Google Apps Script.',
      };
    } finally {
      inFlightRequests.delete(periodKey);
    }
  })();

  inFlightRequests.set(periodKey, fetchPromise);
  return await fetchPromise;
}

// Backwards-compatible fetchMonthWithCache and fetchPeriodWithCache
export async function fetchPeriodWithCache(
  mes: string,
  dataInicio?: string,
  dataFim?: string,
  forceRefresh = false
): Promise<{ data: SheetRResult | null; fromCache: boolean; error?: string }> {
  const res = await fetchPeriodUnified(mes, dataInicio, dataFim, [], forceRefresh);
  return {
    data: res.entry ? res.entry.sheetR : null,
    fromCache: res.fromCache,
    error: res.error,
  };
}

export async function fetchMonthWithCache(
  monthKey: string,
  forceRefresh = false
): Promise<{ data: SheetRResult | null; fromCache: boolean; error?: string }> {
  return fetchPeriodWithCache(monthKey, undefined, undefined, forceRefresh);
}

/**
 * Computes deterministic metrics object for the period and prior period comparison
 */
export function calculateDeterministicMetrics(
  sheetRData: SheetRResult,
  monthKey: string,
  previousMonthData?: SheetRResult | null,
  vendorGoalsRanking?: any[],
  topMargins?: { topTaxaMargins: any[]; topComissaoMargins: any[] }
): DeterministicMetrics {
  const totais = sheetRData.totais;

  const vendasTotais = totais.pagos || 0; // B16
  const j2 = totais.comissaoJ2 || 0; // B17
  const dg = totais.comissaoDg || 0; // B18
  const gft = totais.comissaoGft || 0; // B19
  const sempre = totais.comissaoSempre || 0; // B20
  const pagamentoTaxas = totais.taxas || 0; // B21
  const lucro = totais.faturamentoTotal || 0; // B22
  const despesas = totais.despesasGerais || 0; // B23
  const lucroLiquido = totais.lucroLiquido || 0; // B24
  const comissoesTotais = totais.comissaoTotal || j2 + dg + gft + sempre;

  const margemLiquida = vendasTotais > 0 ? Math.round((lucroLiquido / vendasTotais) * 1000) / 1000 : 0;
  const despesasSobreLucro = lucro > 0 ? Math.round((despesas / lucro) * 1000) / 1000 : 0;
  const despesasSobreVendas = vendasTotais > 0 ? Math.round((despesas / vendasTotais) * 1000) / 1000 : 0;

  // Commission shares in profit
  const participacaoComissoesNoLucro = {
    j2Percent: lucro > 0 ? Math.round((j2 / lucro) * 1000) / 10 : 0,
    semprePercent: lucro > 0 ? Math.round((sempre / lucro) * 1000) / 10 : 0,
    dgPercent: lucro > 0 ? Math.round((dg / lucro) * 1000) / 10 : 0,
    gftPercent: lucro > 0 ? Math.round((gft / lucro) * 1000) / 10 : 0,
    totalComissoesPercent: lucro > 0 ? Math.round((comissoesTotais / lucro) * 1000) / 10 : 0,
    taxasPercent: lucro > 0 ? Math.round((pagamentoTaxas / lucro) * 1000) / 10 : 0,
  };

  // Vendor performance summary
  const vendedores = (sheetRData.funcionarios || []).map((f) => {
    const goalItem = (vendorGoalsRanking || []).find(
      (v) => v.vendedor.toLowerCase() === f.vendedor.toLowerCase()
    );
    const volumeValido = goalItem ? goalItem.volumeValidoMeta : f.pagos;
    return {
      nome: f.vendedor,
      volumeTotal: f.pagos,
      volumeValidoMeta: volumeValido,
      rentabilidade: f.rentabilidade,
      faturamentoTotal: f.faturamentoTotal,
      participacaoVolume: vendasTotais > 0 ? Math.round((f.pagos / vendasTotais) * 1000) / 10 : 0,
    };
  });

  // Prior month comparison
  let mesAnterior: DeterministicMetrics['mesAnterior'] = null;
  if (previousMonthData && previousMonthData.totais) {
    const prevT = previousMonthData.totais;
    const pVendas = prevT.pagos || 0;
    const pTaxas = prevT.taxas || 0;
    const pComissoes = prevT.comissaoTotal || 0;
    const pLucro = prevT.faturamentoTotal || 0;
    const pDespesas = prevT.despesasGerais || 0;
    const pLucroLiquido = prevT.lucroLiquido || 0;
    const pMargem = pVendas > 0 ? pLucroLiquido / pVendas : 0;

    const calcDiffAndPercent = (curr: number, prev: number) => {
      const diff = Math.round((curr - prev) * 100) / 100;
      const percent = prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
      return { diff, percent };
    };

    const vVendas = calcDiffAndPercent(vendasTotais, pVendas);
    const vTaxas = calcDiffAndPercent(pagamentoTaxas, pTaxas);
    const vComissoes = calcDiffAndPercent(comissoesTotais, pComissoes);
    const vLucro = calcDiffAndPercent(lucro, pLucro);
    const vDespesas = calcDiffAndPercent(despesas, pDespesas);
    const vLucroLiquido = calcDiffAndPercent(lucroLiquido, pLucroLiquido);
    const margemDiff = Math.round((margemLiquida - pMargem) * 1000) / 10; // in percentage points

    mesAnterior = {
      periodo: previousMonthData.periodoInicio || 'Mês Anterior',
      vendasTotais: pVendas,
      taxas: pTaxas,
      comissoesTotais: pComissoes,
      lucro: pLucro,
      despesas: pDespesas,
      lucroLiquido: pLucroLiquido,
      margemLiquida: Math.round(pMargem * 1000) / 1000,
      variacoes: {
        vendasTotaisDiff: vVendas.diff,
        vendasTotaisPercent: vVendas.percent,
        taxasDiff: vTaxas.diff,
        taxasPercent: vTaxas.percent,
        comissoesDiff: vComissoes.diff,
        comissoesPercent: vComissoes.percent,
        lucroDiff: vLucro.diff,
        lucroPercent: vLucro.percent,
        despesasDiff: vDespesas.diff,
        despesasPercent: vDespesas.percent,
        lucroLiquidoDiff: vLucroLiquido.diff,
        lucroLiquidoPercent: vLucroLiquido.percent,
        margemLiquidaDiff: margemDiff,
      },
    };
  }

  // 3-Month Prior Average Comparison (when available in V5 cache)
  let mediaTresMesesAnteriores: DeterministicMetrics['mediaTresMesesAnteriores'] = null;
  try {
    const storageV5 = getPeriodCacheStorageV5();
    const parts = monthKey.split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = parseInt(parts[1], 10) || 10;
    const prior3Keys: string[] = [];
    const prior3Data: SheetRResult[] = [];

    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, m - 1 - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      prior3Keys.push(k);
      const entry = storageV5.periods[k];
      if (entry && entry.sheetR && entry.sheetR.totais) {
        prior3Data.push(entry.sheetR);
      }
    }

    if (prior3Data.length > 0) {
      const count = prior3Data.length;
      const sumVendas = prior3Data.reduce((acc, p) => acc + (p.totais.pagos || 0), 0);
      const sumTaxas = prior3Data.reduce((acc, p) => acc + (p.totais.taxas || 0), 0);
      const sumLucro = prior3Data.reduce((acc, p) => acc + (p.totais.faturamentoTotal || 0), 0);
      const sumDespesas = prior3Data.reduce((acc, p) => acc + (p.totais.despesasGerais || 0), 0);
      const sumLiquido = prior3Data.reduce((acc, p) => acc + (p.totais.lucroLiquido || 0), 0);

      const avgVendas = Math.round((sumVendas / count) * 100) / 100;
      const avgTaxas = Math.round((sumTaxas / count) * 100) / 100;
      const avgLucro = Math.round((sumLucro / count) * 100) / 100;
      const avgDespesas = Math.round((sumDespesas / count) * 100) / 100;
      const avgLiquido = Math.round((sumLiquido / count) * 100) / 100;
      const avgMargem = avgVendas > 0 ? avgLiquido / avgVendas : 0;

      const calcDiffAndPercent = (curr: number, prev: number) => {
        const diff = Math.round((curr - prev) * 100) / 100;
        const percent = prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
        return { diff, percent };
      };

      const vVendas = calcDiffAndPercent(vendasTotais, avgVendas);
      const vLucro = calcDiffAndPercent(lucro, avgLucro);
      const vDespesas = calcDiffAndPercent(despesas, avgDespesas);
      const vLiquido = calcDiffAndPercent(lucroLiquido, avgLiquido);
      const margemDiff = Math.round((margemLiquida - avgMargem) * 1000) / 10;

      mediaTresMesesAnteriores = {
        meses: prior3Keys.slice(0, count),
        vendasTotais: avgVendas,
        taxas: avgTaxas,
        lucro: avgLucro,
        despesas: avgDespesas,
        lucroLiquido: avgLiquido,
        margemLiquida: Math.round(avgMargem * 1000) / 1000,
        variacoes: {
          vendasTotaisDiff: vVendas.diff,
          vendasTotaisPercent: vVendas.percent,
          lucroDiff: vLucro.diff,
          lucroPercent: vLucro.percent,
          despesasDiff: vDespesas.diff,
          despesasPercent: vDespesas.percent,
          lucroLiquidoDiff: vLiquido.diff,
          lucroLiquidoPercent: vLiquido.percent,
          margemLiquidaDiff: margemDiff,
        },
      };
    }
  } catch (err) {
    console.warn('[DeterministicMetrics] Error calculating 3m average:', err);
  }

  // Best and Worst Performance Highlights
  const sortedByVolume = [...vendedores].sort((a, b) => b.volumeTotal - a.volumeTotal);
  const bestPerformer = sortedByVolume[0];
  const activeWithZero = sortedByVolume.filter((v) => v.volumeTotal === 0);
  const lowestPerformer = activeWithZero.length > 0
    ? activeWithZero[0]
    : sortedByVolume[sortedByVolume.length - 1];

  const melhorDesempenho = bestPerformer
    ? {
        nome: bestPerformer.nome,
        detalhe: `Maior volume de vendas com ${bestPerformer.participacaoVolume}% do total da loja`,
        valor: `R$ ${bestPerformer.volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      }
    : undefined;

  const piorDesempenho = lowestPerformer && lowestPerformer.nome !== bestPerformer?.nome
    ? {
        nome: lowestPerformer.nome,
        detalhe: lowestPerformer.volumeTotal === 0 ? 'Sem produção registrada no período' : 'Menor volume registrado no período',
        valor: `R$ ${lowestPerformer.volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      }
    : undefined;

  // Alerts
  const alertasObjetivos: string[] = [];
  if (despesasSobreLucro > 0.35) {
    alertasObjetivos.push(`Despesas consom ${Math.round(despesasSobreLucro * 100)}% do lucro bruto, acima do teto recomendado de 30%.`);
  }
  if (margemLiquida < 0.20 && vendasTotais > 0) {
    alertasObjetivos.push(`Margem líquida de ${(margemLiquida * 100).toFixed(1)}% está abaixo do patamar de segurança operacional (20%).`);
  }
  if (bestPerformer && bestPerformer.participacaoVolume > 40) {
    alertasObjetivos.push(`Alta concentração: ${bestPerformer.nome} responde por ${bestPerformer.participacaoVolume}% das vendas totais.`);
  }

  // Recommendations
  const recomendacoesPraticas: string[] = [
    'Priorizar operações com maior margem de taxa de assessoria para elevar o lucro bruto sem inflar custos.',
    'Monitorar despesas fixas para assegurar margem líquida superior a 25% nas próximas semanas.',
    'Equilibrar a distribuição da esteira comercial para reduzir dependência da vendedora líder.',
  ];

  const conclusaoPrincipal = `O período ${monthKey} encerrou com volume de vendas de R$ ${vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, gerando Lucro Bruto de R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e Lucro Líquido de R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (margem de ${(margemLiquida * 100).toFixed(1)}%).`;

  return {
    periodo: monthKey,
    vendasTotais,
    j2,
    dg,
    gft,
    sempre,
    pagamentoTaxas,
    lucro,
    despesas,
    lucroLiquido,
    comissoesTotais,
    margemLiquida,
    despesasSobreLucro,
    despesasSobreVendas,
    mesAnterior,
    mediaTresMesesAnteriores,
    melhorDesempenho,
    piorDesempenho,
    conclusaoPrincipal,
    alertasObjetivos,
    recomendacoesPraticas,
    participacaoComissoesNoLucro,
    vendedores,
    operacoes: topMargins
      ? [...(topMargins.topTaxaMargins || []), ...(topMargins.topComissaoMargins || [])]
      : undefined,
  };
}

/**
 * Creates a deterministic hash of the metrics to detect any numbers changes
 */
export function hashDeterministicMetrics(metrics: DeterministicMetrics): string {
  const coreString = `${metrics.periodo}_${metrics.vendasTotais}_${metrics.lucro}_${metrics.despesas}_${metrics.lucroLiquido}_${metrics.j2}_${metrics.sempre}_${metrics.pagamentoTaxas}`;
  let hash = 0;
  for (let i = 0; i < coreString.length; i++) {
    const char = coreString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

/**
 * Gets cached analysis storage from localStorage
 */
export function getAnalysisCacheStorage(): AnalysisCacheStorageV1 {
  try {
    const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === ANALYSIS_VERSION && parsed.months) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AnalysisCache] Failed to parse analysis cache:', err);
  }
  return { version: ANALYSIS_VERSION, months: {} };
}

/**
 * Saves analysis cache storage to localStorage
 */
export function saveAnalysisCacheStorage(storage: AnalysisCacheStorageV1): void {
  try {
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(storage));
  } catch (err) {
    console.error('[AnalysisCache] Failed to save analysis cache:', err);
  }
}

/**
 * Retrieves cached analysis for a specific month
 */
export function getCachedAnalysis(monthKey: string): CachedAnalysisEntry | null {
  const storage = getAnalysisCacheStorage();
  return storage.months[monthKey] || null;
}

/**
 * Saves analysis to cache
 */
export function setCachedAnalysis(
  monthKey: string,
  metricsHash: string,
  analysis: IntelligentAnalysis,
  isFallback = false
): void {
  const storage = getAnalysisCacheStorage();
  storage.months[monthKey] = {
    generatedAt: new Date().toISOString(),
    monthKey,
    metricsHash,
    promptVersion: 1,
    analysis,
    isFallback,
  };
  saveAnalysisCacheStorage(storage);
}

/**
 * Generates deterministic fallback analysis if Gemini is not reachable or not configured
 */
export function generateDeterministicFallbackAnalysis(
  metrics: DeterministicMetrics
): IntelligentAnalysis {
  const margemPercent = Math.round(metrics.margemLiquida * 100);
  const despesaLucroPercent = Math.round(metrics.despesasSobreLucro * 100);

  let situacao: 'positiva' | 'atencao' | 'critica' = 'positiva';
  if (metrics.lucroLiquido <= 0) {
    situacao = 'critica';
  } else if (despesaLucroPercent > 40 || margemPercent < 20) {
    situacao = 'atencao';
  }

  // Find top vendor
  const sortedVendedores = [...(metrics.vendedores || [])].sort(
    (a, b) => (b.volumeValidoMeta || b.volumeTotal) - (a.volumeValidoMeta || a.volumeTotal)
  );
  const topVendor = sortedVendedores[0];

  const insightsPositivos: IntelligentAnalysis['insightsPositivos'] = [];
  if (topVendor) {
    insightsPositivos.push({
      titulo: `Destaque Comercial: ${topVendor.nome}`,
      descricao: `A vendedora ${topVendor.nome} liderou a produção com ${topVendor.participacaoVolume}% de participação do volume total.`,
      numeroBase: `R$ ${topVendor.volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      impacto: 'Alto impacto no faturamento',
    });
  }

  if (metrics.lucroLiquido > 0) {
    insightsPositivos.push({
      titulo: 'Resultado Líquido Positivo',
      descricao: `A operação encerrou o período com margem líquida de ${margemPercent}% sobre o volume total transacionado.`,
      numeroBase: `R$ ${metrics.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      impacto: 'Geração de caixa saudável',
    });
  }

  if (metrics.comissoesTotais > 0) {
    insightsPositivos.push({
      titulo: 'Comissões Recebidas das Promotoras',
      descricao: `Receita complementar de promotoras somou ${metrics.participacaoComissoesNoLucro.totalComissoesPercent}% do lucro bruto.`,
      numeroBase: `R$ ${metrics.comissoesTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      impacto: 'Diversificação de receita',
    });
  }

  const alertas: IntelligentAnalysis['alertas'] = [];
  if (despesaLucroPercent >= 30) {
    alertas.push({
      titulo: 'Comprometimento de Lucro com Despesas',
      descricao: `As despesas operacionais consumiram ${despesaLucroPercent}% de todo o lucro bruto apurado no período.`,
      numeroBase: `R$ ${metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      gravidade: despesaLucroPercent > 45 ? 'Alta' : 'Média',
    });
  }

  if (sortedVendedores.length > 0 && topVendor && topVendor.participacaoVolume > 45) {
    alertas.push({
      titulo: 'Concentração de Volume em Vendedora',
      descricao: `Mais de ${topVendor.participacaoVolume}% das vendas estão concentradas em um único vendedor (${topVendor.nome}).`,
      numeroBase: `${topVendor.participacaoVolume}% do total`,
      gravidade: 'Média',
    });
  }

  const recomendacoes: IntelligentAnalysis['recomendacoes'] = [
    {
      problemaOportunidade: 'Alavancagem de Margem Líquida',
      numeroBase: `Margem atual: ${margemPercent}%`,
      acao: 'Priorizar operações com maior taxa de assessoria e menor custo administrativo para expandir margem.',
      impactoPrioridade: 'Alta Prioridade',
    },
    {
      problemaOportunidade: 'Gestão de Custos Fixos e Variáveis',
      numeroBase: `Despesas: R$ ${metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      acao: 'Auditar despesas administrativas e custos de digitação para manter a relação despesa/lucro abaixo de 30%.',
      impactoPrioridade: 'Média Prioridade',
    },
  ];

  const evidencias = [
    `Vendas Totais apuradas em R$ ${metrics.vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Lucro Bruto (Taxas + Comissões) de R$ ${metrics.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Despesas Gerais consolidadas em R$ ${metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `Lucro Líquido final de R$ ${metrics.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  ];

  return {
    resumo: `No período ${metrics.periodo}, a Lívia Cred registrou R$ ${metrics.vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas totais, gerando Lucro Bruto de R$ ${metrics.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e Lucro Líquido de R$ ${metrics.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} após dedução de R$ ${metrics.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em despesas.`,
    situacao,
    insightsPositivos,
    alertas,
    recomendacoes,
    evidencias,
  };
}

/**
 * Fetches or re-uses period intelligent analysis with caching by metrics hash (Parte 7)
 */
export async function fetchAnalysisWithCache(
  metrics: DeterministicMetrics,
  forceRefresh = false
): Promise<{ analysis: IntelligentAnalysis; fromCache: boolean; isFallback: boolean }> {
  const monthKey = metrics.periodo;
  const currentHash = hashDeterministicMetrics(metrics);

  // 1. Check cache
  if (!forceRefresh) {
    const cached = getCachedAnalysis(monthKey);
    if (cached && cached.metricsHash === currentHash && cached.analysis) {
      console.log(`[AnalysisCache] Reusing cached analysis for ${monthKey} (hash: ${currentHash})`);
      return { analysis: cached.analysis, fromCache: true, isFallback: Boolean(cached.isFallback) };
    }
  }

  // 2. Fetch from backend Gemini endpoint
  try {
    console.log(`[AnalysisCache] Requesting Gemini analysis for ${monthKey}`);
    const res = await fetch('/api/gemini/analyze-period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analysis && data.analysis.resumo) {
        setCachedAnalysis(monthKey, currentHash, data.analysis, false);
        return { analysis: data.analysis, fromCache: false, isFallback: false };
      }
    }
  } catch (err) {
    console.warn('[AnalysisCache] Remote Gemini analysis call failed, falling back to deterministic generation:', err);
  }

  // 3. Deterministic fallback if Gemini unavailable
  const fallback = generateDeterministicFallbackAnalysis(metrics);
  setCachedAnalysis(monthKey, currentHash, fallback, true);
  return { analysis: fallback, fromCache: false, isFallback: true };
}

// Backwards-compatibility aliases for legacy tests and scripts
export const SHEET_CACHE_KEY = PERIOD_CACHE_KEY_V5;
export const getSheetCacheStorage = getPeriodCacheStorageV5;
export const saveSheetCacheStorage = savePeriodCacheStorageV5;
export function setCachedMonth(monthKey: string, data: any, period?: any, rawDados?: any): void {
  setCachedPeriodEntry(monthKey, {
    period: period ? { start: period.inicio, end: period.fim, mes: monthKey } : { start: `${monthKey}-01`, end: `${monthKey}-31`, mes: monthKey },
    sheetR: data,
    vendas: null,
    contratos: [],
    fetchedAt: new Date().toISOString(),
    sourceHash: monthKey,
    rawDados,
  });
}
export function isMonthSyncSupported(_mes: string): { supported: true } {
  return { supported: true };
}

