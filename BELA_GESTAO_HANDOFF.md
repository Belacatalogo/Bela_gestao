# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.9-lab-rtdb-json-export
```

## REGRA MÁXIMA ATUAL

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

```txt
rewrite-bela-gestao-lab
```

Não mexer diretamente na `main`.
Não mexer no sistema antigo ativo da esposa.
Não escrever no Firebase real neste estágio.
Não alterar catálogo público real neste estágio.
Não interromper backup automático atual.
Não remover funções existentes sem mapear antes.
Não remover funções de IA.
Não usar DOM injection.
Não fazer bundle patch.
Não transformar o novo sistema em outro `index.html` gigante.

## Estado atual resumido

A LAB já confirmou leitura segura dos dados reais no Firebase Realtime Database, fonte `rtdb:/`.

Última contagem validada pelo usuário:

```txt
74 produtos
48 clientes derivadas
151 vendas
591 pagamentos
```

O BLOCO 22E-E adicionou exportação local JSON do RTDB encontrado, sem escrita real e sem importação automática.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppRtdbExport.js
```

Camadas/modos relevantes atuais:

```txt
lab/src/cleanAppRtdbExport.js
lab/src/services/rtdbSnapshotExportService.js
lab/src/services/realDataReadOnlyService.js
lab/src/cleanAppSettings.js
lab/src/cleanAppBackupCompare.js
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
lab/src/styles/products-tab.css
lab/src/styles/settings-tab.css
lab/src/styles/premium-spec-exact.css
lab/src/styles/catalog-backup.css
lab/src/styles/backup-compare.css
```

## Blocos recentes

- BLOCO 22E-C: comparação segura entre backup do catálogo e backup real do Gestão.
- HOTFIX 22E-C.1: montagem automática do painel de comparação de backup na aba Ajustes/Backup.
- BLOCO 22E-D: descoberta segura do backup automático Firebase em modo somente leitura.
- HOTFIX 22E-D.1: Config Firebase LAB movida para Ajustes/Configurações.
- HOTFIX 22E-D.2: probe RTDB com timeout curto.
- HOTFIX 22E-D.3: clientes derivadas de vendas/pagamentos.
- BLOCO 22E-E: exportar RTDB encontrado como JSON local.

## BLOCO 22E-E — Exportar RTDB encontrado como JSON local

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.9-lab-rtdb-json-export
```

Arquivos principais:

```txt
lab/src/services/rtdbSnapshotExportService.js
lab/src/cleanAppRtdbExport.js
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-22e-e-rtdb-json-export.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona botão `Exportar RTDB como JSON` em Ajustes;
- lê a raiz `rtdb:/` em modo somente leitura;
- baixa arquivo `.json` local com `meta`, `summary` e `data`;
- registra produtos, vendas, pagamentos, clientes separadas e clientes derivadas;
- não importa automaticamente para a LAB;
- não escreve no Firebase real;
- não altera catálogo real;
- não apaga produtos.

## Checklist de teste do BLOCO 22E-E

1. Abrir preview da branch LAB.
2. Confirmar versão `0.22.9-lab-rtdb-json-export`.
3. Ir em Ajustes.
4. Confirmar Config Firebase salva.
5. Confirmar login Google ativo.
6. Confirmar diagnóstico com `rtdb:/` encontrado.
7. Tocar em `Exportar RTDB como JSON`.
8. Confirmar download do arquivo `.json`.
9. Confirmar resumo com produtos/clientes/vendas/pagamentos.
10. Confirmar que nenhuma escrita/importação foi feita.

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
- histórico preservado mesmo se produto for removido;
- produtos só no catálogo NÃO devem ser apagados agora.

## Próximo bloco recomendado

```txt
BLOCO 23A — Importação controlada RTDB Gestão para LAB
```

Objetivo:

- ler o snapshot RTDB real/exportado;
- normalizar produtos, clientes, vendas e pagamentos;
- importar para armazenamento LAB local;
- renderizar no sistema novo;
- continuar sem escrever no Firebase real;
- continuar sem alterar catálogo real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho do Gestão é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.9-lab-rtdb-json-export`. O BLOCO 22E-E adicionou exportação local JSON do RTDB real encontrado em `rtdb:/`. Próximo bloco sugerido: `BLOCO 23A — Importação controlada RTDB Gestão para LAB`."
