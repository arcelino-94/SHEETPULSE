import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { SalesRecord, formatCurrencyBR, safeDate } from '../lib/salesEngine.ts';
import { ShareCardButton } from './ShareCardButton.tsx';

interface SalesTableProps {
  records: SalesRecord[];
  defaultCollapsed?: boolean;
}

type SortField =
  | 'dataPagamento'
  | 'dataDigitacao'
  | 'cliente'
  | 'vendedor'
  | 'banco'
  | 'operacao'
  | 'valorEmprestimo'
  | 'valorAssessoria'
  | 'totalComissao'
  | 'status';

export function maskCPF(cpf?: string | null): string {
  if (!cpf) return '-';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.***.***-${clean.slice(9)}`;
  }
  const parts = cpf.trim().split(/[.-]/);
  if (parts.length === 4) {
    return `${parts[0]}.***.***-${parts[3]}`;
  }
  return cpf.length > 5 ? `${cpf.slice(0, 3)}***${cpf.slice(-2)}` : '***';
}

export const SalesTable: React.FC<SalesTableProps> = ({ records, defaultCollapsed = false }) => {
  const tableCardRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showSemComissaoAudit, setShowSemComissaoAudit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('dataDigitacao');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SalesRecord | null>(null);

  // Privacy: CPF masked by default
  const [revealAllCPFs, setRevealAllCPFs] = useState<boolean>(false);
  const [revealedRowIds, setRevealedRowIds] = useState<Record<string, boolean>>({});

  // Mobile row expansion state
  const [expandedMobileRowId, setExpandedMobileRowId] = useState<string | null>(null);

  // Privacy modal for CSV export
  const [showExportModal, setShowExportModal] = useState(false);

  // Close contract modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRecord) setSelectedRecord(null);
        if (showExportModal) setShowExportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord, showExportModal]);

  // Contratos pagos sem comissão (auditoria)
  const contratosPagosSemComissao = useMemo(() => {
    return records.filter((r) => {
      return r.status === 'PAGO' && !r.isAssessoria && r.totalComissao === 0;
    });
  }, [records]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'dataDigitacao') {
        aVal = safeDate(a.rawDateDigitacao)?.getTime() || safeDate(a.rawDatePagamento)?.getTime() || 0;
        bVal = safeDate(b.rawDateDigitacao)?.getTime() || safeDate(b.rawDatePagamento)?.getTime() || 0;
      } else if (sortField === 'dataPagamento') {
        aVal = safeDate(a.rawDatePagamento)?.getTime() || safeDate(a.rawDateDigitacao)?.getTime() || 0;
        bVal = safeDate(b.rawDatePagamento)?.getTime() || safeDate(b.rawDateDigitacao)?.getTime() || 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleRowCPF = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRevealedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getDisplayedCPF = (r: SalesRecord) => {
    if (revealAllCPFs || revealedRowIds[r.id]) {
      return r.cpf || '-';
    }
    return maskCPF(r.cpf);
  };

  const executeExport = (maskData: boolean) => {
    setShowExportModal(false);
    if (records.length === 0) return;

    const header = [
      'Carimbo',
      'CPF',
      'Cliente',
      'Data Digitacao',
      'Data Pagamento',
      'Convenio',
      'Operacao',
      'Banco',
      'Promotora',
      'Valor Emprestimo',
      'Taxa Assessoria',
      'Cliente Pagou Assessoria',
      'Taxa Cartao',
      'Vendedor',
      'Digitador',
      'Numero Contrato',
      'Status',
      'Comissao Faturada',
    ];

    const rows = records.map((r) => [
      `"${r.carimbo}"`,
      `"${maskData ? maskCPF(r.cpf) : r.cpf}"`,
      `"${r.cliente.replace(/"/g, '""')}"`,
      `"${r.dataDigitacao}"`,
      `"${r.dataPagamento}"`,
      `"${r.convenio}"`,
      `"${r.operacao}"`,
      `"${r.banco}"`,
      `"${r.promotora}"`,
      `"${r.valorEmprestimo}"`,
      `"${r.valorAssessoria}"`,
      `"${r.clientePagouAssessoria}"`,
      `"${r.taxaCartao}"`,
      `"${r.vendedor}"`,
      `"${r.digitador}"`,
      `"${r.numeroContrato}"`,
      `"${r.status}"`,
      `"${r.totalComissao}"`,
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `livia-cred-contratos-${maskData ? 'mascarado' : 'completo'}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. SEÇÃO AUDITORIA: Contratos Pagos sem Comissão */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSemComissaoAudit(!showSemComissaoAudit)}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                contratosPagosSemComissao.length > 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Auditoria de Contratos Pagos Sem Comissão
                </h4>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    contratosPagosSemComissao.length > 0
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  {contratosPagosSemComissao.length}{' '}
                  {contratosPagosSemComissao.length === 1 ? 'pendência' : 'pendências'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {showSemComissaoAudit
                  ? 'Clique para recolher auditoria de comissões'
                  : 'Oculta por padrão • Clique para expandir contratos pagos sem comissão preenchida'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{showSemComissaoAudit ? 'Recolher' : 'Auditar'}</span>
            {showSemComissaoAudit ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </button>

        {showSemComissaoAudit && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
            {contratosPagosSemComissao.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Nenhum contrato pago sem comissão no período filtrado! Todas as comissões estão devidamente preenchidas.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Mostrando <strong>{contratosPagosSemComissao.length}</strong> contratos pagos sem comissão:
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Volume Total: {formatCurrencyBR(contratosPagosSemComissao.reduce((acc, r) => acc + r.valorEmprestimo, 0))}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        <th className="py-2 px-3">Data Dig.</th>
                        <th className="py-2 px-3">Cliente / CPF</th>
                        <th className="py-2 px-3">Contrato</th>
                        <th className="py-2 px-3">Promotora</th>
                        <th className="py-2 px-3">Banco / Operação</th>
                        <th className="py-2 px-3 text-right">Volume Liberado</th>
                        <th className="py-2 px-2 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
                      {contratosPagosSemComissao.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {r.dataDigitacao}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                              {r.cliente}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {getDisplayedCPF(r)}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-cyan-600 dark:text-cyan-400 text-[11px]">
                            {r.numeroContrato}
                          </td>
                          <td className="py-2 px-3 text-amber-600 dark:text-amber-300 font-medium">
                            {r.promotora}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {r.banco} • {r.operacao}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white font-mono">
                            {formatCurrencyBR(r.valorEmprestimo)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => setSelectedRecord(r)}
                              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] cursor-pointer"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. TABELA PRINCIPAL DE CONTRATOS */}
      <div
        ref={tableCardRef}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
      >
        {/* Top Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Contratos & Auditoria ({records.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* CPF Privacy Toggle */}
            <button
              onClick={() => setRevealAllCPFs(!revealAllCPFs)}
              title={revealAllCPFs ? 'Ocultar e mascarar todos os CPFs' : 'Mostrar todos os CPFs'}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {revealAllCPFs ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ocultar CPFs</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Revelar CPFs</span>
                </>
              )}
            </button>

            {/* CSV Export with Privacy Notice */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Exportar dados filtrados em CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>Exportar CSV</span>
            </button>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm"
            >
              <option value={15}>15 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>

            <ShareCardButton cardId="contratos" />
          </div>
        </div>

        {/* Table Container with Sticky Header */}
        <div className="overflow-x-auto flex-1 scrollbar-thin max-h-[600px]">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider select-none shadow-sm">
              <tr>
                <th
                  onClick={() => handleSort('dataDigitacao')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Data Dig.</span>
                    {sortField === 'dataDigitacao' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cliente')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Cliente / CPF</span>
                    {sortField === 'cliente' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vendedor')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Vendedora</span>
                    {sortField === 'vendedor' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th className="py-3 px-3">Banco / Promotora</th>
                <th className="py-3 px-3">Operação</th>
                <th
                  onClick={() => handleSort('valorEmprestimo')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Vol. Liberado</span>
                    {sortField === 'valorEmprestimo' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valorAssessoria')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Taxa Assessoria</span>
                    {sortField === 'valorAssessoria' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalComissao')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Comissão Faturada</span>
                    {sortField === 'totalComissao' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {sortField === 'status' &&
                      (sortAsc ? <ChevronUp className="w-3 h-3 text-cyan-500" /> : <ChevronDown className="w-3 h-3 text-cyan-500" />)}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    Nenhum contrato encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isRowExpanded = expandedMobileRowId === r.id;
                  const displayedCPF = getDisplayedCPF(r);
                  const isCPFVisible = revealAllCPFs || revealedRowIds[r.id];

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setSelectedRecord(r)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                      >
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {r.dataDigitacao}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition truncate max-w-[170px]">
                            {r.cliente}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            <span>{displayedCPF}</span>
                            <button
                              type="button"
                              onClick={(e) => toggleRowCPF(e, r.id)}
                              className="text-slate-400 hover:text-cyan-500 transition p-0.5"
                              title={isCPFVisible ? 'Ocultar CPF' : 'Mostrar CPF'}
                            >
                              {isCPFVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {r.vendedor}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800 dark:text-slate-200">{r.banco}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">{r.promotora}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {r.operacao}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {r.status === 'PAGO' ? (
                            formatCurrencyBR(r.valorEmprestimo)
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 line-through">
                              {formatCurrencyBR(r.valorEmprestimo)}
                            </span>
                          )}
                        </td>
                        {/* Separate Assessoria Value from Payment Status */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-300">
                          {r.valorAssessoria > 0 ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span>{formatCurrencyBR(r.valorAssessoria)}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                                  r.clientePagouAssessoria === 'SIM'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                }`}
                              >
                                {r.clientePagouAssessoria === 'SIM' ? 'Paga' : 'Pendente'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {r.totalComissao > 0 ? (
                            formatCurrencyBR(r.totalComissao)
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 font-normal">R$ 0,00</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${
                              r.status === 'PAGO'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                : r.status === 'CANCELADO'
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({records.length} contratos)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
            >
              Primeira
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white cursor-pointer"
            >
              Última
            </button>
          </div>
        </div>
      </div>

      {/* CSV Export Privacy Modal */}
      {showExportModal && (
        <div
          onClick={() => setShowExportModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4 cursor-default"
          >
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <Lock className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Aviso de Proteção de Dados (LGPD)
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O relatório contém registros de contratos com dados de clientes. Para proteger a privacidade e conformidade com a LGPD, recomendamos exportar os CPFs mascarados.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => executeExport(true)}
                className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Exportar com CPFs Mascarados (Recomendado)</span>
              </button>

              <button
                onClick={() => executeExport(false)}
                className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Exportar com CPFs Completos (Auditoria)</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowExportModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedRecord && (
        <div
          onClick={() => setSelectedRecord(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-bold">
                  Detalhes do Contrato
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {selectedRecord.cliente}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">CPF</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{getDisplayedCPF(selectedRecord)}</span>
                  <button
                    onClick={(e) => toggleRowCPF(e, selectedRecord.id)}
                    className="text-slate-400 hover:text-cyan-500 p-0.5"
                  >
                    {revealAllCPFs || revealedRowIds[selectedRecord.id] ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Nº Contrato</span>
                <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{selectedRecord.numeroContrato || '-'}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Vendedor (Digitador)</span>
                <div className="font-medium text-slate-900 dark:text-white truncate">
                  {selectedRecord.vendedor} ({selectedRecord.digitador})
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Status</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.status}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Data Digitação</span>
                <div className="font-medium text-slate-900 dark:text-white">{selectedRecord.dataDigitacao}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Data Pagamento</span>
                <div className="font-medium text-slate-900 dark:text-white">{selectedRecord.dataPagamento || '-'}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Operação / Convênio</span>
                <div className="font-medium text-slate-900 dark:text-white truncate">
                  {selectedRecord.operacao} • {selectedRecord.convenio}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] block font-semibold">Banco / Promotora</span>
                <div className="font-medium text-slate-900 dark:text-white truncate">
                  {selectedRecord.banco} • {selectedRecord.promotora}
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Valor Liberado (Empréstimo):</span>
                <strong className="text-slate-900 dark:text-white text-sm font-mono">
                  {formatCurrencyBR(selectedRecord.valorEmprestimo)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Taxa de Assessoria:</span>
                <strong className="text-amber-600 dark:text-amber-300 font-mono">
                  {formatCurrencyBR(selectedRecord.valorAssessoria)}
                  <span className="text-slate-400 text-[11px] ml-1 font-normal">
                    (Status: {selectedRecord.clientePagouAssessoria === 'SIM' ? 'Paga' : 'Pendente'})
                  </span>
                </strong>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Comissão Faturada:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                  {formatCurrencyBR(selectedRecord.totalComissao)}
                </strong>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
