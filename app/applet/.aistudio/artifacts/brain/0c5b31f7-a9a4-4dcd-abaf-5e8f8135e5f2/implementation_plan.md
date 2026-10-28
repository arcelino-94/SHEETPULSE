# Plano de Correção e Validação do Motor de Cálculo (Sheet R$)

1. **Ajuste na Filtragem por Data (B4 e D4)**:
   - Garantir que a filtragem de registros leve em conta exclusivamente a **Data de Digitação (coluna D:D)** compreendida rigorosamente entre a data inicial (`dataInicio` / B4) e a data final (`dataFim` / D4).
   
2. **Revisão das Fórmulas Dinâmicas (Equivalentes às Células R$)**:
   - **Vendas Totais (B16)**: Soma do volume de empréstimos (`valorEmprestimo`) de contratos com status `PAGO` e onde o cliente **pagou assessoria** (`clientePagouAssessoria === 'SIM'`) no período filtrado.
   - **Comissões J2 (B17), DG (B18), GFT (B19), SEMPRE (B20)**: Soma das comissões individuais de cada promotora para os contratos pagos filtrados no período.
   - **Pagamento de Taxas (B21)**: Soma do valor de assessoria (`valorAssessoria`) recebido no período filtrado.
   - **Lucro (B22)**: Soma de Pagamento de Taxas + Comissões Totais.
   - **Despesas (B23)**: Valor das despesas operacionais da loja associadas ao mês selecionado (ex: R$ 66.124,68 para Setembro/2026).
   - **Lucro Líquido (B24)**: Lucro - Despesas.

3. **Validação Rigorosa**:
   - Testar o período de Setembro/2026 (01/09/2026 a 30/09/2026) contra a imagem oficial da planilha e garantir correspondência exata de 100% sem utilizar valores estáticos.
