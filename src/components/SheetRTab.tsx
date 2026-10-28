import React, { useMemo, useRef } from 'react';
import {
  Wallet,
  Users,
  Award,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import {
  SalesRecord,
  calculateTopOperationMargins,
  calculateVendorGoalsRanking,
  formatCurrencyBR,
  SheetRResult,
  EmployeePerformanceR,
} from '../lib/salesEngine.ts';
import {
  calculateDeterministicMetrics,
} from '../lib/sheetCache.ts';
import { ShareCardButton } from './ShareCardButton.tsx';
import { PeriodIntelligentAnalysis } from './PeriodIntelligentAnalysis.tsx';

interface SheetRTabProps {
  sheetRData: SheetRResult;
  records: SalesRecord[];
  monthKey?: string;
  previousMonthData?: SheetRResult | null;
}

export const SheetRTab: React.FC<SheetRTabProps> = ({
  sheetRData,
  records,
  monthKey,
  previousMonthData,
}) => {
  const desempenhoRef = useRef<HTMLDivElement>(null);
  const pamellaRef = useRef<HTMLDivElement>(null);
  const totaisRef = useRef<HTMLDivElement>(null);

  const funcionarios = sheetRData.funcionarios || [];
  const totais = sheetRData.totais || {
    pagos: 0,
    taxas: 0,
    comissaoJ2: 0,
    comissaoSempre: 0,
    comissaoDg: 0,
    comissaoGft: 0,
    comissaoTotal: 0,
    faturamentoTotal: 0,
    custoTotal: 0,
    rentabilidadeTotal: 0,
    despesasGerais: 0,
    lucroLiquido: 0,
  };
  const pamellaComissao = sheetRData.pamellaComissao || {
    faturamento: 0,
    meta1: { meta: 90000, percentual: 1.6, batida: false, falta: 90000 },
    meta2: { meta: 125000, percentual: 1.95, batida: false, falta: 125000 },
    percentualAplicado: 0,
    comissaoAPagar: 0,
  };

  const { topTaxaMargins, topComissaoMargins } = useMemo(() => {
    return calculateTopOperationMargins(records);
  }, [records]);

  const vendorGoalsRanking = useMemo(() => {
    return calculateVendorGoalsRanking(records, 'vendas_totais', monthKey);
  }, [records, monthKey]);

  const deterministicMetrics = useMemo(() => {
    return calculateDeterministicMetrics(
      sheetRData,
      monthKey || '2026-09',
      previousMonthData,
      vendorGoalsRanking,
      { topTaxaMargins, topComissaoMargins }
    );
  }, [sheetRData, monthKey, previousMonthData, vendorGoalsRanking, topTaxaMargins, topComissaoMargins]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intelligent Period Analysis Drawer Trigger */}
      <PeriodIntelligentAnalysis
        metrics={deterministicMetrics}
        monthKey={monthKey || '2026-09'}
      />

      {/* Main Table: Rentabilidade por Funcionário */}
      <div
        ref={desempenhoRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Desempenho & Rentabilidade por Funcionário
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              {funcionarios.length} colaboradoras analisadas
            </span>
            <ShareCardButton cardId="desempenho" />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-2 sm:px-3">Colaboradora</th>
                <th className="py-2.5 px-1.5 sm:px-2 text-right">Vol. Lib.</th>
                <th className="py-2.5 px-1.5 sm:px-2 text-right">Taxas</th>
                <th className="py-2.5 px-1.5 text-right hidden lg:table-cell">Com. J2</th>
                <th className="py-2.5 px-1.5 text-right hidden lg:table-cell">Com. Sempre</th>
                <th className="py-2.5 px-1.5 sm:px-2 text-right">Taxa + Com.</th>
                <th className="py-2.5 px-1.5 sm:px-2 text-right">Custo Loja</th>
                <th className="py-2.5 px-2 sm:px-3 text-right">Rentabilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {funcionarios.map((f: EmployeePerformanceR) => {
                const cleanVendor = f.vendedor.replace(' (Loja Igarassu)', '').replace('Loja Igarassu', 'Bianca');
                return (
                  <tr key={f.vendedor} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2 px-2 sm:px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span>{cleanVendor}</span>
                      </div>
                    </td>
                    <td className="py-2 px-1.5 sm:px-2 text-right font-medium text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {formatCurrencyBR(f.pagos)}
                    </td>
                    <td className="py-2 px-1.5 sm:px-2 text-right font-medium text-amber-700 dark:text-amber-300 font-mono whitespace-nowrap">
                      {formatCurrencyBR(f.taxas)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-500 dark:text-slate-400 font-mono hidden lg:table-cell whitespace-nowrap">
                      {formatCurrencyBR(f.comissaoJ2)}
                    </td>
                    <td className="py-2 px-1.5 text-right text-slate-500 dark:text-slate-400 font-mono hidden lg:table-cell whitespace-nowrap">
                      {formatCurrencyBR(f.comissaoSempre)}
                    </td>
                    <td className="py-2 px-1.5 sm:px-2 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                      {formatCurrencyBR(f.faturamentoTotal)}
                    </td>
                    <td className="py-2 px-1.5 sm:px-2 text-right font-medium text-rose-600 dark:text-rose-400 font-mono whitespace-nowrap">
                      {f.custoFuncionario !== 0 ? formatCurrencyBR(f.custoFuncionario) : 'R$ 0,00'}
                    </td>
                    <td
                      className={`py-2 px-2 sm:px-3 text-right font-black font-mono whitespace-nowrap ${
                        f.rentabilidade >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrencyBR(f.rentabilidade)}
                    </td>
                  </tr>
                );
              })}

              {/* Total Consolidated Row */}
              <tr className="bg-slate-100 dark:bg-slate-950 font-black border-t-2 border-emerald-500/40 text-slate-900 dark:text-white">
                <td className="py-2.5 px-2 sm:px-3 text-emerald-700 dark:text-emerald-400">TOTAL</td>
                <td className="py-2.5 px-1.5 sm:px-2 text-right font-mono">{formatCurrencyBR(totais.pagos)}</td>
                <td className="py-2.5 px-1.5 sm:px-2 text-right text-amber-700 dark:text-amber-300 font-mono">{formatCurrencyBR(totais.taxas)}</td>
                <td className="py-2.5 px-1.5 text-right font-mono hidden lg:table-cell">{formatCurrencyBR(totais.comissaoJ2)}</td>
                <td className="py-2.5 px-1.5 text-right font-mono hidden lg:table-cell">{formatCurrencyBR(totais.comissaoSempre)}</td>
                <td className="py-2.5 px-1.5 sm:px-2 text-right font-mono">{formatCurrencyBR(totais.faturamentoTotal)}</td>
                <td className="py-2.5 px-1.5 sm:px-2 text-right text-rose-600 dark:text-rose-400 font-mono">{formatCurrencyBR(totais.custoTotal)}</td>
                <td className="py-2.5 px-2 sm:px-3 text-right text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 font-mono font-black">
                  {formatCurrencyBR(totais.rentabilidadeTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Comissão de Coordenação (Pamella) */}
        <div
          ref={pamellaRef}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Comissão de Coordenação (Pamella)
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 font-bold">
                {pamellaComissao?.percentualAplicado > 0 ? `${pamellaComissao.percentualAplicado}% Atingido` : 'Em andamento'}
              </span>
              <ShareCardButton cardId="comissao" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Meta 1 */}
            <div
              className={`p-3 rounded-xl border ${
                pamellaComissao?.meta1?.batida
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Meta 1 (1,60%)</span>
                {pamellaComissao?.meta1?.batida && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {formatCurrencyBR(pamellaComissao?.meta1?.meta || 90000)}
              </div>
              <div className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                {pamellaComissao?.meta1?.batida ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Batida! Superávit de {formatCurrencyBR((pamellaComissao?.faturamento || 0) - (pamellaComissao?.meta1?.meta || 90000))}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Falta {formatCurrencyBR(pamellaComissao?.meta1?.falta || 0)}
                  </span>
                )}
              </div>
            </div>

            {/* Meta 2 */}
            <div
              className={`p-3 rounded-xl border ${
                pamellaComissao?.meta2?.batida
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Meta 2 (1,95%)</span>
                {pamellaComissao?.meta2?.batida && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {formatCurrencyBR(pamellaComissao?.meta2?.meta || 125000)}
              </div>
              <div className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                {pamellaComissao?.meta2?.batida ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Batida! Superávit de {formatCurrencyBR((pamellaComissao?.faturamento || 0) - (pamellaComissao?.meta2?.meta || 125000))}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Falta {formatCurrencyBR(pamellaComissao?.meta2?.falta || 0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Faturamento e Comissão Final a Pagar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Faturamento Base</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {formatCurrencyBR(pamellaComissao?.faturamento || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">Comissão Apurada</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {formatCurrencyBR(pamellaComissao?.comissaoAPagar || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Resumo Financeiro da Loja */}
        <div
          ref={totaisRef}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Demonstrativo Consolidado da Loja
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Consolidado</span>
              <ShareCardButton cardId="demonstrativo" />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Vendas Totais (Liberado)</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrencyBR(totais.pagos)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Comissão J2</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{formatCurrencyBR(totais.comissaoJ2)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Comissão DG</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{formatCurrencyBR(totais.comissaoDg)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Comissão GFT</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{formatCurrencyBR(totais.comissaoGft)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Comissão Sempre</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{formatCurrencyBR(totais.comissaoSempre)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Taxas de Assessoria</span>
              <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{formatCurrencyBR(totais.taxas)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 px-2 rounded">
              <span className="font-bold text-emerald-800 dark:text-emerald-400">Faturamento / Lucro Bruto</span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono">{formatCurrencyBR(totais.faturamentoTotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Despesas Administrativas e Operacionais</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">-{formatCurrencyBR(totais.despesasGerais)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 bg-slate-100 dark:bg-slate-950 px-2 rounded border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Lucro Líquido Final</span>
              <span
                className={`font-black font-mono ${
                  totais.lucroLiquido >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrencyBR(totais.lucroLiquido)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
