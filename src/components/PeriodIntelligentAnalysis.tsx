import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  DeterministicMetrics,
  IntelligentAnalysis,
  fetchAnalysisWithCache,
} from '../lib/sheetCache.ts';
import { formatCurrencyBR } from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface PeriodIntelligentAnalysisProps {
  metrics: DeterministicMetrics;
  monthKey: string;
}

export const PeriodIntelligentAnalysis: React.FC<PeriodIntelligentAnalysisProps> = ({
  metrics,
  monthKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState<IntelligentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Accordion section states
  const [openSections, setOpenSections] = useState<{
    comparativo: boolean;
    insights: boolean;
    alertas: boolean;
    recomendacoes: boolean;
    vendedoras: boolean;
  }>({
    comparativo: true,
    insights: true,
    alertas: true,
    recomendacoes: true,
    vendedoras: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const loadAnalysis = async (force = false) => {
    if (force) {
      setIsUpdating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetchAnalysisWithCache(metrics, force);
      setAnalysis(res.analysis);
      setIsFallback(res.isFallback);
    } catch (err: any) {
      console.warn('Analysis fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadAnalysis(false);
  }, [monthKey, metrics]);

  // Handle Escape key to close drawer (Ensures single-overlay discipline)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  const mesAnt = metrics.mesAnterior;
  const situacao = analysis?.situacao || 'positiva';

  const situacaoConfig = {
    positiva: {
      badge: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      label: 'Situação Positiva',
      icon: CheckCircle2,
    },
    atencao: {
      badge: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
      label: 'Ponto de Atenção',
      icon: AlertTriangle,
    },
    critica: {
      badge: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
      label: 'Situação Crítica',
      icon: AlertTriangle,
    },
  }[situacao];

  const SituacaoIcon = situacaoConfig.icon;

  return (
    <>
      {/* Inline Executive Card: Fully Responsive & Light-Theme Compliant */}
      <div
        ref={containerRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-wide">
                  Diagnóstico Executivo do Período
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${situacaoConfig.badge}`}>
                  <SituacaoIcon className="w-3 h-3" />
                  {situacaoConfig.label}
                </span>
                {isLoading ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 animate-pulse">
                    Carregando análise...
                  </span>
                ) : !isFallback ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Análise Gemini Ativa
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex items-center gap-1"
                    title="Serviço Gemini temporariamente indisponível. Utilizando motor determinístico oficial."
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Análise Determinística (Gemini indisponível)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 break-words mt-0.5">
                Diagnóstico executivo automatizado e comparativo baseado nos dados oficiais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0 flex-wrap">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver análise completa</span>
            </button>
            <ShareCardButton cardId="diagnostico" />
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="text-xs font-medium">Sintetizando indicadores do período...</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Conclusão principal - Bloco compartilhável independente */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Conclusão Principal
                </span>
                <ShareCardButton cardId="conclusao" />
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium break-words">
                {metrics.conclusaoPrincipal || analysis?.resumo || 'Resumo do período em processamento.'}
              </p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Vendas Totais</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono block mt-0.5">
                  {formatCurrencyBR(metrics.vendasTotais)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">LUCRO</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                  {formatCurrencyBR(metrics.lucro)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Despesas</span>
                <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                  -{formatCurrencyBR(metrics.despesas)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Lucro Líquido</span>
                <span className={`text-xs sm:text-sm font-black font-mono block mt-0.5 ${metrics.lucroLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrencyBR(metrics.lucroLiquido)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold uppercase">Margem Líquida</span>
                <span className="text-xs sm:text-sm font-black text-cyan-600 dark:text-cyan-300 font-mono block mt-0.5">
                  {(metrics.margemLiquida * 100).toFixed(1).replace('.', ',')}%
                </span>
              </div>
            </div>

            {/* Comparisons Summary: vs. Mês Anterior & vs. Média 3M */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Comparações Temporais
                </span>
                <ShareCardButton cardId="comparativos" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* vs. Mês Anterior */}
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Comparativo vs. Mês Anterior
                  </span>
                  {mesAnt ? (
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono">
                      <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Vendas</span>
                        <span className={`font-bold ${mesAnt.variacoes.vendasTotaisDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {mesAnt.variacoes.vendasTotaisPercent > 0 ? `+${mesAnt.variacoes.vendasTotaisPercent}%` : `${mesAnt.variacoes.vendasTotaisPercent}%`}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Lucro</span>
                        <span className={`font-bold ${mesAnt.variacoes.lucroDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {mesAnt.variacoes.lucroPercent > 0 ? `+${mesAnt.variacoes.lucroPercent}%` : `${mesAnt.variacoes.lucroPercent}%`}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block uppercase">Líquido</span>
                        <span className={`font-bold ${mesAnt.variacoes.lucroLiquidoDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {mesAnt.variacoes.lucroLiquidoPercent > 0 ? `+${mesAnt.variacoes.lucroLiquidoPercent}%` : `${mesAnt.variacoes.lucroLiquidoPercent}%`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Mês anterior em sincronização no cache.
                    </p>
                  )}
                </div>

              {/* vs. Média dos 3 Meses Anteriores */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Comparativo vs. Média 3 Meses Anteriores
                </span>
                {metrics.mediaTresMesesAnteriores ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-mono">
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Vendas vs 3M</span>
                      <span className={`font-bold ${metrics.mediaTresMesesAnteriores.variacoes.vendasTotaisDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {metrics.mediaTresMesesAnteriores.variacoes.vendasTotaisPercent > 0 ? `+${metrics.mediaTresMesesAnteriores.variacoes.vendasTotaisPercent}%` : `${metrics.mediaTresMesesAnteriores.variacoes.vendasTotaisPercent}%`}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Lucro vs 3M</span>
                      <span className={`font-bold ${metrics.mediaTresMesesAnteriores.variacoes.lucroDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {metrics.mediaTresMesesAnteriores.variacoes.lucroPercent > 0 ? `+${metrics.mediaTresMesesAnteriores.variacoes.lucroPercent}%` : `${metrics.mediaTresMesesAnteriores.variacoes.lucroPercent}%`}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase">Líquido vs 3M</span>
                      <span className={`font-bold ${metrics.mediaTresMesesAnteriores.variacoes.lucroLiquidoDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {metrics.mediaTresMesesAnteriores.variacoes.lucroLiquidoPercent > 0 ? `+${metrics.mediaTresMesesAnteriores.variacoes.lucroLiquidoPercent}%` : `${metrics.mediaTresMesesAnteriores.variacoes.lucroLiquidoPercent}%`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Pré-carregando histórico de 3 meses em segundo plano...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Destaques de Desempenho (Melhor e Pior) */}
            {(metrics.melhorDesempenho || metrics.piorDesempenho) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {metrics.melhorDesempenho && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Melhor Desempenho</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{metrics.melhorDesempenho.nome}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{metrics.melhorDesempenho.detalhe}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">{metrics.melhorDesempenho.valor}</span>
                  </div>
                )}
                {metrics.piorDesempenho && (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Ponto de Atenção</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{metrics.piorDesempenho.nome}</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{metrics.piorDesempenho.detalhe}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">{metrics.piorDesempenho.valor}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SINGLE UNIFIED OVERLAY: Wide Lateral Drawer on Desktop / Mobile-friendly with WCAG AA light theme */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Fechar gaveta de análise"
          />

          {/* Drawer container with light and dark mode classes */}
          <div
            ref={drawerContentRef}
            className="relative z-10 w-full sm:max-w-2xl md:max-w-3xl h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 transition-colors"
          >
            {/* Fixed Header */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      Diagnóstico Executivo do Período
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${situacaoConfig.badge}`}>
                      <SituacaoIcon className="w-3 h-3" />
                      {situacaoConfig.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                    Período Selecionado: {metrics.periodo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => loadAnalysis(true)}
                  disabled={isUpdating}
                  title="Atualizar análise"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
                  aria-label="Atualizar análise"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin text-cyan-500' : ''}`} />
                </button>
                <ShareCardButton cardId="modal-analise" />
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Fechar (Esc)"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs scrollbar-thin">
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Síntese da Operação
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium break-words">
                  {analysis?.resumo}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Margem Líquida da Operação:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {(metrics.margemLiquida * 100).toFixed(1).replace('.', ',')}%
                  </strong>
                </div>
              </div>

              {/* Accordion 1: Comparativo Temporal vs. Mês Anterior */}
              <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('comparativo')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    <Scale className="w-3.5 h-3.5" />
                    Comparativo vs. Mês Anterior
                  </span>
                  {openSections.comparativo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openSections.comparativo && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
                    {mesAnt ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Vendas Totais</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-xs font-bold">
                            {mesAnt.variacoes.vendasTotaisDiff >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className={mesAnt.variacoes.vendasTotaisDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {mesAnt.variacoes.vendasTotaisPercent > 0 ? `+${mesAnt.variacoes.vendasTotaisPercent}%` : `${mesAnt.variacoes.vendasTotaisPercent}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {formatCurrencyBR(mesAnt.variacoes.vendasTotaisDiff)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Taxas</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-xs font-bold">
                            {mesAnt.variacoes.taxasDiff >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className={mesAnt.variacoes.taxasDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {mesAnt.variacoes.taxasPercent > 0 ? `+${mesAnt.variacoes.taxasPercent}%` : `${mesAnt.variacoes.taxasPercent}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {formatCurrencyBR(mesAnt.variacoes.taxasDiff)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">LUCRO</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-xs font-bold">
                            {mesAnt.variacoes.lucroDiff >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className={mesAnt.variacoes.lucroDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {mesAnt.variacoes.lucroPercent > 0 ? `+${mesAnt.variacoes.lucroPercent}%` : `${mesAnt.variacoes.lucroPercent}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {formatCurrencyBR(mesAnt.variacoes.lucroDiff)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Despesas</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-xs font-bold">
                            {mesAnt.variacoes.despesasDiff <= 0 ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className={mesAnt.variacoes.despesasDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {mesAnt.variacoes.despesasPercent > 0 ? `+${mesAnt.variacoes.despesasPercent}%` : `${mesAnt.variacoes.despesasPercent}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {formatCurrencyBR(mesAnt.variacoes.despesasDiff)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Lucro Líquido</span>
                          <div className="flex items-center gap-1 mt-0.5 font-mono text-xs font-bold">
                            {mesAnt.variacoes.lucroLiquidoDiff >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className={mesAnt.variacoes.lucroLiquidoDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {mesAnt.variacoes.lucroLiquidoPercent > 0 ? `+${mesAnt.variacoes.lucroLiquidoPercent}%` : `${mesAnt.variacoes.lucroLiquidoPercent}%`}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {formatCurrencyBR(mesAnt.variacoes.lucroLiquidoDiff)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Margem Líquida</span>
                          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-300 font-mono block mt-1">
                            {mesAnt.variacoes.margemLiquidaDiff >= 0 ? `+${mesAnt.variacoes.margemLiquidaDiff} p.p.` : `${mesAnt.variacoes.margemLiquidaDiff} p.p.`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Mês anterior não disponível no cache local para comparação automática.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 2: Insights Positivos */}
              <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('insights')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Insights Positivos ({analysis?.insightsPositivos?.length || 0})
                  </span>
                  {openSections.insights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openSections.insights && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                    {analysis?.insightsPositivos?.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <span>{item.titulo}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            {item.numeroBase}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed break-words">
                          {item.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: Alertas */}
              <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('alertas')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alertas & Pontos de Atenção ({analysis?.alertas?.length || 0})
                  </span>
                  {openSections.alertas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openSections.alertas && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                    {analysis?.alertas?.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                          <span>{item.titulo}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            {item.numeroBase}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 leading-relaxed break-words">
                          {item.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 4: Recomendações Estratégicas */}
              <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('recomendacoes')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Recomendações Práticas ({analysis?.recomendacoes?.length || 0})
                  </span>
                  {openSections.recomendacoes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openSections.recomendacoes && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
                    {analysis?.recomendacoes?.map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{rec.problemaOportunidade}</span>
                          <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
                            {rec.impactoPrioridade}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed break-words">
                          {rec.acao}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 5: Detalhes das Vendedoras */}
              <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleSection('vendedoras')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Detalhamento Consolidado das Vendedoras
                  </span>
                  {openSections.vendedoras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {openSections.vendedoras && (
                  <div className="p-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                    {metrics.vendedores?.map((v) => (
                      <div key={v.nome} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 dark:text-white text-xs block">{v.nome}</strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {v.participacaoVolume}% do volume total
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300 block">
                            {formatCurrencyBR(v.volumeValidoMeta || v.volumeTotal)}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                            Rentab: {formatCurrencyBR(v.rentabilidade)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                Lívia Cred 2026 • Análise Exclusiva
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition cursor-pointer"
              >
                Fechar Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
