# Implementation Plan - Correção Funcional, Redesign de Estados e Limpeza Visual (CrediFlow 2026)

Revisão integral incorporando todas as diretrizes do usuário, os 18 critérios de homologação em ambiente móvel PWA e a execução rigorosa de cada item sem atalhos.

## 1. Diretrizes Principais e Regras de Negócio

### A. Meses Históricos e Google Apps Script
1. **Cache Local (`crediflow_sheet_cache_v4_2026`)**:
   - Se o mês já tiver dados no cache (seja junho, julho, agosto, setembro ou outubro), carregar instantaneamente sem qualquer chamada HTTP e sem tela de sincronização.
   - Persistência e retenção no `localStorage` sob a chave `crediflow_sheet_cache_v4_2026`.
2. **Meses Históricos sem Cache**:
   - O Apps Script oficial (`AKfycbythcKFUzII8rgoZ-xCvrumSNWtdJrc-ruAb2Jk8F9B05OsoehfK4sK5bQOw87_GlvE/exec`) retorna `{ ok: false, erro: "Só é permitido consultar o mês atual ou o mês anterior" }`.
   - Se o usuário selecionar junho, julho ou agosto sem cache:
     - Nunca disparar requisições em loop infinito.
     - Nunca exibir tela branca.
     - Nunca vazar dados de setembro ou outubro para junho/julho/agosto.
     - Nunca exibir `R$ 0,00` como se houvesse movimentação zerada quando os dados não foram encontrados.
     - Exibir os 6 cards em estado vazio/não sincronizado (`--`).
     - Exibir estado contextual `unsupported-period` informando com clareza a regra do backend e que o período ainda não está disponível para sincronização online.
     - Botão de sincronização no cabeçalho fica desativado/contextualizado quando o período não for suportado.
3. **Diferenciação Visual Estrita dos Estados**:
   - `idle`: aguardando ação.
   - `loading-cache`: leitura imediata da memória local.
   - `ready`: dados válidos carregados (exibe valores formatados em R$).
   - `empty`: mês suportado com dados confirmados zerados (exibe `R$ 0,00`).
   - `unsupported-period`: mês não suportado pelo backend (exibe `--` e aviso contextual).
   - `error`: erro de rede ou de comunicação recuperável.
   - `syncing`: sincronização manual solicitada em andamento.

### B. Período Personalizado
1. **Validação**: Impedir estritamente que a data final seja anterior à inicial (`dataFim >= dataInicio`), com alerta visual inline no dropdown.
2. **Intervalos**: Suportar mês inteiro, quinzena (dia 1 ao 15) e atalhos rápidos.
3. **Reflexo Real dos Dados**:
   - Na aba **Vendas**, filtrar os contratos de acordo com a `Data de Digitação`/`Data de Pagamento`, recalculando ranking e matriz de operações.
   - Na aba **Faturamento (R$)**, se for selecionado intervalo parcial dentro do mês (ex.: 01 a 15), indicar expressamente que as células oficiais consolidadas refletem o fechamento mensal da planilha, enquanto o detalhamento diário individual é apurado nos contratos da aba Vendas.

### C. Limpeza Visual Obrigatória
1. **Sincronização**:
   - Remover completamente o card grande com botão gigante de sincronização de dentro do conteúdo.
   - Manter apenas o botão pequeno no cabeçalho com ícone, tooltip e feedback de loading.
   - Nenhum modal para erro simples de sincronização (apenas mensagem inline ou toast temporário).
2. **Modais e Análises**:
   - Eliminar qualquer modal dentro de modal. No máximo **1 overlay aberto por vez**.
   - A Análise Inteligente abre em uma única superfície visual: **Drawer lateral amplo no desktop** e **Sheet quase integral no mobile**, com cabeçalho fixo, título, período, resumo, seções expansíveis e rolagem interna.
   - Todo overlay fecha com botão fechar visível, tecla `Escape` e clique no backdrop.
3. **Ranking de Vendedoras**:
   - Meta individual aparece **apenas uma única vez** por vendedora, vinculada diretamente à barra de progresso.
   - Não repetir a meta no título, no valor, no modal e no tooltip.
   - Eliminar modais individuais de vendedoras.
   - Cada linha contém apenas: posição, nome, resultado, meta única, percentual atingido e estado visual (Meta Batida / Falta R$).
4. **Organização da UI**:
   - Faturamento R$ sem filtros e sem bloco Maiores Margens.
   - Bloco "Totais Recebidos no Período" permanece inalterado.
   - Seis cards oficiais no topo, incluindo Despesas do Período (B23).
   - Compartilhamento de cards via Web Share API / imagem PNG em alta resolução (3x), sem corte e contendo o card inteiro.

---

## 2. Checklist dos 18 Critérios de Homologação

- [ ] **Critério 1**: Abrir o PWA sem cache.
- [ ] **Critério 2**: Selecionar junho sem cache.
- [ ] **Critério 3**: Confirmar que os cards ficam vazios (`--`) e não exibem dados de setembro ou outubro.
- [ ] **Critério 4**: Clicar manualmente em Sincronizar.
- [ ] **Critério 5**: Confirmar que somente junho foi buscado (sem chamadas para outros meses).
- [ ] **Critério 6**: Confirmar que `crediflow_sheet_cache_v4_2026` foi criado no localStorage.
- [ ] **Critério 7**: Trocar para setembro e outubro já armazenados.
- [ ] **Critério 8**: Confirmar que a troca ocorre sem nova chamada HTTP e sem tela de sincronização.
- [ ] **Critério 9**: Fechar e reabrir o PWA.
- [ ] **Critério 10**: Confirmar que o mês armazenado aparece sem nova sincronização.
- [ ] **Critério 11**: Alternar entre todas as abas.
- [ ] **Critério 12**: Confirmar zero chamadas de sincronização ao trocar de aba.
- [ ] **Critério 13**: Testar o botão de compartilhamento no Android e verificar a resolução real da imagem.
- [ ] **Critério 14**: Confirmar que a imagem compartilhada contém o card inteiro e não está cortada.
- [ ] **Critério 15**: Confirmar que Faturamento não possui filtros nem o bloco Maiores Margens.
- [ ] **Critério 16**: Confirmar que o bloco Totais Recebidos permanece inalterado.
- [ ] **Critério 17**: Confirmar que existem seis cards, incluindo Despesas do Período.
- [ ] **Critério 18**: Confirmar que o ranking não usa modais individuais nem repete a meta.

---

## 3. Plano de Execução Técnica

1. **`src/lib/sheetCache.ts`**:
   - Tipos de estado: `'idle' | 'loading-cache' | 'ready' | 'empty' | 'unsupported-period' | 'error' | 'syncing'`.
   - Adicionar helper `isMonthSyncSupported(monthKey: string)` para saber de antemão se o Apps Script aceita a sincronização do mês.
   - Refatorar `fetchMonthWithCache` para capturar a mensagem exata do Apps Script (`resJson.erro`), sem mascará-la.
   - Garantir compatibilidade total com a chave `crediflow_sheet_cache_v4_2026`.
2. **`src/App.tsx`**:
   - Remover card grande central de sincronização (linhas 425-445).
   - Gerenciar estado do mês de forma explícita.
   - Passar estado e suporte para o `Header.tsx`.
   - Garantir isolamento rígido entre meses: nunca exibir dados de setembro em junho.
   - Exibir mensagem inline contextual se o mês for não suportado ou vazio.
3. **`src/components/Header.tsx`**:
   - Ajustar botão de sincronização para exibir tooltip explicativo e estado desativado quando o período for `unsupported-period`.
4. **`src/components/PeriodDropdown.tsx`**:
   - Adicionar validação `customEnd >= customStart`.
   - Adicionar botões de atalho rápido (Mês Inteiro, Quinzena 1º a 15, Quinzena 16 ao Fim).
   - Exibir mensagem de erro inline se a data final for anterior à data inicial.
5. **`src/components/KPIOverview.tsx`**:
   - Receber estado do mês (`monthStatus`).
   - Se `unsupported-period` ou ausência de dados, exibir `--` em vez de falso `R$ 0,00`.
   - Preservar os 6 cards: Volume Liberado, Taxas, Comissões, LUCRO (B22), Despesas do Período (B23), Lucro Líquido (B24).
6. **`src/components/SheetVendasTab.tsx`**:
   - Auditar e remover meta individual duplicada (exibir apenas 1 vez por vendedora junto ao progresso).
   - Garantir que cada linha contenha apenas posição, nome, resultado, meta única, percentual e status visual.
   - Garantir ausência de modais individuais de vendedoras.
7. **`src/components/PeriodIntelligentAnalysis.tsx` & Overlays**:
   - Transformar a Análise Inteligente em Drawer amplo no desktop e Sheet móvel no Android/iOS, com rolagem perfeita, cabeçalho fixo, suporte a `Escape` e clique no backdrop.
   - Regra estrita de no máximo 1 overlay aberto.
8. **`src/components/ShareCardButton.tsx`**:
   - Assegurar renderização integral com `pixelRatio: 3` (alta resolução) sem cortar cards nem tabelas largas.
