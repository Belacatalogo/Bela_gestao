# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.16.0-lab-offline-migration-bridge
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

O BLOCO 15 limpou a experiência principal da LAB, escondendo ferramentas técnicas da tela normal.

O BLOCO 16 criou uma ponte de migração offline segura para preparar a futura transição do sistema antigo para o novo sistema sem tocar no ambiente ativo.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppMigration.js
```

## BLOCO 16 — Ponte de migração offline segura

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.16.0-lab-offline-migration-bridge
```

Arquivos principais:

```txt
lab/src/services/offlineMigrationService.js
lab/src/cleanAppMigration.js
lab/src/config/appConfig.js
docs/bloco-16-offline-migration-bridge.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona um serviço de migração offline;
- adiciona, na aba Ajustes, o card `Migração offline do sistema antigo`;
- permite analisar um backup/export antigo JSON;
- permite importar dados apenas para LAB/localStorage;
- mostra explicitamente que Firebase real, login Google real, catálogo real e sistema ativo estão bloqueados;
- prepara a futura entrega final sem mexer no sistema ativo da esposa.

O que NÃO faz:

- não escreve no Firebase real;
- não pede login Google;
- não altera catálogo real;
- não altera backup automático atual;
- não substitui o sistema antigo;
- não ativa IA real ainda.

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

## Checklist de teste do BLOCO 16

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.16.0-lab-offline-migration-bridge`.
3. Entrar em Ajustes.
4. Ver o card `Migração offline do sistema antigo`.
5. Confirmar que os alvos reais aparecem como bloqueados.
6. Selecionar um backup/export antigo `.json`, se disponível.
7. Conferir se a análise mostra preços, vendas e parcelas.
8. Tocar em `Importar para LAB` somente se a análise estiver OK.
9. Conferir Produtos, Vendas e Pagamentos após importar.
10. Confirmar que nenhum login Google foi pedido.
11. Confirmar que nenhum Firebase real foi alterado.
12. Confirmar que o catálogo real não foi alterado.

## Próximo bloco recomendado

```txt
BLOCO 17 — Mapa real de funções do sistema antigo
```

Objetivo:

- mapear no `index.html` antigo as funções reais de produto, catálogo, IA, foto, Firebase, Google Login e backup;
- criar uma lista objetiva do que falta portar para o novo sistema;
- não mexer ainda em produção.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.16.0-lab-offline-migration-bridge`. O BLOCO 16 criou a ponte de migração offline segura em `lab/src/services/offlineMigrationService.js` e `lab/src/cleanAppMigration.js`. A aba Ajustes permite analisar backup antigo e importar somente para LAB/localStorage. Próximo bloco sugerido: `BLOCO 17 — Mapa real de funções do sistema antigo`, para mapear produto, catálogo, IA, foto, Firebase, Google Login e backup antes de qualquer conexão real."
