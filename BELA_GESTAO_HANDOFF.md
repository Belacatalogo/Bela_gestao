# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.21.1-lab-payments-tab-rebuild
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

O BLOCO 21B reconstruiu a aba Pagamentos no estilo do sistema antigo.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppPayments.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
```

## BLOCO 21B — Reconstrução fiel da aba Pagamentos

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.21.1-lab-payments-tab-rebuild
```

Arquivos principais:

```txt
lab/src/services/paymentInsightsService.js
lab/src/cleanAppPayments.js
lab/src/styles/payments-tab.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-21b-payments-tab-rebuild.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- reconstrói a aba Pagamentos com aparência mais próxima do sistema antigo;
- adiciona alerta de vencimento da semana;
- adiciona métricas: clientes, em atraso, vencem 7 dias, a receber e recebido;
- adiciona filtros: Todos, Pendentes, Em atraso, Vence 7 dias, Parceladas e Quitadas;
- adiciona ordenação: Vencimento, Maior atraso, Maior valor e Nome A-Z;
- adiciona busca por nome/produto;
- adiciona cards completos com vencimento, progresso, total da venda, recebido, falta receber, compra, próximo vencimento e telefone;
- adiciona parcelas tocáveis para marcar recebido/pendente;
- adiciona botão Cobrar abrindo WhatsApp em modo LAB;
- adiciona métodos de pagamento visuais;
- adiciona observações visuais;
- adiciona barra inferior com pendentes, recebido e a receber.

Limites conscientes ainda pendentes:

- vencimento real editável;
- persistência de observações;
- persistência de método de pagamento;
- múltiplas parcelas reais completas;
- WhatsApp com templates finais;
- dados reais via Firebase.

## Checklist de teste do BLOCO 21B

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.21.1-lab-payments-tab-rebuild`.
3. Registrar uma venda em Vendas, caso ainda não tenha pagamento.
4. Entrar em Pagamentos.
5. Conferir métricas do topo.
6. Testar filtros.
7. Testar ordenação.
8. Buscar por nome/produto.
9. Tocar em uma parcela para marcar recebida/pendente.
10. Testar botão Cobrar.
11. Conferir barra inferior.
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
BLOCO 21C — Reconstrução fiel da aba Relatório
```

Objetivo:

- relatório mensal;
- navegação por mês;
- recebido, a receber, lucro;
- parcelas recebidas no mês;
- cobranças por urgência;
- ainda sem Firebase real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.21.1-lab-payments-tab-rebuild`. O BLOCO 21B criou `lab/src/services/paymentInsightsService.js`, `lab/src/cleanAppPayments.js` e `lab/src/styles/payments-tab.css`, reconstruindo a aba Pagamentos fiel ao sistema antigo. Próximo bloco sugerido: `BLOCO 21C — Reconstrução fiel da aba Relatório`."
