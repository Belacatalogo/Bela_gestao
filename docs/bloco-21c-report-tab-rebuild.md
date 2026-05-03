# BLOCO 21C — Reconstrução fiel da aba Relatório

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.21.2-lab-report-tab-rebuild`

## Objetivo

Reconstruir a aba Relatório no estilo do sistema antigo, usando dados LAB e mantendo histórico seguro.

Este bloco não conecta Firebase real, não altera login Google, não altera catálogo real e não mexe no sistema ativo da esposa.

## Arquivos criados/alterados

### Serviço de relatório

Criado:

```txt
lab/src/services/reportInsightsService.js
```

Ele calcula:

- vendas do mês;
- recebido no mês;
- a receber no mês;
- lucro do mês;
- vendas por categoria;
- parcelas recebidas no mês;
- cobranças urgentes.

### Entrada visual da aba Relatório

Criado:

```txt
lab/src/cleanAppReport.js
```

### Estilo da aba Relatório

Criado:

```txt
lab/src/styles/report-tab.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/report-tab.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppReport.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.21.2-lab-report-tab-rebuild
```

## Funções implementadas na aba Relatório

- nova aba `Relatório`;
- navegação por mês anterior/próximo;
- métricas: vendas no mês, recebido, a receber e lucro;
- seção vendas por categoria;
- seção parcelas recebidas este mês;
- seção cobranças por urgência;
- botão Cobrar abrindo WhatsApp em modo LAB.

## Limites conscientes

Ainda pendente para blocos futuros:

- gráficos visuais mais avançados;
- exportação do relatório;
- datas reais editáveis;
- filtros por período customizado;
- dados reais via Firebase.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.21.2-lab-report-tab-rebuild`.
3. Ver se a aba `Relatório` aparece na navegação.
4. Registrar venda/pagamento em LAB se necessário.
5. Entrar em Relatório.
6. Testar mês anterior e próximo.
7. Conferir métricas do mês.
8. Conferir vendas por categoria.
9. Conferir parcelas recebidas do mês.
10. Conferir cobranças por urgência.
11. Testar botão Cobrar.
12. Confirmar que nada pediu login Google.
13. Confirmar que nada real foi alterado.

## Critério de aprovação

Aprovado se a aba Relatório estiver visualmente e funcionalmente mais próxima do sistema antigo usando dados LAB.

## Próximo bloco sugerido

`BLOCO 21D — Reconstrução fiel da aba Produtos + Novo Produto com IA`

Objetivo:

- reconstruir Produtos igual ao sistema antigo;
- Novo Produto em tela/modal grande;
- adicionar foto por URL e celular;
- incluir seção IA no formulário;
- manter tudo LAB/offline até integrar IA real depois.
