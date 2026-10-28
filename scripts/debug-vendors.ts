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
console.log('Headers:', rows[0]);

// Let's inspect unique vendors and how values are distributed
const vendors = new Set<string>();
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (r && r[13]) {
    vendors.add(r[13]);
  }
}
console.log('All unique vendor raw strings:', Array.from(vendors));
