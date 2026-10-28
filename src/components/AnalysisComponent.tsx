import React from 'react';
import { formatCurrencyBR } from '../lib/salesEngine.ts';

interface AnalysisProps {
  metrics: any;
}

export const AnalysisComponent: React.FC<AnalysisProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-700 p-5 mt-6 shadow-sm">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Análise Inteligente do Período</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg">
             <span className="text-slate-400 block">Vendas</span>
             <span className="font-bold text-white">{formatCurrencyBR(metrics.vendasTotais)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg">
             <span className="text-slate-400 block">Lucro</span>
             <span className="font-bold text-emerald-400">{formatCurrencyBR(metrics.lucro)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg">
             <span className="text-slate-400 block">Despesas</span>
             <span className="font-bold text-rose-400">{formatCurrencyBR(metrics.despesas)}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg">
             <span className="text-slate-400 block">Margem Líquida</span>
             <span className="font-bold text-indigo-400">{(metrics.margemLiquida * 100).toFixed(1)}%</span>
          </div>
      </div>
      <p className="text-xs text-slate-500 mt-4 text-center">Análise interpretativa requer configuração de backend (Gemini API).</p>
    </div>
  );
};
