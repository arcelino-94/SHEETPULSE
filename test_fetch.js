import fetch from 'node-fetch';

const url = 'https://script.google.com/macros/s/AKfycbythcKFUzII8rgoZ-xCvrumSNWtdJrc-ruAb2Jk8F9B05OsoehfK4sK5bQOw87_GlvE/exec';

async function test() {
  console.log('--- FETCHING ABA R$ ---');
  try {
    const resR = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: 'comissao-pwa-2026-seguranca-igara-95',
        mes: '2026-10',
        aba: 'R$',
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31'
      })
    });
    const textR = await resR.text();
    console.log('ABA R$ TEXT:', textR.slice(0, 500));
  } catch (err) {
    console.error('ABA R$ ERROR:', err);
  }

  console.log('\n--- WAITING 3s ---');
  await new Promise(r => setTimeout(r, 3000));

  console.log('--- FETCHING ABA VENDAS ---');
  try {
    const resV = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: 'comissao-pwa-2026-seguranca-igara-95',
        mes: '2026-10',
        aba: 'Vendas',
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31'
      })
    });
    const textV = await resV.text();
    console.log('ABA VENDAS TEXT:', textV.slice(0, 500));
  } catch (err) {
    console.error('ABA VENDAS ERROR:', err);
  }
}

test();
