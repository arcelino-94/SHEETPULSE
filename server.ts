import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_FILE_PATH = path.resolve(__dirname, 'public/assets/aistudio/2026_-_Acompanhamento_das_Vendas_4aafaa11');

// Initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health checks
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Default initial data from the spreadsheet asset
app.get('/api/data/default', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(DEFAULT_FILE_PATH)) {
      const csv = fs.readFileSync(DEFAULT_FILE_PATH, 'utf-8');
      res.json({ success: true, csv, source: 'bundled_sheet' });
    } else {
      res.status(404).json({ success: false, error: 'Arquivo padrão não encontrado' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-time synchronization endpoint for Google Sheets
app.post('/api/sheets/sync', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      // Return default asset if no URL specified
      if (fs.existsSync(DEFAULT_FILE_PATH)) {
        const csv = fs.readFileSync(DEFAULT_FILE_PATH, 'utf-8');
        return res.json({ success: true, csv, source: 'bundled_asset', rowsCount: csv.split('\n').length });
      }
      return res.status(400).json({ success: false, error: 'URL da planilha não informada' });
    }

    let exportUrl = url.trim();

    // Convert standard Google Sheet URL to direct CSV export URL
    // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
    // or https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pubhtml
    const sheetIdMatch = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = exportUrl.match(/[#&?]gid=([0-9]+)/);

    if (sheetIdMatch && !exportUrl.includes('/pub?output=csv') && !exportUrl.includes('/export?format=csv')) {
      const sheetId = sheetIdMatch[1];
      const gid = gidMatch ? gidMatch[1] : '0';
      exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    } else if (exportUrl.includes('/pubhtml')) {
      exportUrl = exportUrl.replace('/pubhtml', '/pub?output=csv');
    }

    console.log(`[Google Sheets Sync] Fetching live data from: ${exportUrl}`);

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrediFlowPWA/1.0)',
        Accept: 'text/csv, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao conectar com o Google Sheets: HTTP ${response.status} (${response.statusText})`);
    }

    const csvData = await response.text();

    if (!csvData || csvData.length < 50 || csvData.includes('<!DOCTYPE html>')) {
      throw new Error('A resposta do Google Sheets não contém dados CSV válidos. Verifique se a planilha está compartilhada para "Qualquer pessoa com o link" ou publicada na web (Arquivo > Compartilhar > Publicar na Web > CSV).');
    }

    res.json({
      success: true,
      csv: csvData,
      source: 'live_google_sheets',
      syncedAt: new Date().toISOString(),
      rowsCount: csvData.split('\n').length,
    });
  } catch (err: any) {
    console.error('Error during Google Sheets sync:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erro inesperado ao sincronizar com Google Sheets',
    });
  }
});

// Google Apps Script Web App POST sync endpoint (Sheet R$ B4 & D4 dynamic update)
app.post('/api/apps-script/sync', async (req: Request, res: Response) => {
  try {
    const { token, mes, aba, dataInicio, dataFim, scriptUrl } = req.body;
    const targetScriptUrl =
      scriptUrl ||
      process.env.APPS_SCRIPT_WEB_APP_URL ||
      'https://script.google.com/macros/s/AKfycbythcKFUzII8rgoZ-xCvrumSNWtdJrc-ruAb2Jk8F9B05OsoehfK4sK5bQOw87_GlvE/exec';

    const payload: Record<string, any> = {
      token: token || 'comissao-pwa-2026-seguranca-igara-95',
      mes: mes || '2026-09',
      aba: aba || 'R$',
    };

    if (dataInicio) {
      payload.dataInicio = dataInicio;
    }
    if (dataFim) {
      payload.dataFim = dataFim;
    }

    console.log(`[Filtro correto do R$] Sending POST payload to ${targetScriptUrl}:`, JSON.stringify(payload));

    const executeFetch = async () => {
      const response = await fetch(targetScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`Apps Script HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from Apps Script: ${text.substring(0, 200)}`);
      }
    };

    let data = await executeFetch();

    // If Google Apps Script returned a concurrent lock timeout, retry with backoff
    if (data && ((data.erro && String(data.erro).toLowerCase().includes('lock')) || (data.error && String(data.error).toLowerCase().includes('lock')))) {
      console.warn('[Filtro correto do R$] Apps Script hit lock timeout, retrying with backoff in 1800ms...');
      await new Promise((r) => setTimeout(r, 1800));
      data = await executeFetch();
    }

    console.log('[Filtro correto do R$] Apps Script response ok:', data.ok);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('Apps Script Sync Error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Falha na comunicação com o Apps Script',
    });
  }
});

// Gemini AI Conversational Data Scientist Endpoint
app.post('/api/gemini/query', async (req: Request, res: Response) => {
  try {
    const { prompt, contextSummary, filteredStats } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt não fornecido.' });
    }

    if (!aiClient) {
      return res.json({
        answer: 'Serviço de IA não configurado no servidor. O mecanismo de cálculo analítico instantâneo local está operando normalmente.',
        isFallback: true,
      });
    }

    const systemInstruction = `Você é o "CrediFlow AI Analyst", um especialista sênior em Ciência de Dados e analista de operações financeiras de crédito consignado, empréstimos, cartão de crédito e assessoria financeira.
Você analisa relatórios de vendas reais com base na planilha "Acompanhamento das Vendas 2026".
A planilha contém colunas como:
- Data da Digitação, Data do Pagamento ao Cliente
- Convênio (INSS, CARTÃO DE CRÉDITO, CREFAZ, CAIXA, GOVERNO DO ESTADO, SIAPE)
- Operação (MARGEM, REFIN, CARTÃO DE CRÉDITO, FGTS, CREDITO TRABALHADOR, PORTABILIDADE, REFIN DA PORT, SAQUE COMPLEMENTAR, CARTÃO NOVO)
- Bancos (C6, DAYCOVAL, FACTA, ICRED, PAN, DIGIO, BMG, BRB, etc.)
- Promotoras (J2 PROMOTORA, SEMPRE PROMOTORA, DG, GFT, etc.)
- Vendedores (HELLEN, LOJA IGARASSU, TACIANA, Lucélia, Agatha, PAMELLA, etc.)
- Valores: Empréstimo Liberado, Taxa de Assessoria, Status (PAGO, CANCELADO, EM ANÁLISE), Comissão J2/Sempre/DG/GFT/Faturado.

Contexto dos dados atuais:
${contextSummary || 'Não fornecido'}

Responda sempre em Português do Brasil de forma extremamente clara, estruturada, ágil e profissional.
Use formatação Markdown elegante com emojis, tópicos e números em reais (R$). Dê respostas diretas e concisas, com insights relevantes sobre o desempenho da equipe ou indicadores.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high numerical accuracy and precision
      },
    });

    res.json({
      answer: response.text || 'Não foi possível gerar uma resposta detalhada no momento.',
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Gemini query error:', err);
    res.status(500).json({
      error: err.message || 'Erro ao processar consulta com o Gemini',
    });
  }
});

// Gemini AI Structured Period Analysis Endpoint (Parte 6 & Parte 7)
app.post('/api/gemini/analyze-period', async (req: Request, res: Response) => {
  try {
    const { metrics } = req.body;

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ success: false, error: 'Métricas determinísticas não fornecidas.' });
    }

    if (!aiClient) {
      return res.status(503).json({
        success: false,
        isFallback: true,
        error: 'Serviço Gemini temporariamente indisponível.',
        diag: 'Chave Gemini não configurada no servidor. Indicadores determinísticos preservados.',
      });
    }

    const systemInstruction = `Você é um analista sênior de inteligência financeira e controladoria para a empresa Lívia Cred.
Sua missão é produzir uma "Análise Inteligente do Período" estritamente fundamentada no JSON de métricas determinísticas enviado.
REGRAS OBRIGATÓRIAS:
1. Use SOMENTE os números fornecidos nas métricas. Não invente, não extrapole e não altere valores ou percentuais.
2. Mencione explicitamente o número-base (em R$ ou %) que sustenta cada insight, alerta e recomendação.
3. Diferencie rigorosamente fato calculado (número real fornecido) de interpretação de negócio.
4. Se faltar informação sobre algum ponto específico, diga expressamente "não há dados suficientes" para aquele ponto.
5. Evite clichês e generalidades; seja direto, estratégico e executivo.
6. Produza de 2 a 5 insights relevantes, priorizados por impacto financeiro.
7. Produza no máximo 3 alertas e no máximo 3 recomendações.
8. Escreva exclusivamente em português do Brasil com clareza profissional.`;

    const prompt = `Analise o seguinte relatório de métricas determinísticas financeiras oficiais do período:
${JSON.stringify(metrics, null, 2)}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumo: { type: Type.STRING, description: 'Conclusão executiva sintética do período' },
            situacao: {
              type: Type.STRING,
              enum: ['positiva', 'atencao', 'critica'],
              description: 'Classificação global da situação do período',
            },
            insightsPositivos: {
              type: Type.ARRAY,
              description: 'De 2 a 5 insights positivos embasados em números reais',
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  numeroBase: { type: Type.STRING },
                  impacto: { type: Type.STRING },
                },
                required: ['titulo', 'descricao', 'numeroBase'],
              },
            },
            alertas: {
              type: Type.ARRAY,
              description: 'Até 3 alertas de pontos de atenção com dados quantitativos',
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  numeroBase: { type: Type.STRING },
                  gravidade: { type: Type.STRING },
                },
                required: ['titulo', 'descricao', 'numeroBase'],
              },
            },
            recomendacoes: {
              type: Type.ARRAY,
              description: 'Até 3 recomendações acionáveis com sustentação numérica e prioridade',
              items: {
                type: Type.OBJECT,
                properties: {
                  problemaOportunidade: { type: Type.STRING },
                  numeroBase: { type: Type.STRING },
                  acao: { type: Type.STRING },
                  impactoPrioridade: { type: Type.STRING },
                },
                required: ['problemaOportunidade', 'numeroBase', 'acao', 'impactoPrioridade'],
              },
            },
            evidencias: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de números e fatos que comprovam as conclusões',
            },
          },
          required: ['resumo', 'situacao', 'insightsPositivos', 'alertas', 'recomendacoes', 'evidencias'],
        },
      },
    });

    const text = response.text || '{}';
    const analysis = JSON.parse(text);

    return res.status(200).json({
      success: true,
      analysis,
      isFallback: false,
    });
  } catch (err: any) {
    const diagMessage =
      err?.message?.includes('API key') || err?.message?.includes('UNAUTHENTICATED')
        ? 'Falha de autenticação na API Generative Language (chave não autorizada ou formato incompatível).'
        : err?.message || 'Falha de comunicação com a API Gemini.';

    console.warn('[Gemini Backend] Análise indisponível:', diagMessage);

    return res.status(503).json({
      success: false,
      isFallback: true,
      error: 'Serviço Gemini temporariamente indisponível.',
      diag: diagMessage,
    });
  }
});

// Setup Vite in development or static serve in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('CrediFlow Server is running.');
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CrediFlow Server] Listening on http://0.0.0.0:${PORT} (env: ${isDev ? 'development' : 'production'})`);
  });

  const shutdown = () => {
    console.log('[CrediFlow Server] Gracefully shutting down...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
