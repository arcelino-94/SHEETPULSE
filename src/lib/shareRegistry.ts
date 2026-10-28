/**
 * CrediFlow Analytics - Central Shareable Cards Registry
 * Enforces unified naming, dimensions (>=1600px width), and file generation rules.
 */

export const SHAREABLE_CARD_IDS = [
  'overview',
  'diagnostico',
  'conclusao',
  'desempenho',
  'ranking',
  'matriz',
  'mix',
  'margens',
  'comissao',
  'demonstrativo',
  'totais',
  'comparativos',
  'modal-analise',
  'contratos',
] as const;

export type ShareCardId = (typeof SHAREABLE_CARD_IDS)[number];

export interface ShareableCardMeta {
  id: ShareCardId;
  title: string;
  category: 'faturamento_r' | 'vendas_ranking' | 'mix' | 'contratos' | 'diagnostico';
  aspect: 'landscape' | 'vertical';
  targetWidth: number;
  filenamePrefix: string;
}

export const SHAREABLE_CARDS_MAP: Record<ShareCardId, ShareableCardMeta> = {
  overview: {
    id: 'overview',
    title: 'Visão Geral Financeira da Loja',
    category: 'faturamento_r',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_visao_geral',
  },
  diagnostico: {
    id: 'diagnostico',
    title: 'Diagnóstico Executivo do Período',
    category: 'diagnostico',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_diagnostico_executivo',
  },
  conclusao: {
    id: 'conclusao',
    title: 'Conclusão Principal da Controladoria',
    category: 'diagnostico',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_conclusao_principal',
  },
  desempenho: {
    id: 'desempenho',
    title: 'Desempenho e Rentabilidade por Funcionário',
    category: 'faturamento_r',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_desempenho_rentabilidade',
  },
  ranking: {
    id: 'ranking',
    title: 'Ranking de Vendas das Vendedoras',
    category: 'vendas_ranking',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_ranking_vendas',
  },
  matriz: {
    id: 'matriz',
    title: 'Matriz de Vendas por Operação & Vendedora',
    category: 'vendas_ranking',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_matriz_operacoes',
  },
  mix: {
    id: 'mix',
    title: 'Mix Detalhado de Operações',
    category: 'mix',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_mix_operacoes',
  },
  margens: {
    id: 'margens',
    title: 'Maiores Margens de Operações',
    category: 'mix',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_maiores_margens',
  },
  comissao: {
    id: 'comissao',
    title: 'Comissão de Coordenação - Pamella',
    category: 'faturamento_r',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_comissao_coordenacao',
  },
  demonstrativo: {
    id: 'demonstrativo',
    title: 'Demonstrativo Financeiro Consolidado da Loja',
    category: 'faturamento_r',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_demonstrativo_consolidado',
  },
  totais: {
    id: 'totais',
    title: 'Totais Recebidos no Período',
    category: 'faturamento_r',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_totais_recebidos',
  },
  comparativos: {
    id: 'comparativos',
    title: 'Comparativo Temporal: Mês Anterior e Média 3M',
    category: 'diagnostico',
    aspect: 'landscape',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_comparativo_temporal',
  },
  'modal-analise': {
    id: 'modal-analise',
    title: 'Análise Financeira Completa do Período',
    category: 'diagnostico',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_analise_completa',
  },
  contratos: {
    id: 'contratos',
    title: 'Relatório Consolidado de Contratos',
    category: 'contratos',
    aspect: 'vertical',
    targetWidth: 1600,
    filenamePrefix: 'crediflow_relatorio_contratos',
  },
};

export function getCardFilename(cardId: ShareCardId, periodKey = 'periodo'): string {
  const meta = SHAREABLE_CARDS_MAP[cardId];
  const prefix = meta ? meta.filenamePrefix : `crediflow_${cardId}`;
  const cleanPeriod = periodKey.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  return `${prefix}_${cleanPeriod}.png`;
}
