import fs from 'node:fs';

const content = fs.readFileSync('public/assets/aistudio/2026_-_Acompanhamento_das_Vendas_4aafaa11', 'utf-8');

function parseCSV(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

const rows = parseCSV(content);
console.log('Total parsed rows:', rows.length);
console.log('Headers:', rows[0]);

const sample = rows.slice(1, 4);
console.log('First 3 data rows:');
sample.forEach((r, idx) => console.log(`Row ${idx + 1}:`, r));

const vendors = new Set<string>();
const digitadores = new Set<string>();
const statusSet = new Set<string>();
const convenios = new Set<string>();
const operacoes = new Set<string>();
const bancos = new Set<string>();
const promotoras = new Set<string>();

let totalEmprestimo = 0;
let totalAssessoria = 0;
let totalComissaoFaturada = 0;
let semComissaoCount = 0;
let pagoCount = 0;

function parseMoeda(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 5 || !r[2]) continue; // Needs at least client name or timestamp
  
  const empVal = parseMoeda(r[9]);
  const assVal = parseMoeda(r[10]);
  const comissaoJ2 = parseMoeda(r[17]);
  const comissaoSempre = parseMoeda(r[18]);
  const comissaoDg = parseMoeda(r[19]);
  const comissaoGft = parseMoeda(r[20]);
  const faturado1 = parseMoeda(r[21]);
  const faturado2 = parseMoeda(r[22]);
  
  const totalCom = faturado1 || faturado2 || (comissaoJ2 + comissaoSempre + comissaoDg + comissaoGft);

  totalEmprestimo += empVal;
  totalAssessoria += assVal;
  totalComissaoFaturada += totalCom;

  const status = (r[16] || '').trim().toUpperCase();
  statusSet.add(status || '(VAZIO)');
  if (status === 'PAGO') pagoCount++;

  if (totalCom === 0 && status !== 'CANCELADO') {
    semComissaoCount++;
  }

  if (r[5]) convenios.add(r[5].trim());
  if (r[6]) operacoes.add(r[6].trim());
  if (r[7]) bancos.add(r[7].trim());
  if (r[8]) promotoras.add(r[8].trim());
  if (r[13]) vendors.add(r[13].trim());
  if (r[14]) digitadores.add(r[14].trim());
}

console.log('Vendors:', Array.from(vendors));
console.log('Digitadores:', Array.from(digitadores));
console.log('Statuses:', Array.from(statusSet));
console.log('Summary stats:', {
  totalEmprestimo: totalEmprestimo.toFixed(2),
  totalAssessoria: totalAssessoria.toFixed(2),
  totalComissaoFaturada: totalComissaoFaturada.toFixed(2),
  pagoCount,
  semComissaoCount
});
