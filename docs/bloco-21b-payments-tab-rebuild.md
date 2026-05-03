# BLOCO 21B — Reconstrução fiel da aba Pagamentos

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.21.1-lab-payments-tab-rebuild`

## Objetivo

Reconstruir a aba Pagamentos no estilo do sistema antigo, usando dados LAB e mantendo histórico seguro.

Este bloco não conecta Firebase real, não altera login Google, não altera catálogo real e não mexe no sistema ativo da esposa.

## Arquivos criados/alterados

### Serviço de insights de pagamentos

Criado:

```txt
lab/src/services/paymentInsightsService.js
```

Ele calcula:

- clientes com pagamentos;
- pagamentos em atraso;
- pagamentos que vencem em 7 dias;
- total a receber;
- total recebido;
- vencimento estimado;
- link de cobrança WhatsApp em modo LAB.

### Entrada visual com aba Pagamentos reconstruída

Criado:

```txt
lab/src/cleanAppPayments.js
```

### Estilo da aba Pagamentos

Criado:

```txt
lab/src/styles/payments-tab.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/payments-tab.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppPayments.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.21.1-lab-payments-tab-rebuild
```

## Funções implementadas na aba Pagamentos

- alerta de vencimento da semana;
- métricas: clientes, em atraso, vencem 7 dias, a receber e recebido;
- filtros: Todos, Pendentes, Em atraso, Vence 7 dias, Parceladas, Quitadas;
- ordenação: Vencimento, Maior atraso, Maior valor, Nome A-Z;
- busca por nome ou produto;
- cards completos com cliente, produto, status e vencimento;
- total da venda, recebido, falta receber, quantidade de parcelas, data da compra, próximo vencimento e telefone;
- parcelas tocáveis para marcar recebido/pendente;
- botão Cobrar abrindo WhatsApp em modo LAB;
- métodos de pagamento visuais: PIX, Dinheiro, Cartão, Boleto;
- observações visuais;
- barra inferior com pendentes, recebido e a receber.

## Limites conscientes

Ainda pendente para blocos futuros:

- vencimento real editável;
- persistência de observações;
- persistência de método de pagamento;
- múltiplas parcelas reais completas;
- WhatsApp com templates finais;
- Firebase real.

## Checklist de teste no iPhone

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

## Critério de aprovação

Aprovado se a aba Pagamentos estiver visualmente e funcionalmente mais próxima do sistema antigo usando dados LAB.

## Próximo bloco sugerido

`BLOCO 21C — Reconstrução fiel da aba Relatório`

Objetivo:

- relatório mensal;
- navegação por mês;
- recebido, a receber, lucro;
- parcelas recebidas no mês;
- cobranças por urgência;
- ainda sem Firebase real.
