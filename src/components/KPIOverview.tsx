import React, { useRef } from 'react';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Wallet,
  PiggyBank,
  Clock,
} from 'lucide-react';
import { DashboardKPIs, SheetRResult, formatCurrencyBR } from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface KPIOverviewProps {
  kpis: DashboardKPIs;
  sheetRTotais?: SheetRResult['totais'];
  onFilterSemComissao: () => void;
  isFilterSemComissaoActive?: boolean;
  isEmptyMonth?: boolean;
  lastSync?: Date | null;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({
  kpis,
  sheetRTotais,
  onFilterSemComissao,
  isFilterSemComissaoActive,
  isEmptyMonth = false,
  lastSync,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasData = !isEmptyMonth && Boolean(sheetRTotais);
  const volumeLiberado = hasData ? (sheetRTotais?.pagos ?? 0) : 0;
  const taxas = hasData ? (sheetRTotais?.taxas ?? 0) : 0;
  const comissoes = hasData ? (sheetRTotais?.comissaoTotal ?? 0) : 0;
  const lucroBruto = hasData ? (sheetRTotais?.faturamentoTotal ?? 0) : 0;
  const despesas = hasData ? (sheetRTotais?.despesasGerais ?? 0) : 0;
  const lucroLiquido = hasData ? (sheetRTotais?.lucroLiquido ?? (lucroBruto - despesas)) : 0;

  const displayVal = (val: number) => {
    if (!hasData) return '--';
    return formatCurrencyBR(val);
  };

  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'Não sincronizado';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month} às ${hours}:${minutes}`;
  };

  return (
    <div ref={containerRef} className="space-y-3 p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Header bar: Title + Last Sync Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-cyan-500' : 'bg-slate-400'}`} />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Visão Geral Financeira da Loja
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {lastSync && (
            <div className="flex items-center gap-1 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>Última sincronização: {formatSyncTime(lastSync)}</span>
            </div>
          )}
          <ShareCardButton cardId="overview" />
        </div>
      </div>

      {/* 4 PRIMARY EXECUTIVE KPIS - Clean multi-line mobile typography */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Volume Liberado */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                Volume Liberado
              </span>
              <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono break-words">
              {displayVal(volumeLiberado)}
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {hasData ? (
              <span>
                <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{kpis.contratosPagos}</strong> contratos pagos
              </span>
            ) : (
              <span>Sem dados</span>
            )}
          </div>
        </div>

        {/* 2. Lucro Bruto / Faturamento Loja */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                Lucro Bruto (Faturamento)
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono break-words">
              {displayVal(lucroBruto)}
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {hasData && volumeLiberado > 0 ? (
              <span>Margem Bruta: {Math.round((lucroBruto / volumeLiberado) * 1000) / 10}%</span>
            ) : (
              <span>Taxas + Comissões</span>
            )}
          </div>
        </div>

        {/* 3. Despesas Operacionais e Administrativas */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                Despesas Operacionais
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400 tracking-tight font-mono break-words">
              {hasData ? `-${formatCurrencyBR(despesas)}` : '--'}
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Custos fixos e operacionais</span>
          </div>
        </div>

        {/* 4. Lucro Líquido Final */}
        <div
          className={`rounded-2xl p-3 sm:p-4 shadow-sm transition border flex flex-col justify-between ${
            hasData && lucroLiquido >= 0
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
              : hasData && lucroLiquido < 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 leading-tight">
                Lucro Líquido Final
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-base sm:text-xl font-black tracking-tight font-mono break-words ${
                hasData && lucroLiquido >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : hasData && lucroLiquido < 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {displayVal(lucroLiquido)}
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Resultado líquido da operação</span>
          </div>
        </div>
      </div>

      {/* SECONDARY REVENUE BREAKDOWN ROW - 3 stacked rows on mobile to prevent label/value collision */}
      <div className="bg-slate-50/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Totais Recebidos no Período
          </span>
          <ShareCardButton cardId="totais" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Taxas Recebidas */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-950/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Taxas Recebidas (Assessoria):</span>
            <strong className="text-amber-700 dark:text-amber-300 font-mono font-bold ml-2">
              {displayVal(taxas)}
            </strong>
          </div>

          {/* Comissões Recebidas */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-950/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Comissões Recebidas (Promotoras):</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold ml-2">
              {displayVal(comissoes)}
            </strong>
          </div>

          {/* Ticket Médio */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-950/40 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Ticket Médio p/ Contrato:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono font-semibold ml-2">
              {hasData ? formatCurrencyBR(kpis.ticketMedioEmprestimo) : '--'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
