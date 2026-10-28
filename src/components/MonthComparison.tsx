import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  DollarSign,
  Users,
  Percent,
  Table as TableIcon,
  Sparkles,
  Minus,
} from 'lucide-react';
import {
  SalesRecord,
  compareMonths,
  getMonthlyHistory,
  getVendorMonthComparison,
  formatCurrencyBR,
  MonthComparisonResult,
  VariationResult,
} from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface MonthComparisonProps {
  records: SalesRecord[];
}

export const MonthComparison: React.FC<MonthComparisonProps> = ({ records }) => {
  const compTableRef = useRef<HTMLDivElement>(null);
  const vendorCompRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'vs_previous' | 'vs_avg_3m' | 'vs_avg_6m' | 'quarter'>('vs_previous');
  const [showHistoryTable, setShowHistoryTable] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const history = getMonthlyHistory(records);
  const significantMonths = history.filter((h) => h.contratos >= 5);

  const curMonthKey = selectedMonth || (significantMonths[0]?.periodo ?? '2026-10');
  const curMonthIdx = significantMonths.findIndex((m) => m.periodo === curMonthKey);
  const prevMonthKey = curMonthIdx < significantMonths.length - 1 ? significantMonths[curMonthIdx + 1]?.periodo : '';

  const comp: MonthComparisonResult = compareMonths(records, mode, curMonthKey);
  const vendorComparison = getVendorMonthComparison(records, curMonthKey, prevMonthKey);

  /**
   * Semantics:
   * - Cyan = actions/new
   * - Green = positive results
   * - Amber = attention/warning
   * - Red = negative/loss/pending
   * Negative numbers NEVER in green!
   */
  const renderDeltaBadge = (v: VariationResult, invert = false) => {
    let kind = v.kind;
    if (invert) {
      if (kind === 'positive') kind = 'negative';
      else if (kind === 'negative') kind = 'positive';
    }

    let color = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    let Icon = Minus;

    if (kind === 'positive') {
      color = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30';
      Icon = TrendingUp;
    } else if (kind === 'negative') {
      color = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30';
      Icon = TrendingDown;
    } else if (kind === 'new') {
      color = 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30';
      Icon = Sparkles;
    }

    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
          <Icon className="w-3 h-3" />
          <span>{v.text}</span>
        </span>
        <span
          className={`text-[10px] font-mono font-semibold ${
            v.absoluteDiff > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : v.absoluteDiff < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-400'
          }`}
        >
          {v.absoluteDiff > 0 ? '+' : ''}
          {formatCurrencyBR(v.absoluteDiff)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-bold">
              Comparativo Mensal
            </span>
            {significantMonths.length > 0 && (
              <select
                value={curMonthKey}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-cyan-700 dark:text-cyan-300 focus:outline-none cursor-pointer"
              >
                {significantMonths.map((m) => (
                  <option key={m.periodo} value={m.periodo}>
                    Base: {m.label} ({m.contratos} contratos)
                  </option>
                ))}
              </select>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{comp.title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{comp.subTitle}</p>
        </div>

        {/* Quick Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setMode('vs_previous')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              mode === 'vs_previous'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            Mês vs Anterior
          </button>
          <button
            onClick={() => setMode('vs_avg_3m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              mode === 'vs_avg_3m'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            vs Média 3M
          </button>
          <button
            onClick={() => setMode('vs_avg_6m')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition ${
              mode === 'vs_avg_6m'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
            }`}
          >
            vs Média 6M
          </button>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div
        ref={compTableRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Demonstrativo Comparativo Lado a Lado
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
              {comp.currentLabel} vs {comp.previousLabel}
            </span>
            <ShareCardButton targetRef={compTableRef} cardTitle="Comparativo Mensal Direct" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Métrica</th>
                <th className="py-3 px-4 text-right font-black text-cyan-700 dark:text-cyan-400">
                  {comp.currentLabel} (Atual)
                </th>
                <th className="py-3 px-4 text-right font-semibold text-slate-600 dark:text-slate-400">
                  {comp.previousLabel}
                </th>
                <th className="py-3 px-4 text-right">Variação (%) & Dif. Absoluta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {/* Row 1: Vendas Pagas */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Vendas Pagas (Volume Liberado)</span>
                </td>
                <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white text-sm sm:text-base font-mono">
                  {formatCurrencyBR(comp.current.vendasTotais)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-medium font-mono">
                  {formatCurrencyBR(comp.previous.vendasTotais)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderDeltaBadge(comp.variations.vendasTotais)}
                </td>
              </tr>

              {/* Row 2: Taxas Recebidas */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-300 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Taxas Recebidas (Assessoria)</span>
                </td>
                <td className="py-3 px-4 text-right font-black text-amber-700 dark:text-amber-300 text-sm sm:text-base font-mono">
                  {formatCurrencyBR(comp.current.taxas)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-medium font-mono">
                  {formatCurrencyBR(comp.previous.taxas)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderDeltaBadge(comp.variations.taxas)}
                </td>
              </tr>

              {/* Row 3: Comissões Recebidas */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Comissões Recebidas (Promotoras)</span>
                </td>
                <td className="py-3 px-4 text-right font-black text-emerald-700 dark:text-emerald-400 text-sm sm:text-base font-mono">
                  {formatCurrencyBR(comp.current.comissoesTotal)}
                </td>
                <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-medium font-mono">
                  {formatCurrencyBR(comp.previous.comissoesTotal)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderDeltaBadge(comp.variations.comissoesTotal)}
                </td>
              </tr>

              {/* Row 4: Total Faturamento / Lucro Bruto Loja */}
              <tr className="bg-emerald-50/60 dark:bg-emerald-500/5 font-bold border-t border-emerald-200 dark:border-emerald-500/20">
                <td className="py-3 px-4 font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Lucro Bruto da Loja (Faturamento)</span>
                </td>
                <td className="py-3 px-4 text-right font-black text-emerald-800 dark:text-emerald-300 text-base sm:text-lg font-mono">
                  {formatCurrencyBR(comp.current.faturamentoBruto)}
                </td>
                <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-semibold font-mono">
                  {formatCurrencyBR(comp.previous.faturamentoBruto)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderDeltaBadge(comp.variations.faturamentoBruto)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Performance per Vendor (Consistent with ranking) */}
      <div
        ref={vendorCompRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Desempenho por Vendedora Lado a Lado ({comp.currentLabel} vs {comp.previousLabel})
            </h4>
          </div>
          <ShareCardButton targetRef={vendorCompRef} cardTitle="Comparativo Desempenho por Vendedora" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendorComparison.map((v) => (
            <div
              key={v.vendedor}
              className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {v.vendedor}
                  </span>
                  {renderDeltaBadge(v.variation)}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {comp.currentLabel}:
                    </span>
                    <strong className="text-slate-900 dark:text-white font-bold font-mono">
                      {formatCurrencyBR(v.volumeCurrent)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between bg-white/40 dark:bg-slate-900/40 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-mono">{comp.previousLabel}:</span>
                    <span className="font-mono">{formatCurrencyBR(v.volumePrevious)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Taxa + Comissões:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrencyBR(v.taxasCurrent + v.comissaoCurrent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Month-by-Month Table Toggle */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowHistoryTable(!showHistoryTable)}
          className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
        >
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Histórico Mensal Consolidado & Médias (Sheet R$ Lívia Cred)
            </h4>
          </div>
          <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
            {showHistoryTable ? 'Ocultar demonstrativo' : 'Visualizar mês a mês e médias'}
          </span>
        </button>

        {showHistoryTable && (
          <div className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3">Mês</th>
                  <th className="py-2.5 px-2 text-right">Vendas Totais</th>
                  <th className="py-2.5 px-2 text-right">Taxas</th>
                  <th className="py-2.5 px-2 text-right">Comissões</th>
                  <th className="py-2.5 px-2 text-right">Lucro Bruto</th>
                  <th className="py-2.5 px-2 text-right">Despesas</th>
                  <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {history.map((h) => (
                  <tr key={h.periodo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{h.label}</td>
                    <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">{formatCurrencyBR(h.vendasTotais)}</td>
                    <td className="py-2 px-2 text-right text-amber-600 dark:text-amber-300 font-mono">{formatCurrencyBR(h.pagamentoTaxas)}</td>
                    <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrencyBR(h.comissoesTotal)}</td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-900 dark:text-white font-mono">{formatCurrencyBR(h.lucroBruto)}</td>
                    <td className="py-2 px-2 text-right text-rose-600 dark:text-rose-400 font-mono">-{formatCurrencyBR(h.despesas)}</td>
                    <td
                      className={`py-2 px-3 text-right font-black font-mono ${
                        h.lucroLiquido >= 0
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrencyBR(h.lucroLiquido)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
