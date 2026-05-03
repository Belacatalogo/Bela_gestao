# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.21.2-lab-report-tab-rebuild
```

## REGRA MÁXIMA ATUAL

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

```txt
rewrite-bela-gestao-lab
```

Não mexer diretamente na `main`.
Não mexer no sistema antigo ativo da esposa.
Não escrever no Firebase real neste estágio.
Não alterar login Google real neste estágio.
Não alterar catálogo público real neste estágio.
Não interromper backup automático atual.
Não remover funções existentes sem mapear antes.
Não remover funções de IA.
Não usar DOM injection.
Não fazer bundle patch.
Não transformar o novo sistema em outro `index.html` gigante.

## Estado atual

O BLOCO 15 limpou a experiência principal da LAB.

O BLOCO 16 criou uma ponte de migração offline segura.

O BLOCO 17 criou o mapa real de funções antigas.

O BLOCO 18 criou o modelo de dados com histórico seguro.

O BLOCO 19 importou a identidade visual do sistema antigo por uma camada CSS modular.

O BLOCO 20 organizou a conferência das funções nos lugares corretos.

O BLOCO 21A reconstruiu a aba Clientes.

O BLOCO 21B reconstruiu a aba Pagamentos.

O BLOCO 21C reconstruiu a aba Relatório no estilo do sistema antigo.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppReport.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
```

## BLOCO 21C — Reconstrução fiel da aba Relatório

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.21.2-lab-report-tab-rebuild
```

Arquivos principais:

```txt
lab/src/services/reportInsightsService.js
lab/src/cleanAppReport.js
lab/src/styles/report-tab.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-21c-report-tab-rebuild.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona a aba Relatório;
- adiciona navegação por mês anterior/próximo;
- mostra vendas no mês;
- mostra recebido no mês;
- mostra a receber no mês;
- mostra lucro;
- mostra vendas por categoria;
- mostra parcelas recebidas este mês;
- mostra cobranças por urgência;
- mantém botão Cobrar em WhatsApp modo LAB.

Limites conscientes ainda pendentes:

- gráficos visuais mais avançados;
- exportação do relatório;
- datas reais editáveis;
- filtros por período customizado;
- dados reais via Firebase.

## Checklist de teste do BLOCO 21C

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

## Funções críticas finais que precisam continuar antes da entrega

- produtos;
- categorias/abas do catálogo;
- ligação Gestão ↔ Catálogo;
- upload de foto/geração automática de URL de imagem;
- Firebase/fonte compartilhada;
- login Google da esposa;
- backup automático atual;
- localStorage/dados antigos;
- vendas;
- compradores/clientes;
- pagamentos/parcelas;
- WhatsApp;
- PWA/iPhone;
- backup/configurações;
- funções de IA na criação/descrição de produto;
- histórico preservado mesmo se produto for removido.

## Próximo bloco recomendado

```txt
BLOCO 21D — Reconstrução fiel da aba Produtos + Novo Produto com IA
```

Objetivo:

- reconstruir Produtos igual ao sistema antigo;
- Novo Produto em tela/modal grande;
- adicionar foto por URL e celular;
- incluir seção IA no formulário;
- manter tudo LAB/offline até integrar IA real depois.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.21.2-lab-report-tab-rebuild`. O BLOCO 21C criou `lab/src/services/reportInsightsService.js`, `lab/src/cleanAppReport.js` e `lab/src/styles/report-tab.css`, reconstruindo a aba Relatório fiel ao sistema antigo. Próximo bloco sugerido: `BLOCO 21D — Reconstrução fiel da aba Produtos + Novo Produto com IA`."
