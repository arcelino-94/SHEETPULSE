import React, { useState, useRef } from 'react';
import {
  PieChart as PieIcon,
  Percent,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SalesRecord,
  getDetailedOperationsMix,
  formatCurrencyBR,
  DetailedOperationRow,
} from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface OperationsMixProps {
  records: SalesRecord[];
}

export const OperationsMix: React.FC<OperationsMixProps> = ({ records }) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const [expandedOp, setExpandedOp] = useState<string | null>(null);

  const operations = getDetailedOperationsMix(records);

  // Top 3 operations by fee percentage (% Taxa de Assessoria)
  const topTaxa = [...operations]
    .filter((o) => o.volumeLiberado > 0 && o.percentualTaxa > 0 && !o.operacao.toUpperCase().includes('ASSESSORIA'))
    .sort((a, b) => b.percentualTaxa - a.percentualTaxa)
    .slice(0, 3);

  // Top 3 operations by commission percentage (% Comissão da Promotora)
  const topComissao = [...operations]
    .filter((o) => o.volumeLiberado > 0 && o.percentualComissao > 0)
    .sort((a, b) => b.percentualComissao - a.percentualComissao)
    .slice(0, 3);

  // Totals
  const totalVolume = operations.reduce((a, b) => a + b.volumeLiberado, 0);
  const totalTaxa = operations.reduce((a, b) => a + b.taxaAssessoria, 0);
  const totalComissao = operations.reduce((a, b) => a + b.comissaoTotal, 0);
  const totalDigitacoes = operations.reduce((a, b) => a + b.totalDigitacoes, 0);
  const totalPagos = operations.reduce((a, b) => a + b.contratosPagos, 0);

  const globalTaxaPercent = totalVolume > 0 ? Math.round((totalTaxa / totalVolume) * 100) : 0;
  const globalComissaoPercent = totalVolume > 0 ? (totalComissao / totalVolume) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Top Highlights: Maiores Margens de Operações */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Maiores Margens de Operações
          </h3>
        </div>
        <ShareCardButton cardId="margens" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Maiores Lucro / Taxa */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Maior Margem de Taxa de Assessoria
              </h4>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">
              % Taxa s/ Volume
            </span>
          </div>

          <div className="space-y-2">
            {topTaxa.map((item, idx) => (
              <div
                key={item.operacao}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.operacao}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    {formatCurrencyBR(item.volumeLiberado)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs font-mono">
                    {item.percentualTaxa}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maiores Lucro / Comissão Promotora */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/30 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Maior Retorno em Comissões
              </h4>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
              % Comissão s/ Volume
            </span>
          </div>

          <div className="space-y-2">
            {topComissao.map((item, idx) => (
              <div
                key={item.operacao}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.operacao}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                    {formatCurrencyBR(item.volumeLiberado)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs font-mono">
                    {item.percentualComissao.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table with Expandable Rows on Mobile */}
      <div
        ref={tableRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mix Detalhado de Operações ({operations.length} tipos)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Visão consolidada de taxas e comissões por produto
            </span>
            <ShareCardButton cardId="mix" />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Operação</th>
                <th className="py-2.5 px-2 text-right">Contratos</th>
                <th className="py-2.5 px-2 text-right">Vol. Liberado</th>
                <th className="py-2.5 px-2 text-right">Taxa Assessoria</th>
                <th className="py-2.5 px-2 text-right">% Taxa</th>
                <th className="py-2.5 px-2 text-right">Comissões</th>
                <th className="py-2.5 px-2 text-right">% Com.</th>
                <th className="py-2.5 px-3 text-right">Faturamento Total</th>
                <th className="py-2.5 px-2 text-center md:hidden">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {operations.map((op) => {
                const isExpanded = expandedOp === op.operacao;
                return (
                  <React.Fragment key={op.operacao}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {op.operacao}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-300 font-mono">
                        {op.contratosPagos} <span className="text-slate-400 text-[10px]">({op.totalDigitacoes})</span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-white font-mono">
                        {formatCurrencyBR(op.volumeLiberado)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-amber-700 dark:text-amber-300 font-mono">
                        {op.taxaAssessoria > 0 ? formatCurrencyBR(op.taxaAssessoria) : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                        {op.percentualTaxa > 0 ? `${op.percentualTaxa}%` : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-700 dark:text-emerald-400 font-mono">
                        {op.comissaoTotal > 0 ? formatCurrencyBR(op.comissaoTotal) : '-'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                        {op.percentualComissao > 0 ? `${op.percentualComissao.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-cyan-700 dark:text-cyan-300 font-mono">
                        {formatCurrencyBR(op.faturamentoTotal)}
                      </td>
                      <td className="py-2.5 px-2 text-center md:hidden">
                        <button
                          onClick={() => setExpandedOp(isExpanded ? null : op.operacao)}
                          className="p-1 rounded text-cyan-600 dark:text-cyan-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-950/80 md:hidden text-[11px]">
                        <td colSpan={9} className="p-3 space-y-1.5 border-t border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Comissões Detalhadas da Operação:
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                            <div>J2 Promotora: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrencyBR(op.comissaoJ2)}</strong></div>
                            <div>Sempre: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrencyBR(op.comissaoSempre)}</strong></div>
                            <div>DG: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrencyBR(op.comissaoDg)}</strong></div>
                            <div>GFT: <strong className="font-mono text-slate-900 dark:text-white">{formatCurrencyBR(op.comissaoGft)}</strong></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-slate-100 dark:bg-slate-950 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <td className="py-2.5 px-3 uppercase text-cyan-700 dark:text-cyan-400">TOTAL GERAL</td>
                <td className="py-2.5 px-2 text-right font-mono">{totalPagos} pagos</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalVolume)}</td>
                <td className="py-2.5 px-2 text-right text-amber-700 dark:text-amber-300 font-mono">{formatCurrencyBR(totalTaxa)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{globalTaxaPercent}%</td>
                <td className="py-2.5 px-2 text-right text-emerald-700 dark:text-emerald-400 font-mono">{formatCurrencyBR(totalComissao)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{globalComissaoPercent.toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right text-cyan-700 dark:text-cyan-300 font-mono bg-cyan-50 dark:bg-cyan-500/10">
                  {formatCurrencyBR(totalTaxa + totalComissao)}
                </td>
                <td className="md:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
