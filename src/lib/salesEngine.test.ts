import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCurrency,
  parseDate,
  parseSalesCSV,
  calculateKPIs,
  aggregateByVendor,
  filterRecords,
  calculateSheetR,
  calculateSheetVendasMatrix,
  calculateVendorGoalsRanking,
  normalizeVendorName,
  ACTIVE_VENDORS_CONFIG,
  getTeamMeta,
  calculateVariation,
} from './salesEngine.ts';

test('parseCurrency handles Brazilian currency formats properly', () => {
  assert.equal(parseCurrency('R$ 1.500,50'), 1500.5);
  assert.equal(parseCurrency('2.957,02'), 2957.02);
  assert.equal(parseCurrency('R$ 0,00'), 0);
  assert.equal(parseCurrency('0'), 0);
  assert.equal(parseCurrency(''), 0);
  assert.equal(parseCurrency(null), 0);
  assert.equal(parseCurrency('R$ 10.000,00'), 10000);
});

test('parseDate handles Brazilian dates and typos gracefully', () => {
  const d1 = parseDate('12/03/2026');
  assert.notEqual(d1, null);
  assert.equal(d1!.getDate(), 12);
  assert.equal(d1!.getMonth(), 2);
  assert.equal(d1!.getFullYear(), 2026);

  const d2 = parseDate('23/02/0206');
  assert.notEqual(d2, null);
  assert.equal(d2!.getFullYear(), 2026);
});

test('normalizeVendorName unifies Bianca and Loja Igarassu and Lucélia variants', () => {
  assert.equal(normalizeVendorName('LOJA IGARASSU'), 'Bianca (Loja Igarassu)');
  assert.equal(normalizeVendorName('loja igarassu'), 'Bianca (Loja Igarassu)');
  assert.equal(normalizeVendorName('Bianca'), 'Bianca (Loja Igarassu)');
  assert.equal(normalizeVendorName('luc?lia'), 'Lucélia');
  assert.equal(normalizeVendorName('lucelia'), 'Lucélia');
  assert.equal(normalizeVendorName('LUCÉLIA'), 'Lucélia');
});

test('parseSalesCSV parses sample rows with assessoria zero commission rule', () => {
  const sampleCSV = `Carimbo de data/hora,"CPF DO CLIENTE",NOME DO CLIENTE,DATA DA DIGITAÇÃO,DATA DO PAGAMENTO AO CLIENTE,CONVÊNIO,OPERAÇÃO,BANCO,PROMOTORA,VALOR DO EMPRÉSTIMO LIBERADO PARA O CLIENTE,VALOR DA TAXA DA ASSESSORIA,CLIENTE PAGOU A TAXA DE ASSESSORIA,Taxa do Cartão,VENDEDOR,DIGITADOR,Nº DO CONTRATO,STATUS DO CONTRATO,COMISSÃO J2,COMISSÃO SEMPRE,COMISSÃO dg,COMISSÃO gft,FATURADO,FATURADO,Column 29
12/03/2026 18:00:07,428.687.424-91,SAMUEL HENRIQUE,12/03/2026,12/03/2026,INSS,REFIN,C6,J2 PROMOTORA,"2.957,02",,,,HELLEN,HELLEN,977526573,PAGO,"177,42",,,,"177,42",,
12/03/2026 18:04:11,298.046.474-00,MARCIA VIEIRA,12/03/2026,12/03/2026,INSS,ASSESSORIA,ASSESSORIA,ASSESSORIA,"0,00","R$ 200,00",SIM,,HELLEN,HELLEN,0,PAGO,"50,00",,,,"50,00",,
18/06/2026 11:40:31,372.398.564-53,ANTONIA APARECIDA,18/06/2026,18/06/2026,ASSESSORIA,ASSESSORIA,ASSESSORIA,ASSESSORIA,"0,00","R$ 500,00",SIM,,Lucélia,Lucélia,0,PAGO,,,,,0,,`;

  const records = parseSalesCSV(sampleCSV);
  assert.equal(records.length, 3);
  assert.equal(records[0].cliente, 'SAMUEL HENRIQUE');
  assert.equal(records[0].valorEmprestimo, 2957.02);
  assert.equal(records[0].totalComissao, 177.42);

  // Assessoria row MUST have 0 comissao regardless of what is in commission column
  assert.equal(records[1].isAssessoria, true);
  assert.equal(records[1].totalComissao, 0);
  assert.equal(records[1].valorAssessoria, 200);
  assert.equal(records[1].clientePagouAssessoria, 'SIM');
});

test('calculateKPIs enforces Volume Liberado if Q:Q is PAGO and Taxa if L:L is SIM', () => {
  const sampleCSV = `Carimbo,CPF,NOME,DIGITACAO,PAGAMENTO,CONVENIO,OPERACAO,BANCO,PROMOTORA,EMPRESTIMO,ASSESSORIA,PAGOU_ASS,TAXA,VENDEDOR,DIGITADOR,CONTRATO,STATUS,J2,SEMPRE,DG,GFT,FAT1,FAT2,COL29
12/03/2026,1,A,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"1.000,00","R$ 100,00",SIM,,HELLEN,HELLEN,1,PAGO,"100,00",,,,100,,
12/03/2026,2,B,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"2.000,00","R$ 150,00",NÃO,,"Lucélia",Lucélia,2,PAGO,,,,,0,,
12/03/2026,3,C,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"500,00",,,,"Lucélia",Lucélia,3,CANCELADO,,,,,0,,
12/03/2026,4,D,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"800,00",,,,Agatha,Agatha,4,EM ANÁLISE,,,,,0,,`;

  const records = parseSalesCSV(sampleCSV);
  const kpis = calculateKPIs(records);

  assert.equal(kpis.totalContratos, 4);
  assert.equal(kpis.contratosPagos, 2);
  assert.equal(kpis.contratosCancelados, 1);
  assert.equal(kpis.contratosEmAnalise, 1);
  // Volume liberado: Only PAGO (1000 + 2000 = 3000)
  assert.equal(kpis.volumeLiberado, 3000);
  // Taxa recebida: Only if SIM (100)
  assert.equal(kpis.totalAssessoriaRecebida, 100);
  assert.equal(kpis.totalComissaoFaturada, 100);
  assert.equal(kpis.contratosSemComissao, 1); // Row 2 is PAGO with 0 commission
});

test('calculateSheetR computes vendor performance, fixed costs, and Pamella commission', () => {
  const sampleCSV = `Carimbo,CPF,NOME,DIGITACAO,PAGAMENTO,CONVENIO,OPERACAO,BANCO,PROMOTORA,EMPRESTIMO,ASSESSORIA,PAGOU_ASS,TAXA,VENDEDOR,DIGITADOR,CONTRATO,STATUS,J2,SEMPRE,DG,GFT,FAT1,FAT2,COL29
12/03/2026,1,A,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"50.000,00","R$ 10.000,00",SIM,,HELLEN,ANA,1,PAGO,"1.000,00",,,,1000,,
12/03/2026,2,B,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"60.000,00","R$ 15.000,00",SIM,,LOJA IGARASSU,HELLEN,2,PAGO,"500,00",,,,500,,
12/03/2026,3,C,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"80.000,00","R$ 20.000,00",SIM,,"Lucélia",Lucélia,3,PAGO,"800,00",,,,800,,`;

  const records = parseSalesCSV(sampleCSV);
  const sheetR = calculateSheetR(records);

  assert.equal(sheetR.funcionarios.length, 5);
  const hellen = sheetR.funcionarios.find(f => f.vendedor === 'Hellen')!;
  assert.equal(hellen.pagos, 50000);
  assert.equal(hellen.taxas, 10000);
  assert.equal(hellen.custoFuncionario, -6655.94);
  assert.equal(hellen.rentabilidade, 11000 - 6655.94);

  const bianca = sheetR.funcionarios.find(f => f.vendedor === 'Bianca (Loja Igarassu)')!;
  assert.equal(bianca.pagos, 60000);
  assert.equal(bianca.custoFuncionario, -6367.10);
});

test('getTeamMeta dynamically sums individual goals of all active vendors', () => {
  const total = getTeamMeta(ACTIVE_VENDORS_CONFIG);
  assert.equal(total, 510000); // 130k + 110k + 130k + 90k + 50k
});

test('calculateVariation correctly enforces edge cases for zero base and movements', () => {
  // base > 0, normal variation
  const v1 = calculateVariation(150, 100);
  assert.equal(v1.text, '+50%');
  assert.equal(v1.kind, 'positive');
  assert.equal(v1.absoluteDiff, 50);

  // current > 0, base = 0: "Novo período" (NEVER "+100%")
  const v2 = calculateVariation(100, 0);
  assert.equal(v2.text, 'Novo período');
  assert.equal(v2.kind, 'new');
  assert.equal(v2.percent, null);
  assert.equal(v2.absoluteDiff, 100);

  // current = 0, base > 0: "-100%"
  const v3 = calculateVariation(0, 100);
  assert.equal(v3.text, '-100%');
  assert.equal(v3.kind, 'negative');
  assert.equal(v3.percent, -100);
  assert.equal(v3.absoluteDiff, -100);

  // current = 0, base = 0: "Sem movimentação"
  const v4 = calculateVariation(0, 0);
  assert.equal(v4.text, 'Sem movimentação');
  assert.equal(v4.kind, 'neutral');
  assert.equal(v4.absoluteDiff, 0);
});

test('calculateVendorGoalsRanking and calculateSheetVendasMatrix include Taciana and all active vendors', () => {
  const ranking = calculateVendorGoalsRanking([]);
  assert.equal(ranking.length, 5);
  const vendorNames = ranking.map((r: any) => r.vendedor);
  assert.ok(vendorNames.includes('Taciana'));
  assert.ok(vendorNames.includes('Agatha'));
  assert.ok(vendorNames.includes('Lucélia'));
  assert.ok(vendorNames.includes('Hellen'));
  assert.ok(vendorNames.includes('Bianca (Loja Igarassu)'));

  const matrix = calculateSheetVendasMatrix([]);
  assert.equal(matrix.metas.total, 510000);
  assert.equal(matrix.metas.taciana, 90000);
});

test('calculateVendorGoalsRanking sorts strictly by vendasTotais and excludes Refin/Cartão from elegível', () => {
  const sampleCSV = `Carimbo,CPF,NOME,DIGITACAO,PAGAMENTO,CONVENIO,OPERACAO,BANCO,PROMOTORA,EMPRESTIMO,ASSESSORIA,PAGOU_ASS,TAXA,VENDEDOR,DIGITADOR,CONTRATO,STATUS,J2,SEMPRE,DG,GFT,FAT1,FAT2,COL29
12/03/2026,1,A,12/03/2026,12/03/2026,INSS,REFIN,C6,J2,"100.000,00",,,,HELLEN,HELLEN,1,PAGO,,,,,0,,
12/03/2026,2,B,12/03/2026,12/03/2026,INSS,FGTS,C6,J2,"50.000,00",,,,HELLEN,HELLEN,2,PAGO,,,,,0,,
12/03/2026,3,C,12/03/2026,12/03/2026,INSS,FGTS,C6,J2,"120.000,00",,,,Lucélia,Lucélia,3,PAGO,,,,,0,,
12/03/2026,4,D,12/03/2026,12/03/2026,INSS,CARTÃO DE CRÉDITO,C6,J2,"10.000,00",,,,Bianca,Bianca,4,PAGO,,,,,0,,
12/03/2026,5,E,12/03/2026,12/03/2026,INSS,MARGEM,C6,J2,"70.000,00",,,,Bianca,Bianca,5,PAGO,,,,,0,,`;

  const records = parseSalesCSV(sampleCSV);
  const ranking = calculateVendorGoalsRanking(records);

  // Hellen has total vendas = 150.000 (100k Refin + 50k FGTS)
  // Lucélia has total vendas = 120.000 (120k FGTS)
  // Bianca has total vendas = 80.000 (10k Cartão + 70k Margem)
  // Agatha has total vendas = 0
  // Taciana has total vendas = 0

  assert.equal(ranking[0].vendedor, 'Hellen');
  assert.equal(ranking[0].vendasTotais, 150000);
  assert.equal(ranking[0].elegivelComissao, 50000); // 150k - 100k Refin
  assert.equal(ranking[0].metaComissao, 130000);
  assert.equal(ranking[0].atingimento, 38.5); // 50k / 130k
  assert.equal(ranking[0].falta, 80000);

  assert.equal(ranking[1].vendedor, 'Lucélia');
  assert.equal(ranking[1].vendasTotais, 120000);
  assert.equal(ranking[1].elegivelComissao, 120000);
  assert.equal(ranking[1].atingimento, 92.3);

  assert.equal(ranking[2].vendedor, 'Bianca (Loja Igarassu)');
  assert.equal(ranking[2].vendasTotais, 80000);
  assert.equal(ranking[2].elegivelComissao, 70000); // 80k - 10k Cartão

  // Agatha and Taciana appear even with 0 volume
  assert.equal(ranking[3].vendedor, 'Agatha');
  assert.equal(ranking[3].vendasTotais, 0);
  assert.equal(ranking[4].vendedor, 'Taciana');
  assert.equal(ranking[4].vendasTotais, 0);
});

test('getPeriodCacheKey and isMonthSyncSupported permit any historical month and custom interval without collision', async () => {
  const { getPeriodCacheKey, isMonthSyncSupported } = await import('./sheetCache.ts');

  // Verify all months are supported online without two-month restriction
  assert.equal(isMonthSyncSupported('2026-08').supported, true);
  assert.equal(isMonthSyncSupported('2026-07').supported, true);
  assert.equal(isMonthSyncSupported('2026-06').supported, true);
  assert.equal(isMonthSyncSupported('2025-12').supported, true);
  assert.equal(isMonthSyncSupported('2026-11').supported, true);

  // Full month cache key
  const fullMonthKey = getPeriodCacheKey('2026-08');
  assert.equal(fullMonthKey, '2026-08|inicio-do-mes|fim-do-mes');

  // Custom interval cache key for 1 to 15 August 2026
  const customKey = getPeriodCacheKey('2026-08', '2026-08-01', '2026-08-15');
  assert.equal(customKey, '2026-08|2026-08-01|2026-08-15');

  // Full month vs custom interval do not collide
  assert.notEqual(fullMonthKey, customKey);
});

