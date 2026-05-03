# BLOCO 22E-E — Exportar RTDB encontrado como JSON local

Status: implementado na branch `rewrite-bela-gestao-lab`.

Versão esperada:

```txt
0.22.9-lab-rtdb-json-export
```

## Objetivo

Criar uma cópia local segura dos dados reais encontrados no Firebase Realtime Database antes de qualquer importação para a LAB.

## Regras mantidas

- Não mexe na `main`.
- Não altera o sistema atual ativo da esposa.
- Não escreve no Firebase real.
- Não importa automaticamente para a LAB.
- Não altera catálogo real.
- Não apaga produtos.
- Usa somente leitura após login Google.

## Arquivos adicionados/alterados

```txt
lab/src/services/rtdbSnapshotExportService.js
lab/src/cleanAppRtdbExport.js
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-22e-e-rtdb-json-export.md
```

## O que foi implementado

- novo serviço `exportRtdbSnapshotJson()`;
- leitura da raiz `rtdb:/` em modo somente leitura;
- criação de JSON local com `meta`, `summary` e `data`;
- resumo com produtos, vendas, pagamentos e clientes derivadas;
- botão em Ajustes chamado `Exportar RTDB como JSON`;
- resultado visual confirmando arquivo gerado e que nenhuma escrita/importação foi feita.

## Estrutura do JSON exportado

```txt
meta
summary
data
```

`meta` registra:

- modo readonly;
- data/hora;
- origem `rtdb:/`;
- projeto Firebase;
- usuário logado;
- `firebaseWriteExecuted: false`;
- `labImportExecuted: false`.

`summary` registra:

- produtos;
- vendas;
- pagamentos;
- clientes separadas;
- clientes derivadas de vendas/pagamentos;
- chaves raiz.

`data` contém o snapshot real completo retornado pelo RTDB.

## Checklist de teste

1. Abrir preview da branch LAB.
2. Confirmar versão `0.22.9-lab-rtdb-json-export`.
3. Ir em Ajustes.
4. Confirmar login Google ativo.
5. Confirmar que o diagnóstico já encontrou `rtdb:/`.
6. Tocar em `Exportar RTDB como JSON`.
7. Confirmar que o navegador baixa um arquivo `.json`.
8. Conferir resumo na tela.
9. Confirmar que nada foi escrito no Firebase e nada foi importado para a LAB.

## Próximo bloco sugerido

```txt
BLOCO 23A — Importação controlada RTDB Gestão para LAB
```

Objetivo:

- usar a estrutura real exportada/lida do RTDB;
- normalizar produtos, clientes, vendas e pagamentos;
- importar para armazenamento LAB local;
- renderizar no sistema novo sem escrever no Firebase real.
