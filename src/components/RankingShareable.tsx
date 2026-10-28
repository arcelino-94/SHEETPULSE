import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { formatCurrencyBR, VendorGoalRankingItem } from '../lib/salesEngine.ts';

interface RankingShareableProps {
  ranking: VendorGoalRankingItem[];
}

export const RankingShareable: React.FC<RankingShareableProps> = ({ ranking }) => {
  return (
    <div className="w-[810px] h-[1012.5px] bg-slate-950 p-10 flex flex-col items-center">
      <h1 className="text-4xl font-black text-white mb-8">Ranking Metas Vendedoras</h1>
      <div className="w-full space-y-6">
        {ranking.map((item, index) => (
          <div key={item.vendedor} className="bg-slate-900 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-black text-white">{index + 1}º {item.vendedor}</span>
              {item.atingiu && <CheckCircle2 className="text-emerald-400 w-8 h-8" />}
            </div>
            <div className="text-xl text-slate-300 mb-2">Vendas: {formatCurrencyBR(item.totalVendas)}</div>
            <div className="text-xl font-bold text-cyan-400">Válido p/ Meta: {formatCurrencyBR(item.volumeValidoMeta)}</div>
            <div className="mt-4">
              <div className="flex justify-between text-lg text-slate-400 mb-2">
                <span>{item.percentualAtingimento}% atingido</span>
                <span>Meta: {formatCurrencyBR(item.meta)}</span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{width: `${Math.min(100, item.percentualAtingimento)}%`}}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
