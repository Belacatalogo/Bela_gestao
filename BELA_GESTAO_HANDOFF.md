# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.18.0-lab-history-safe-data-model
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

O BLOCO 18 criou o modelo de dados com histórico seguro, para impedir que venda/parcela/cliente dependam da existência do produto.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppHistory.js
```

## BLOCO 18 — Modelo final de dados preservando histórico

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.18.0-lab-history-safe-data-model
```

Arquivos principais:

```txt
lab/src/services/labSalesService.js
lab/src/services/labPaymentsService.js
lab/src/services/historyIntegrityService.js
lab/src/cleanAppHistory.js
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-18-history-safe-data-model.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- venda agora guarda snapshot de cliente e produto;
- pagamento agora guarda snapshot da venda;
- valor da venda fica salvo na própria venda;
- valor da parcela fica salvo no próprio pagamento;
- histórico não depende da lista atual de produtos;
- dados antigos do LAB são normalizados ao ler;
- Ajustes mostra o card `Auditoria de histórico`.

Garantia principal:

```txt
Apagar, ocultar ou alterar produto não deve remover valor/histórico de cliente, venda ou parcela.
```

## Checklist de teste do BLOCO 18

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
BLOCO 19 — Importação visual definitiva do sistema antigo
```

Objetivo:

- aproximar a LAB da aparência real do sistema antigo;
- manter a nova estrutura modular;
- deixar cada função no visual familiar da esposa;
- ainda sem Firebase real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.18.0-lab-history-safe-data-model`. O BLOCO 18 criou histórico seguro em `lab/src/services/labSalesService.js`, `lab/src/services/labPaymentsService.js`, `lab/src/services/historyIntegrityService.js` e `lab/src/cleanAppHistory.js`. Próximo bloco sugerido: `BLOCO 19 — Importação visual definitiva do sistema antigo`."
