import React from 'react';
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  PiggyBank,
  Award,
  Users,
  PieChart,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useShareCard } from '../../context/ShareContext.tsx';
import { SHAREABLE_CARDS_MAP } from '../../lib/shareRegistry.ts';
import {
  formatCurrencyBR,
  calculateTopOperationMargins,
  calculateVendorGoalsRanking,
} from '../../lib/salesEngine.ts';

export const ShareCardRenderer: React.FC = () => {
  const { activeShareCard, shareData } = useShareCard();

  if (!activeShareCard) return null;

  const meta = SHAREABLE_CARDS_MAP[activeShareCard];
  const {
    periodLabel,
    monthKey,
    sheetRTotais,
    sheetRData,
    deterministicMetrics,
    analysis,
    kpis,
    allRecords = [],
    vendasData,
  } = shareData;

  const nowFormatted = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const volumeLiberado = sheetRTotais?.pagos ?? deterministicMetrics?.vendasTotais ?? 0;
  const taxas = sheetRTotais?.taxas ?? deterministicMetrics?.pagamentoTaxas ?? 0;
  const comissoes = sheetRTotais?.comissaoTotal ?? deterministicMetrics?.comissoesTotais ?? 0;
  const lucroBruto = sheetRTotais?.faturamentoTotal ?? deterministicMetrics?.lucro ?? 0;
  const despesas = sheetRTotais?.despesasGerais ?? deterministicMetrics?.despesas ?? 0;
  const lucroLiquido = sheetRTotais?.lucroLiquido ?? deterministicMetrics?.lucroLiquido ?? 0;
  const margemLiquida = volumeLiberado > 0 ? (lucroLiquido / volumeLiberado) * 100 : 0;

  // Header template component for all cards
  const HeaderTemplate: React.FC<{ subtitle?: string; rule?: string }> = ({ subtitle, rule }) => (
    <div className="border-b-2 border-slate-200 pb-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-600 p-1 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                CrediFlow Analytics
              </span>
              <span className="text-sm font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                2026
              </span>
            </div>
            <p className="text-lg font-medium text-slate-500 mt-1">
              {subtitle || 'Inteligência Financeira e Acompanhamento de Vendas'}
            </p>
          </div>
        </div>

        <div className="text-right bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold uppercase tracking-wider justify-end">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span>Período Oficial</span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
            {periodLabel || monthKey}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {meta.title}
        </h2>
        {rule && (
          <div className="text-base font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-4 py-1.5 rounded-xl">
            {rule}
          </div>
        )}
      </div>
    </div>
  );

  // Footer template component
  const FooterTemplate: React.FC = () => (
    <div className="border-t-2 border-slate-200 pt-6 mt-8 flex items-center justify-between text-slate-500 text-base">
      <div className="flex items-center gap-2 font-medium">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <span>CrediFlow Analytics • Fonte Oficial Planilha R$ e Vendas</span>
      </div>
      <div className="font-mono text-slate-400">
        Gerado para compartilhamento em: {nowFormatted}
      </div>
    </div>
  );

  return (
    <div
      id="offscreen-share-card-container"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '1600px',
        minHeight: '800px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        zIndex: -9999,
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
      className="p-12 bg-white text-slate-900 antialiased"
    >
      {/* 1. VISÃO GERAL FINANCEIRA */}
      {activeShareCard === 'overview' && (
        <div>
          <HeaderTemplate subtitle="Painel Executivo de Faturamento e Margem" />

          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold uppercase tracking-wider text-slate-600">
                  Volume Liberado
                </span>
                <div className="p-3 rounded-2xl bg-cyan-100 text-cyan-700">
                  <DollarSign className="w-7 h-7" />
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                {formatCurrencyBR(volumeLiberado)}
              </div>
              <div className="text-lg text-slate-500 mt-2 font-medium">
                {kpis?.contratosPagos || sheetRData?.totais?.pagos ? 'Contratos pagos apurados' : 'Volume total'}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-emerald-50/60 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold uppercase tracking-wider text-emerald-800">
                  Faturamento (LUCRO)
                </span>
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                  <Wallet className="w-7 h-7" />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-700 font-mono tracking-tight">
                {formatCurrencyBR(lucroBruto)}
              </div>
              <div className="text-lg text-emerald-800 mt-2 font-medium">
                Margem Bruta: {volumeLiberado > 0 ? ((lucroBruto / volumeLiberado) * 100).toFixed(1) : 0}%
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-rose-50/60 border-2 border-rose-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold uppercase tracking-wider text-rose-800">
                  Despesas Gerais
                </span>
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                  <Receipt className="w-7 h-7" />
                </div>
              </div>
              <div className="text-4xl font-black text-rose-700 font-mono tracking-tight">
                -{formatCurrencyBR(despesas)}
              </div>
              <div className="text-lg text-rose-800 mt-2 font-medium">
                Custos fixos e operacionais
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-emerald-100/70 border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold uppercase tracking-wider text-emerald-900">
                  Lucro Líquido Final
                </span>
                <div className="p-3 rounded-2xl bg-emerald-200 text-emerald-800">
                  <PiggyBank className="w-7 h-7" />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-800 font-mono tracking-tight">
                {formatCurrencyBR(lucroLiquido)}
              </div>
              <div className="text-lg text-emerald-900 mt-2 font-medium">
                Margem Líquida: {margemLiquida.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Revenue Breakdown Details */}
          <div className="grid grid-cols-3 gap-6 p-8 rounded-3xl bg-slate-50 border-2 border-slate-200">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-base text-slate-500 font-bold uppercase">Taxas de Assessoria</span>
                <div className="text-3xl font-black text-amber-700 font-mono mt-1">
                  {formatCurrencyBR(taxas)}
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-base text-slate-500 font-bold uppercase">Comissões de Promotoras</span>
                <div className="text-3xl font-black text-emerald-700 font-mono mt-1">
                  {formatCurrencyBR(comissoes)}
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-base text-slate-500 font-bold uppercase">Ticket Médio por Contrato</span>
                <div className="text-3xl font-black text-slate-800 font-mono mt-1">
                  {formatCurrencyBR(kpis?.ticketMedioEmprestimo || 0)}
                </div>
              </div>
            </div>
          </div>

          <FooterTemplate />
        </div>
      )}

      {/* 2. DIAGNÓSTICO EXECUTIVO */}
      {activeShareCard === 'diagnostico' && (
        <div>
          <HeaderTemplate
            subtitle="Síntese Gerencial da Controladoria"
            rule={(analysis?.situacao || (lucroLiquido > 0 ? 'positiva' : 'atencao')) === 'positiva' ? 'Situação Positiva' : 'Ponto de Atenção'}
          />

          {/* Conclusão Principal */}
          <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 mb-8">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Conclusão Principal da Operação
            </span>
            <p className="text-2xl text-slate-800 font-medium leading-relaxed">
              {deterministicMetrics?.conclusaoPrincipal || analysis?.resumo || 'Desempenho operacional consistente e validado nos dados oficiais do período.'}
            </p>
          </div>

          {/* 5 Core Metrics */}
          <div className="grid grid-cols-5 gap-4 mb-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <span className="text-sm text-slate-500 uppercase font-bold block">Vendas Totais</span>
              <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                {formatCurrencyBR(deterministicMetrics?.vendasTotais || volumeLiberado)}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
              <span className="text-sm text-emerald-800 uppercase font-bold block">LUCRO</span>
              <span className="text-2xl font-black text-emerald-700 font-mono block mt-1">
                {formatCurrencyBR(deterministicMetrics?.lucro || lucroBruto)}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-200">
              <span className="text-sm text-rose-800 uppercase font-bold block">Despesas</span>
              <span className="text-2xl font-black text-rose-700 font-mono block mt-1">
                -{formatCurrencyBR(deterministicMetrics?.despesas || despesas)}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-100 border-2 border-emerald-300">
              <span className="text-sm text-emerald-900 uppercase font-bold block">Lucro Líquido</span>
              <span className="text-2xl font-black text-emerald-800 font-mono block mt-1">
                {formatCurrencyBR(deterministicMetrics?.lucroLiquido || lucroLiquido)}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-cyan-50 border-2 border-cyan-200">
              <span className="text-sm text-cyan-800 uppercase font-bold block">Margem Líquida</span>
              <span className="text-2xl font-black text-cyan-700 font-mono block mt-1">
                {((deterministicMetrics?.margemLiquida || margemLiquida / 100) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Comparison vs Mês Anterior */}
          {deterministicMetrics?.mesAnterior && (
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <Scale className="w-6 h-6 text-cyan-600" />
                <span>Comparativo vs. Mês Anterior ({deterministicMetrics.mesAnterior.periodo})</span>
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-sm text-slate-500 uppercase font-bold block">Variação Vendas</span>
                  <div className="text-2xl font-black font-mono mt-1 text-slate-900">
                    {formatCurrencyBR(deterministicMetrics.mesAnterior.variacoes.vendasTotaisDiff)}
                    <span className="text-base text-cyan-600 ml-2 font-bold">
                      ({deterministicMetrics.mesAnterior.variacoes.vendasTotaisPercent > 0 ? '+' : ''}{deterministicMetrics.mesAnterior.variacoes.vendasTotaisPercent}%)
                    </span>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-sm text-slate-500 uppercase font-bold block">Variação Lucro</span>
                  <div className="text-2xl font-black font-mono mt-1 text-emerald-700">
                    {formatCurrencyBR(deterministicMetrics.mesAnterior.variacoes.lucroDiff)}
                    <span className="text-base text-emerald-600 ml-2 font-bold">
                      ({deterministicMetrics.mesAnterior.variacoes.lucroPercent > 0 ? '+' : ''}{deterministicMetrics.mesAnterior.variacoes.lucroPercent}%)
                    </span>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-sm text-slate-500 uppercase font-bold block">Variação Despesas</span>
                  <div className="text-2xl font-black font-mono mt-1 text-rose-700">
                    {formatCurrencyBR(deterministicMetrics.mesAnterior.variacoes.despesasDiff)}
                    <span className="text-base text-rose-600 ml-2 font-bold">
                      ({deterministicMetrics.mesAnterior.variacoes.despesasPercent > 0 ? '+' : ''}{deterministicMetrics.mesAnterior.variacoes.despesasPercent}%)
                    </span>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                  <span className="text-sm text-slate-500 uppercase font-bold block">Variação Lucro Líquido</span>
                  <div className="text-2xl font-black font-mono mt-1 text-emerald-800">
                    {formatCurrencyBR(deterministicMetrics.mesAnterior.variacoes.lucroLiquidoDiff)}
                    <span className="text-base text-emerald-600 ml-2 font-bold">
                      ({deterministicMetrics.mesAnterior.variacoes.lucroLiquidoPercent > 0 ? '+' : ''}{deterministicMetrics.mesAnterior.variacoes.lucroLiquidoPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <FooterTemplate />
        </div>
      )}

      {/* 3. CONCLUSÃO PRINCIPAL */}
      {activeShareCard === 'conclusao' && (
        <div>
          <HeaderTemplate subtitle="Parecer Sintético da Controladoria" />
          <div className="p-10 rounded-3xl bg-slate-50 border-2 border-slate-200 mb-8">
            <span className="text-base font-bold text-slate-500 uppercase tracking-wider block mb-4">
              Síntese Executiva do Período
            </span>
            <p className="text-3xl text-slate-900 font-bold leading-relaxed mb-6">
              {deterministicMetrics?.conclusaoPrincipal || analysis?.resumo || 'Operação com resultado financeiro positivo e metas alinhadas ao planejamento estratégico.'}
            </p>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-200">
              <div>
                <span className="text-sm text-slate-500 uppercase font-bold block">Volume Total</span>
                <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">
                  {formatCurrencyBR(volumeLiberado)}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 uppercase font-bold block">Lucro Líquido</span>
                <span className="text-3xl font-black text-emerald-700 font-mono mt-1 block">
                  {formatCurrencyBR(lucroLiquido)}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 uppercase font-bold block">Margem Líquida</span>
                <span className="text-3xl font-black text-cyan-700 font-mono mt-1 block">
                  {margemLiquida.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 4. DESEMPENHO E RENTABILIDADE POR FUNCIONÁRIO */}
      {activeShareCard === 'desempenho' && (
        <div>
          <HeaderTemplate subtitle="Rentabilidade Individual de Colaboradores e Sócios" />
          <div className="rounded-3xl border-2 border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-lg">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-4 px-6">Colaboradora</th>
                  <th className="py-4 px-4 text-right">Vol. Liberado</th>
                  <th className="py-4 px-4 text-right">Taxas</th>
                  <th className="py-4 px-4 text-right">Com. J2</th>
                  <th className="py-4 px-4 text-right">Taxa + Com.</th>
                  <th className="py-4 px-4 text-right">Custo Loja</th>
                  <th className="py-4 px-6 text-right">Rentabilidade Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {(sheetRData?.funcionarios || []).map((f) => (
                  <tr key={f.vendedor} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">{f.vendedor}</td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800">{formatCurrencyBR(f.pagos)}</td>
                    <td className="py-4 px-4 text-right font-mono text-amber-700">{formatCurrencyBR(f.taxas)}</td>
                    <td className="py-4 px-4 text-right font-mono text-emerald-700">{formatCurrencyBR(f.comissaoJ2)}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">{formatCurrencyBR(f.faturamentoTotal)}</td>
                    <td className="py-4 px-4 text-right font-mono text-rose-700">-{formatCurrencyBR(Math.abs(f.custoFuncionario))}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-emerald-700">{formatCurrencyBR(f.rentabilidade)}</td>
                  </tr>
                ))}
                {/* Linha de Totais da Loja */}
                {sheetRData?.totais && (
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="py-5 px-6 font-black uppercase text-slate-900">Total da Loja</td>
                    <td className="py-5 px-4 text-right font-mono font-black text-slate-900">{formatCurrencyBR(sheetRData.totais.pagos)}</td>
                    <td className="py-5 px-4 text-right font-mono font-bold text-amber-700">{formatCurrencyBR(sheetRData.totais.taxas)}</td>
                    <td className="py-5 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrencyBR(sheetRData.totais.comissaoJ2)}</td>
                    <td className="py-5 px-4 text-right font-mono font-black text-slate-900">{formatCurrencyBR(sheetRData.totais.faturamentoTotal)}</td>
                    <td className="py-5 px-4 text-right font-mono font-bold text-rose-700">-{formatCurrencyBR(sheetRData.totais.custoTotal)}</td>
                    <td className="py-5 px-6 text-right font-mono font-black text-emerald-800 text-xl">{formatCurrencyBR(sheetRData.totais.rentabilidadeTotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 5. RANKING DE VENDAS DAS VENDEDORAS */}
      {activeShareCard === 'ranking' && (
        <div>
          <HeaderTemplate
            subtitle="Classificação Oficial da Equipe de Vendas"
            rule="Ordenado por Vendas Totais. Elegível exclui Refin, Refin da Port e Cartão."
          />
          <div className="rounded-3xl border-2 border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-lg">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-4 px-4 w-20 text-center">Posição</th>
                  <th className="py-4 px-6">Vendedora</th>
                  <th className="py-4 px-6 text-right font-black text-slate-900">Vendas Totais</th>
                  <th className="py-4 px-6 text-right">Elegível Comissão</th>
                  <th className="py-4 px-6 text-right">Meta Individual</th>
                  <th className="py-4 px-6 text-left w-72">Atingimento</th>
                  <th className="py-4 px-6 text-right">Falta p/ Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {(vendasData?.ranking || calculateVendorGoalsRanking(allRecords, 'vendas_totais', shareData?.monthKey || '2026-10')).map((v: any, idx: number) => (
                  <tr key={v.vendedor || v.nome} className="hover:bg-slate-50">
                    <td className="py-4 px-4 text-center font-bold">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl font-mono text-base font-black ${
                        idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        idx === 1 ? 'bg-slate-200 text-slate-800' :
                        idx === 2 ? 'bg-amber-50 text-amber-900' : 'text-slate-600'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-xl text-slate-900">{v.vendedor || (v as any).nome}</td>
                    <td className="py-4 px-6 text-right font-mono font-black text-xl text-slate-900">
                      {formatCurrencyBR(v.vendasTotais ?? (v as any).volumeTotal ?? 0)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-cyan-700">
                      {formatCurrencyBR(v.elegivelComissao ?? v.valorValidoMeta ?? 0)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-600">
                      {formatCurrencyBR(v.metaComissao ?? v.metaIndividual ?? 50000)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (v.atingimento ?? v.percentualAtingimento ?? 0) >= 100
                                ? 'bg-emerald-500'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, v.atingimento ?? v.percentualAtingimento ?? 0)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-lg text-slate-800 w-16 text-right">
                          {(v.atingimento ?? v.percentualAtingimento ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-700">
                      {(v.falta ?? v.quantoFalta ?? 0) > 0 ? formatCurrencyBR(v.falta ?? v.quantoFalta) : (
                        <span className="text-emerald-700 font-black">Meta Batida!</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 6. MATRIZ DE VENDAS POR OPERAÇÃO & VENDEDORA */}
      {activeShareCard === 'matriz' && (
        <div>
          <HeaderTemplate subtitle="Matriz de Cruzamento: Vendedoras x Operações" />
          <div className="rounded-3xl border-2 border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Vendedora</th>
                  {(vendasData?.matrix?.operations || ['MARGEM', 'REFIN', 'PORTABILIDADE', 'CARTAO', 'FGTS']).map((op: string) => (
                    <th key={op} className="py-3 px-3 text-right">{op}</th>
                  ))}
                  <th className="py-3 px-4 text-right font-black text-slate-900 bg-slate-200/60">Total Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {((vendasData?.matrix?.rows || []) as any[]).map((r) => (
                  <tr key={r.vendedora} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.vendedora}</td>
                    {(vendasData?.matrix?.operations || []).map((op: string) => (
                      <td key={op} className="py-3 px-3 text-right font-mono text-slate-700">
                        {r.operations?.[op] ? formatCurrencyBR(r.operations[op]) : '-'}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 bg-slate-50">
                      {formatCurrencyBR(r.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 7. MIX DETALHADO DE OPERAÇÕES */}
      {activeShareCard === 'mix' && (
        <div>
          <HeaderTemplate subtitle="Distribuição Consolidada de Produtos e Contratos" />
          <div className="rounded-3xl border-2 border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-lg">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-4 px-6">Operação</th>
                  <th className="py-4 px-4 text-right">Contratos</th>
                  <th className="py-4 px-6 text-right">Vol. Liberado</th>
                  <th className="py-4 px-4 text-right">Taxa Assessoria</th>
                  <th className="py-4 px-4 text-right">% Taxa</th>
                  <th className="py-4 px-4 text-right">Comissões</th>
                  <th className="py-4 px-6 text-right">Faturamento Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {/* Fallback to contracts grouped by operation if specific mix not provided */}
                {allRecords.length > 0 &&
                  Object.entries(
                    allRecords.reduce((acc, r) => {
                      const op = r.operacao || 'OUTROS';
                      if (!acc[op]) acc[op] = { count: 0, vol: 0, taxa: 0, com: 0 };
                      acc[op].count += 1;
                      acc[op].vol += r.valorEmprestimo || 0;
                      acc[op].taxa += r.valorAssessoria || 0;
                      acc[op].com += r.totalComissao || 0;
                      return acc;
                    }, {} as Record<string, any>)
                  )
                    .sort((a, b) => b[1].vol - a[1].vol)
                    .map(([op, data]) => (
                      <tr key={op} className="hover:bg-slate-50">
                        <td className="py-4 px-6 font-bold text-slate-900">{op}</td>
                        <td className="py-4 px-4 text-right font-mono text-slate-700">{data.count}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">{formatCurrencyBR(data.vol)}</td>
                        <td className="py-4 px-4 text-right font-mono text-amber-700">{formatCurrencyBR(data.taxa)}</td>
                        <td className="py-4 px-4 text-right font-mono text-slate-600">
                          {data.vol > 0 ? ((data.taxa / data.vol) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-emerald-700">{formatCurrencyBR(data.com)}</td>
                        <td className="py-4 px-6 text-right font-mono font-black text-emerald-800">
                          {formatCurrencyBR(data.taxa + data.com)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 8. MAIORES MARGENS DE OPERAÇÕES */}
      {activeShareCard === 'margens' && (() => {
        const { topTaxaMargins, topComissaoMargins } = calculateTopOperationMargins(allRecords);
        return (
          <div>
            <HeaderTemplate subtitle="Top Operações por Retorno em Taxa e Comissão" />
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="p-8 rounded-3xl bg-amber-50/60 border-2 border-amber-200">
                <h3 className="text-2xl font-black text-amber-900 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-amber-700" />
                  <span>Maior Retorno em Taxa de Assessoria</span>
                </h3>
                <div className="space-y-4">
                  {topTaxaMargins.map((m, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-mono font-bold text-amber-700">#{i + 1}</span>
                        <span className="text-lg font-bold text-slate-900 ml-3">{m.operacao}</span>
                        <span className="text-sm text-slate-500 ml-2 font-mono">({m.taxaMargin}% margem)</span>
                      </div>
                      <span className="text-xl font-black font-mono text-amber-800">
                        {formatCurrencyBR(m.taxa)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-emerald-50/60 border-2 border-emerald-200">
                <h3 className="text-2xl font-black text-emerald-900 mb-6 flex items-center gap-3">
                  <Award className="w-7 h-7 text-emerald-700" />
                  <span>Maior Retorno em Comissões de Promotora</span>
                </h3>
                <div className="space-y-4">
                  {topComissaoMargins.map((m, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-mono font-bold text-emerald-700">#{i + 1}</span>
                        <span className="text-lg font-bold text-slate-900 ml-3">{m.operacao}</span>
                        <span className="text-sm text-slate-500 ml-2 font-mono">({m.comissaoMargin}% margem)</span>
                      </div>
                      <span className="text-xl font-black font-mono text-emerald-800">
                        {formatCurrencyBR(m.comissao)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <FooterTemplate />
          </div>
        );
      })()}

      {/* 9. COMISSÃO DE COORDENAÇÃO - PAMELLA */}
      {activeShareCard === 'comissao' && (
        <div>
          <HeaderTemplate subtitle="Apuração Oficial da Coordenação de Vendas" />
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">Metas e Faturamento Base</h3>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-500 uppercase font-bold block">Faturamento Base Loja</span>
                  <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">
                    {formatCurrencyBR(sheetRData?.pamellaComissao?.faturamento || lucroBruto)}
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-500 uppercase font-bold block">Meta 1 (R$ 80.000)</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                    {sheetRData?.pamellaComissao?.meta1?.batida ? 'Meta Batida com Sucesso' : 'Em andamento'}
                  </span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-sm text-slate-500 uppercase font-bold block">Meta 2 (R$ 125.000)</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                    {sheetRData?.pamellaComissao?.meta2?.batida ? 'Meta Batida com Sucesso' : 'Em andamento'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-emerald-50/60 border-2 border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-base font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                  Comissão Apurada a Pagar
                </span>
                <div className="text-6xl font-black text-emerald-700 font-mono my-4">
                  {formatCurrencyBR(sheetRData?.pamellaComissao?.comissaoAPagar || 0)}
                </div>
                <p className="text-xl text-emerald-900 leading-relaxed font-medium">
                  Cálculo oficial conforme parâmetros da planilha R$, considerando atingimento de faturamento e deduções aplicáveis.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-emerald-200 mt-6">
                <span className="text-sm text-slate-500 uppercase font-bold block">Coordenação Responsável</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">Pamella</span>
              </div>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 10. DEMONSTRATIVO CONSOLIDADO DA LOJA */}
      {activeShareCard === 'demonstrativo' && (
        <div>
          <HeaderTemplate subtitle="Demonstrativo Contábil e Financeiro Oficial" />
          <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 mb-8">
            <div className="space-y-4 text-xl">
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600 font-bold">(+) Vendas Totais (Liberado)</span>
                <span className="font-black text-slate-900 font-mono">{formatCurrencyBR(sheetRTotais?.pagos || volumeLiberado)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600">(+) Comissão J2</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyBR(sheetRTotais?.comissaoJ2 || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600">(+) Comissão SEMPRE</span>
                <span className="font-bold text-slate-800 font-mono">{formatCurrencyBR(sheetRTotais?.comissaoSempre || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-slate-600">(+) Taxas de Assessoria</span>
                <span className="font-bold text-amber-700 font-mono">{formatCurrencyBR(sheetRTotais?.taxas || taxas)}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b-2 border-emerald-300 bg-emerald-50 px-6 rounded-2xl">
                <span className="font-black text-emerald-900">(=) Faturamento Bruto (LUCRO)</span>
                <span className="font-black text-emerald-700 font-mono text-3xl">{formatCurrencyBR(sheetRTotais?.faturamentoTotal || lucroBruto)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200">
                <span className="text-rose-700 font-medium">(-) Despesas Administrativas e Gerais</span>
                <span className="font-bold text-rose-700 font-mono">-{formatCurrencyBR(sheetRTotais?.despesasGerais || despesas)}</span>
              </div>
              <div className="flex items-center justify-between py-5 bg-slate-900 text-white px-8 rounded-3xl mt-4">
                <span className="font-black text-2xl uppercase">(=) Lucro Líquido Final da Loja</span>
                <span className="font-black text-4xl text-emerald-400 font-mono">{formatCurrencyBR(sheetRTotais?.lucroLiquido || lucroLiquido)}</span>
              </div>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 11. TOTAIS RECEBIDOS NO PERÍODO */}
      {activeShareCard === 'totais' && (
        <div>
          <HeaderTemplate subtitle="Totais e Entradas Financeiras em Conta" />
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="p-8 rounded-3xl bg-amber-50/70 border-2 border-amber-200">
              <span className="text-base text-amber-900 font-bold uppercase block mb-2">Total de Taxas Recebidas</span>
              <div className="text-4xl font-black text-amber-700 font-mono">
                {formatCurrencyBR(taxas)}
              </div>
              <p className="text-slate-500 mt-3 text-base">Assessoria direta ao cliente</p>
            </div>
            <div className="p-8 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200">
              <span className="text-base text-emerald-900 font-bold uppercase block mb-2">Total de Comissões Recebidas</span>
              <div className="text-4xl font-black text-emerald-700 font-mono">
                {formatCurrencyBR(comissoes)}
              </div>
              <p className="text-slate-500 mt-3 text-base">Promotoras J2, Sempre, DG e GFT</p>
            </div>
            <div className="p-8 rounded-3xl bg-cyan-50/70 border-2 border-cyan-200">
              <span className="text-base text-cyan-900 font-bold uppercase block mb-2">Faturamento Consolidado</span>
              <div className="text-4xl font-black text-cyan-800 font-mono">
                {formatCurrencyBR(lucroBruto)}
              </div>
              <p className="text-slate-500 mt-3 text-base">Taxas + Comissões</p>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 12. COMPARATIVO TEMPORAL */}
      {activeShareCard === 'comparativos' && (
        <div>
          <HeaderTemplate subtitle="Variação Percentual e Absoluta vs. Mês Anterior" />
          <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200 mb-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase block">Vendas Totais</span>
                <div className="text-3xl font-black text-slate-900 font-mono mt-2">
                  {formatCurrencyBR(volumeLiberado)}
                </div>
                {deterministicMetrics?.mesAnterior && (
                  <div className="text-lg font-bold text-cyan-700 mt-2">
                    Variação: {deterministicMetrics.mesAnterior.variacoes.vendasTotaisPercent > 0 ? '+' : ''}
                    {deterministicMetrics.mesAnterior.variacoes.vendasTotaisPercent}%
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <span className="text-sm font-bold text-slate-500 uppercase block">Lucro Líquido</span>
                <div className="text-3xl font-black text-emerald-700 font-mono mt-2">
                  {formatCurrencyBR(lucroLiquido)}
                </div>
                {deterministicMetrics?.mesAnterior && (
                  <div className="text-lg font-bold text-emerald-700 mt-2">
                    Variação: {deterministicMetrics.mesAnterior.variacoes.lucroLiquidoPercent > 0 ? '+' : ''}
                    {deterministicMetrics.mesAnterior.variacoes.lucroLiquidoPercent}%
                  </div>
                )}
              </div>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 13. MODAL ANÁLISE COMPLETA */}
      {activeShareCard === 'modal-analise' && (
        <div>
          <HeaderTemplate subtitle="Relatório Financeiro e Diagnóstico Detalhado" />
          <div className="space-y-6 mb-8">
            <div className="p-8 rounded-3xl bg-slate-50 border-2 border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Conclusão Executiva</h3>
              <p className="text-xl text-slate-800 leading-relaxed font-medium">
                {deterministicMetrics?.conclusaoPrincipal || analysis?.resumo || 'Análise financeira oficial baseada nas métricas do período.'}
              </p>
            </div>

            {/* Insights & Recomendações */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
                <h4 className="text-lg font-black text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Destaques Positivos</span>
                </h4>
                <ul className="space-y-2 text-base text-emerald-950">
                  {analysis?.insightsPositivos?.map((ins: any, i: number) => (
                    <li key={i}>• <strong>{ins.titulo}:</strong> {ins.descricao} ({ins.numeroBase})</li>
                  )) || <li>• Margem líquida mantida em patamar saudável com controle rigoroso de custos.</li>}
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-cyan-50 border border-cyan-200">
                <h4 className="text-lg font-black text-cyan-900 mb-3 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-cyan-700" />
                  <span>Recomendações Estratégicas</span>
                </h4>
                <ul className="space-y-2 text-base text-cyan-950">
                  {analysis?.recomendacoes?.map((rec: any, i: number) => (
                    <li key={i}>• <strong>{rec.problemaOportunidade}:</strong> {rec.acao}</li>
                  )) || <li>• Focar no aumento do volume de operações elegíveis para maximizar comissionamento.</li>}
                </ul>
              </div>
            </div>
          </div>
          <FooterTemplate />
        </div>
      )}

      {/* 14. RELATÓRIO DE CONTRATOS */}
      {activeShareCard === 'contratos' && (
        <div>
          <HeaderTemplate subtitle="Amostra Oficial de Contratos Auditados" />
          <div className="rounded-3xl border-2 border-slate-200 overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Data Pag.</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Convênio</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Vendedora</th>
                  <th className="py-3 px-4 text-right">Valor Liberado</th>
                  <th className="py-3 px-4 text-right">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {allRecords.slice(0, 15).map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{c.dataPagamento || c.dataDigitacao}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.cliente}</td>
                    <td className="py-3 px-4 text-slate-700">{c.convenio}</td>
                    <td className="py-3 px-4 text-slate-700">{c.operacao}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.vendedor}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrencyBR(c.valorEmprestimo)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">{formatCurrencyBR(c.valorAssessoria)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <FooterTemplate />
        </div>
      )}
    </div>
  );
};
