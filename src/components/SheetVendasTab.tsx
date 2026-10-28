import React, { useState, useMemo, useRef } from 'react';
import {
  Trophy,
  Target,
  CheckCircle2,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  TrendingUp,
} from 'lucide-react';
import {
  SalesRecord,
  calculateSheetVendasMatrix,
  calculateVendorGoalsRanking,
  VendorGoalRankingItem,
  ACTIVE_VENDORS_CONFIG,
  getTeamMeta,
  formatCurrencyBR,
} from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface SheetVendasTabProps {
  records: SalesRecord[];
  monthKey?: string;
  vendasData?: any;
}

export const SheetVendasTab: React.FC<SheetVendasTabProps> = ({ records, monthKey = '2026-10', vendasData }) => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const rankingCardRef = useRef<HTMLDivElement>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Calculate matrix and dynamic rankings (ALWAYS sorted by vendas totais)
  const matrixData = useMemo(() => {
    return calculateSheetVendasMatrix(records, monthKey, vendasData);
  }, [records, monthKey, vendasData]);

  const vendorRanking = useMemo(() => {
    return calculateVendorGoalsRanking(records, 'vendas_totais', monthKey, vendasData);
  }, [records, monthKey, vendasData]);

  const vendorMapByName = useMemo(() => {
    return new Map(vendorRanking.map((v) => [v.vendedor, v]));
  }, [vendorRanking]);

  const { rows, totalRealizado, metas, atingimento, quantoFalta, topVolume, topAtingimento } = matrixData;

  // Dynamic team goal from single source of truth (sum of active vendor goals)
  const teamGoal = getTeamMeta(ACTIVE_VENDORS_CONFIG);

  // Total valid volume for the team (subtracting Refin, Refin de Port, Cartão)
  const totalValidoLoja = useMemo(() => {
    return vendorRanking.reduce((sum, v) => sum + v.elegivelComissao, 0);
  }, [vendorRanking]);

  const percentualMetaEquipe = teamGoal > 0 ? Math.round((totalValidoLoja / teamGoal) * 1000) / 10 : 0;
  const quantoFaltaEquipe = Math.max(0, teamGoal - totalValidoLoja);

  const monthLabel =
    monthKey === '2026-06'
      ? 'Junho / 2026'
      : monthKey === '2026-07'
      ? 'Julho / 2026'
      : monthKey === '2026-08'
      ? 'Agosto / 2026'
      : monthKey === '2026-09'
      ? 'Setembro / 2026'
      : monthKey === '2026-10'
      ? 'Outubro / 2026'
      : monthKey;

  // Matrix column alignment definitions
  const matrixCols = [
    { name: 'Hellen', key: 'hellen' as const },
    { name: 'Bianca (Loja Igarassu)', key: 'bianca' as const, label: 'Bianca (Igarassu)' },
    { name: 'Lucélia', key: 'lucelia' as const },
    { name: 'Taciana', key: 'taciana' as const },
    { name: 'Agatha', key: 'agatha' as const },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. TOP HIGHLIGHTS: Two Separate Recognitions (Never Mixed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Recognition 1: Maior Volume Vendido */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-500 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block break-words">
                Maior volume vendido
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white break-words">
                {topVolume.nome}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Volume Total:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {formatCurrencyBR(topVolume.volume)}
                </strong>
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Flame className="w-3 h-3" />
              Líder em Volume
            </span>
          </div>
        </div>

        {/* Recognition 2: Maior Atingimento da Meta */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block break-words">
                Maior atingimento da meta
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white break-words">
                {topAtingimento.nome}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Atingimento Válido:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {topAtingimento.percentual}%
                </strong>{' '}
                ({formatCurrencyBR(topAtingimento.volumeValido)})
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-3 h-3" />
              Top Meta
            </span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC TEAM GOAL BANNER */}
      <div
        ref={bannerRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                META DA EQUIPE
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {monthLabel}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              Progresso Consolidado da Loja
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Soma das metas individuais das vendedoras ativas:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {formatCurrencyBR(teamGoal)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                Válido Realizado
              </span>
              <span className="text-sm sm:text-base font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {formatCurrencyBR(totalValidoLoja)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                Meta: {formatCurrencyBR(teamGoal)}
              </span>
            </div>
            <ShareCardButton targetRef={bannerRef} cardTitle="Meta e Progresso da Equipe" />
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">
              Atingimento da Meta da Equipe
            </span>
            <span
              className={
                percentualMetaEquipe >= 100
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold font-mono'
                  : 'text-cyan-600 dark:text-cyan-400 font-bold font-mono'
              }
            >
              {percentualMetaEquipe}%
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                percentualMetaEquipe >= 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, percentualMetaEquipe)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>
              {percentualMetaEquipe >= 100 ? (
                <strong className="text-emerald-600 dark:text-emerald-400">
                  Meta da equipe atingida com sucesso!
                </strong>
              ) : (
                <span>
                  Faltam <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrencyBR(quantoFaltaEquipe)}</strong> para a meta geral
                </span>
              )}
            </span>
            <span className="text-[10px] font-mono">Base: Vendas válidas pós-deduções</span>
          </div>
        </div>
      </div>

      {/* 3. RANKING DE VENDAS: Always Ordered by VENDAS TOTAIS */}
      <div
        ref={rankingCardRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Ranking de vendas
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Ordenado por vendas totais. A barra, o atingimento e o valor que falta consideram somente vendas elegíveis para comissão. Refin, Refin de Port e Cartão não entram no elegível.
            </p>
          </div>

          <div className="flex-shrink-0">
            <ShareCardButton cardId="ranking" />
          </div>
        </div>

        {/* DESKTOP VIEW: Compact Table / List with all mandatory columns */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">Posição</th>
                <th className="py-3 px-4">Vendedora</th>
                <th className="py-3 px-4 text-right">
                  <span className="text-slate-900 dark:text-white font-black">Vendas Totais</span>
                </th>
                <th className="py-3 px-4 text-right">Elegível p/ Comissão</th>
                <th className="py-3 px-4 text-right">Meta de Comissão</th>
                <th className="py-3 px-4 text-left w-64">Atingimento</th>
                <th className="py-3 px-4 text-right">Falta p/ Meta</th>
                <th className="py-3 px-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {vendorRanking.map((item: VendorGoalRankingItem, index: number) => {
                const rank = index + 1;
                const isExpanded = expandedVendor === item.vendedor;
                const rankBadgeColor =
                  rank === 1
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                    : rank === 2
                    ? 'bg-slate-100 dark:bg-slate-300/20 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-400/40'
                    : rank === 3
                    ? 'bg-amber-50 dark:bg-amber-800/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700/40'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                return (
                  <React.Fragment key={item.vendedor}>
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex w-7 h-7 rounded-lg border font-black text-xs items-center justify-center ${rankBadgeColor}`}
                        >
                          {rank}º
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {item.vendedor}
                          </span>
                          {item.atingiu && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Batida
                            </span>
                          )}
                        </div>
                      </td>
                      {/* VENDAS TOTAIS: Visualmente mais importante porque define a posição! */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {formatCurrencyBR(item.vendasTotais)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrencyBR(item.elegivelComissao)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrencyBR(item.metaComissao)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.atingiu ? 'bg-emerald-500' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${Math.min(100, item.atingimento)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-black text-xs min-w-[42px] text-right ${
                              item.atingiu
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {item.atingimento}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {item.atingiu ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{formatCurrencyBR(item.superavit)}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            {formatCurrencyBR(item.falta)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setExpandedVendor(isExpanded ? null : item.vendedor)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <span>{isExpanded ? 'Ocultar' : 'Deduções'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable breakdown for exclusions */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 dark:bg-slate-950/80">
                        <td colSpan={8} className="p-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Vendas Totais</span>
                              <strong className="font-mono text-slate-900 dark:text-white">
                                {formatCurrencyBR(item.vendasTotais)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                Deduções (Refin, Refin de Port, Cartão)
                              </span>
                              <strong className="font-mono text-rose-600 dark:text-rose-400">
                                -{formatCurrencyBR(item.volumeExcluido)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                Elegível para Comissão
                              </span>
                              <strong className="font-mono text-cyan-600 dark:text-cyan-400">
                                {formatCurrencyBR(item.elegivelComissao)}
                              </strong>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW: Mandatory Visual Structure Showing ALL Essential Data */}
        <div className="block md:hidden p-3 space-y-3">
          {vendorRanking.map((item: VendorGoalRankingItem, index: number) => {
            const rank = index + 1;
            const isExpanded = expandedVendor === item.vendedor;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                : rank === 2
                ? 'bg-slate-100 dark:bg-slate-300/20 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-400/40'
                : rank === 3
                ? 'bg-amber-50 dark:bg-amber-800/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-700/40'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

            return (
              <div
                key={item.vendedor}
                className="rounded-xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Linha 1: [posição] [nome completo] [vendas totais] */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg border font-black text-xs flex items-center justify-center flex-shrink-0 ${rankBadgeColor}`}
                    >
                      {rank}º
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white break-words">
                      {item.vendedor}
                    </span>
                    {item.atingiu && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-1 py-0.2 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Batida
                      </span>
                    )}
                  </div>
                  {/* Vendas Totais: Destaque visual principal */}
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white block">
                      {formatCurrencyBR(item.vendasTotais)}
                    </span>
                  </div>
                </div>

                {/* Linha 2: Vendas totais (rótulo) */}
                <div className="text-right text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 -mt-1">
                  Vendas totais
                </div>

                {/* Linha 3: Elegível R$ X de R$ Y */}
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Elegível <strong className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{formatCurrencyBR(item.elegivelComissao)}</strong> de <span className="font-mono text-slate-500 dark:text-slate-400">{formatCurrencyBR(item.metaComissao)}</span>
                </div>

                {/* Linha 4: [barra] Z% */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.atingiu ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, item.atingimento)}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-black font-mono flex-shrink-0 ${
                      item.atingiu
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.atingimento}%
                  </span>
                </div>

                {/* Linha 5: Faltam R$ W para a meta + Toggle de deduções */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {item.atingiu ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Meta batida! (+{formatCurrencyBR(item.superavit)})
                      </span>
                    ) : (
                      <span>
                        Faltam <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formatCurrencyBR(item.falta)}</strong> para a meta
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setExpandedVendor(isExpanded ? null : item.vendedor)}
                    className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Ocultar' : 'Deduções'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Deduções e operações excluídas no mobile */}
                {isExpanded && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg space-y-1.5 animate-fade-in">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Deduções (Refin/Cartão):</span>
                      <strong className="font-mono text-rose-600 dark:text-rose-400">-{formatCurrencyBR(item.volumeExcluido)}</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. THE MATRIZ TABLE: Consistent Vendors Across Entire System */}
      <div
        ref={matrixRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Matriz de Vendas por Operação & Vendedora
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              Participantes consistentes com o ranking
            </span>
            <ShareCardButton cardId="matriz" />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 sm:px-4">Operação</th>
                <th className="py-2.5 px-2 text-right">Hellen</th>
                <th className="py-2.5 px-2 text-right">Bianca (Igarassu)</th>
                <th className="py-2.5 px-2 text-right">Lucélia</th>
                <th className="py-2.5 px-2 text-right">Taciana</th>
                <th className="py-2.5 px-2 text-right">Agatha</th>
                <th className="py-2.5 px-3 sm:px-4 text-right bg-slate-100 dark:bg-slate-950/50">TOTAL LOJA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {rows.map((r) => (
                <tr key={r.operacao} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 dark:text-white break-words">
                    {r.operacao}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">
                    {r.hellenVolume > 0 ? formatCurrencyBR(r.hellenVolume) : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">
                    {r.biancaVolume > 0 ? formatCurrencyBR(r.biancaVolume) : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">
                    {r.luceliaVolume > 0 ? formatCurrencyBR(r.luceliaVolume) : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">
                    {r.tacianaVolume > 0 ? formatCurrencyBR(r.tacianaVolume) : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300 font-mono">
                    {r.agathaVolume > 0 ? formatCurrencyBR(r.agathaVolume) : '-'}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/40 font-mono">
                    {r.totalVolume > 0 ? formatCurrencyBR(r.totalVolume) : '-'}
                  </td>
                </tr>
              ))}

              {/* Row 1: Total Vendas */}
              <tr className="bg-slate-100 dark:bg-slate-950 font-black text-xs border-t-2 border-cyan-500/40 text-slate-900 dark:text-white">
                <td className="py-2.5 px-3 sm:px-4 text-cyan-700 dark:text-cyan-400">TOTAL VENDAS</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalRealizado.hellen)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalRealizado.bianca)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalRealizado.lucelia)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalRealizado.taciana)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(totalRealizado.agatha)}</td>
                <td className="py-2.5 px-3 sm:px-4 text-right text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 font-black font-mono">
                  {formatCurrencyBR(totalRealizado.total)}
                </td>
              </tr>

              {/* Row 2: Elegível p/ Meta (subtrai Refin e Cartão) - Matched strictly to header columns */}
              <tr className="bg-cyan-50/60 dark:bg-cyan-950/20 text-xs font-bold text-cyan-900 dark:text-cyan-200 border-t border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-3 sm:px-4 text-cyan-700 dark:text-cyan-300">VÁLIDO P/ META (subtrai Refin e Cartão)</td>
                {matrixCols.map((c) => {
                  const item = vendorMapByName.get(c.name);
                  return (
                    <td key={c.key} className="py-2.5 px-2 text-right font-mono">
                      {formatCurrencyBR(item?.elegivelComissao || 0)}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 sm:px-4 text-right font-black text-cyan-700 dark:text-cyan-300 bg-cyan-100/60 dark:bg-cyan-500/15 font-mono">
                  {formatCurrencyBR(totalValidoLoja)}
                </td>
              </tr>

              {/* Row 3: Meta Individual & Equipe */}
              <tr className="bg-amber-50/60 dark:bg-amber-950/20 text-xs font-bold text-amber-900 dark:text-amber-300 border-t border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-3 sm:px-4">META INDIVIDUAL</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(metas.hellen)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(metas.bianca)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(metas.lucelia)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(metas.taciana)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrencyBR(metas.agatha)}</td>
                <td className="py-2.5 px-3 sm:px-4 text-right text-amber-700 dark:text-amber-200 font-extrabold font-mono">
                  {formatCurrencyBR(teamGoal)}
                </td>
              </tr>

              {/* Row 4: Atingimento Válido p/ Meta - Matched strictly to header columns */}
              <tr className="bg-slate-50 dark:bg-slate-950/90 text-xs font-extrabold border-t border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-3 sm:px-4 text-emerald-600 dark:text-emerald-400">ATINGIMENTO VÁLIDO P/ META</td>
                {matrixCols.map((c) => {
                  const item = vendorMapByName.get(c.name);
                  const pct = item?.atingimento || 0;
                  return (
                    <td
                      key={c.key}
                      className={`py-2.5 px-2 text-right font-mono ${
                        pct >= 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {pct}%
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 sm:px-4 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 font-mono">
                  {percentualMetaEquipe}%
                </td>
              </tr>

              {/* Row 5: Quanto Falta (p/ Meta) - Matched strictly to header columns */}
              <tr className="bg-white dark:bg-slate-950 text-xs font-semibold border-t border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-3 sm:px-4 text-slate-500 dark:text-slate-400">QUANTO FALTA (P/ META)</td>
                {matrixCols.map((c) => {
                  const item = vendorMapByName.get(c.name);
                  const atingiu = item?.atingiu || false;
                  return (
                    <td
                      key={c.key}
                      className={`py-2.5 px-2 text-right font-mono ${
                        atingiu
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {atingiu
                        ? `+${formatCurrencyBR(item?.superavit || 0)}`
                        : formatCurrencyBR(item?.falta || 0)}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-amber-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-900/60 font-mono">
                  {quantoFaltaEquipe > 0 ? formatCurrencyBR(quantoFaltaEquipe) : 'Meta Equipe Batida!'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
