# BLOCO 18 — Modelo final de dados preservando histórico

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.18.0-lab-history-safe-data-model`

## Objetivo

Blindar a estrutura de dados para impedir que apagar/ocultar/alterar produto remova valores, vendas, parcelas ou ficha da cliente.

Este bloco continua 100% LAB/offline:

- não escreve no Firebase real;
- não altera login Google real;
- não altera catálogo real;
- não mexe no sistema ativo da esposa.

## Problema que este bloco resolve

O usuário relatou antes que, no sistema antigo/atual, ao apagar o produto comprado por uma cliente, o valor registrado na ficha dela saiu.

Isso acontece quando venda/pagamento dependem diretamente do produto atual.

A correção estrutural é:

```txt
Product pode mudar ou sumir
Sale mantém cópia do produto vendido
Payment mantém cópia da venda/parcela
Customer mantém dados próprios
```

## Arquivos alterados/criados

### Serviço de vendas blindado

Alterado:

```txt
lab/src/services/labSalesService.js
```

Agora cada venda salva:

- `customer`;
- `customerId`;
- `customerName`;
- `originalProductId`;
- `productSnapshot`;
- `unitPrice`;
- `unitCost`;
- `total`;
- `profit`;
- `schemaVersion: history-v1`.

### Serviço de pagamentos blindado

Alterado:

```txt
lab/src/services/labPaymentsService.js
```

Agora cada pagamento salva:

- `saleSnapshot`;
- `customerId`;
- `saleClientName`;
- `saleProductName`;
- `originalProductId`;
- `amount` próprio;
- `schemaVersion: history-v1`.

### Auditoria de integridade histórica

Criado:

```txt
lab/src/services/historyIntegrityService.js
```

Audita se vendas e pagamentos têm snapshots suficientes para sobreviver à remoção de produtos.

### Entrada visual com auditoria

Criado:

```txt
lab/src/cleanAppHistory.js
```

Alterado:

```txt
lab/src/main.js
```

A LAB agora carrega `cleanAppHistory.js`.

### Versão atualizada

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.18.0-lab-history-safe-data-model
```

## O que aparece na tela

Na aba Ajustes agora existe o card:

```txt
Auditoria de histórico
```

Ele mostra:

- vendas blindadas;
- pagamentos blindados;
- alertas;
- garantias aplicadas.

Em Vendas e Pagamentos, os cards também indicam se o snapshot está preservado.

## Garantias do bloco

- Venda guarda snapshot de cliente e produto.
- Pagamento guarda snapshot da venda.
- Valor total da venda fica salvo na própria venda.
- Valor da parcela fica salvo no próprio pagamento.
- Histórico não depende da lista atual de produtos.
- Dados antigos do LAB são normalizados ao ler.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.18.0-lab-history-safe-data-model`.
3. Criar um produto de teste.
4. Registrar uma venda com esse produto.
5. Ir em Vendas e confirmar que aparece `Snapshot: produto preservado`.
6. Ir em Pagamentos e confirmar que aparece `Snapshot da venda: preservado`.
7. Ir em Ajustes.
8. Conferir o card `Auditoria de histórico`.
9. Confirmar se `Alertas` está em 0.
10. Ocultar o produto em Produtos.
11. Conferir se a venda e o pagamento continuam com nome/valor do produto.
12. Exportar backup LAB e confirmar que a operação continua funcionando.

## Critério de aprovação

Aprovado se a venda/pagamento continuam mostrando cliente, produto vendido e valor mesmo depois de ocultar/alterar o produto no LAB.

## Próximo bloco sugerido

`BLOCO 19 — Importação visual definitiva do sistema antigo`

Objetivo:

- aproximar a LAB da aparência real do sistema antigo;
- manter a nova estrutura modular;
- deixar cada função no visual familiar da esposa;
- ainda sem Firebase real.
