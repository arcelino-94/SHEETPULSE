import React, { useState } from 'react';
import { Search, RotateCcw, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterState, SalesRecord, normalizeVendorName } from '../lib/salesEngine.ts';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  records: SalesRecord[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  records,
  onReset,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Normalized Vendors list
  const vendors = Array.from(
    new Set(records.map((r) => normalizeVendorName(r.vendedor)).filter((v) => v !== 'NÃO INFORMADO'))
  ).sort();

  const statuses = Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort();
  const banks = Array.from(new Set(records.map((r) => r.banco).filter(Boolean))).sort();
  const promotoras = Array.from(new Set(records.map((r) => r.promotora).filter(Boolean))).sort();
  const convenios = Array.from(new Set(records.map((r) => r.convenio).filter(Boolean))).sort();

  // Active filters inside 'Mais filtros'
  const secondaryFiltersCount =
    (filters.searchQuery ? 1 : 0) +
    (filters.status && filters.status !== 'ALL' ? 1 : 0) +
    (filters.operacao && filters.operacao !== 'ALL' ? 1 : 0) +
    (filters.banco && filters.banco !== 'ALL' ? 1 : 0) +
    (filters.promotora && filters.promotora !== 'ALL' ? 1 : 0) +
    (filters.convenio && filters.convenio !== 'ALL' ? 1 : 0) +
    (filters.apenasSemComissao ? 1 : 0) +
    (filters.apenasAssessoriaPaga ? 1 : 0);

  const totalActiveCount =
    (filters.vendedor && filters.vendedor !== 'ALL' ? 1 : 0) + secondaryFiltersCount;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 shadow-sm space-y-2">
      {/* Primary Row: Vendedora Outside + Mais Filtros Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Vendedora Selector (Visible Outside on Mobile & Desktop) */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <select
              value={filters.vendedor || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, vendedor: e.target.value }))}
              aria-label="Filtrar por vendedora"
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Todas as Vendedoras</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search on Desktop */}
          <div className="relative hidden md:block w-52 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente, banco..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-sm"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side: 'Mais filtros' toggle & Reset */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
              showMoreFilters || secondaryFiltersCount > 0
                ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Mais filtros</span>
            {secondaryFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {secondaryFiltersCount}
              </span>
            )}
            {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {totalActiveCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* 'Mais Filtros' Disclosure Accordion */}
      {showMoreFilters && (
        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 animate-fade-in text-xs">
          {/* Quick Search on Mobile */}
          <div className="relative md:hidden col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cliente, contrato, CPF..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-sm"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Status
            </label>
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Todos os Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Promotora Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Promotora
            </label>
            <select
              value={filters.promotora || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, promotora: e.target.value }))}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Todas as Promotoras</option>
              {promotoras.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Banco Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Banco
            </label>
            <select
              value={filters.banco || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, banco: e.target.value }))}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Todos os Bancos</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Convênio Dropdown */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
              Convênio
            </label>
            <select
              value={filters.convenio || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, convenio: e.target.value }))}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">Todos os Convênios</option>
              {convenios.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Status Toggles */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  apenasSemComissao: !prev.apenasSemComissao,
                }))
              }
              className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                filters.apenasSemComissao
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              Apenas sem comissão
            </button>

            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  apenasAssessoriaPaga: !prev.apenasAssessoriaPaga,
                }))
              }
              className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                filters.apenasAssessoriaPaga
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              Apenas taxa paga
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
