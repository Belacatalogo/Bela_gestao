# BLOCO 22B — Leitura controlada dos dados reais após login

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.22.1-lab-real-readonly-preview`

## Objetivo

Permitir que, após login Google, o sistema tente ler dados reais em modo somente leitura e mostre uma prévia separada dos dados LAB.

## Regras mantidas

- Não escreve no Firebase real.
- Não altera catálogo real.
- Não mistura dados reais com dados LAB.
- Não substitui produtos, vendas, clientes ou pagamentos LAB.
- Não mexe no sistema ativo da esposa.

## Arquivos criados/alterados

### Serviço de leitura real somente leitura

Criado:

```txt
lab/src/services/realDataReadOnlyService.js
```

Ele tenta ler caminhos candidatos do Firestore após login Google e retorna:

- totais encontrados;
- caminhos encontrados;
- caminhos vazios;
- erros/permissões bloqueadas.

### Ajustes/Backup

Alterado:

```txt
lab/src/cleanAppSettings.js
```

O botão de login agora mostra:

```txt
Ler dados reais agora
```

Após clicar, aparece a prévia separada.

### CSS

Alterado:

```txt
lab/src/styles/settings-tab.css
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.22.1-lab-real-readonly-preview
```

## O que aparece na tela

Depois de fazer login Google e tocar em `Ler dados reais agora`, o sistema mostra:

- Produtos reais encontrados;
- Vendas reais encontradas;
- Clientes reais encontrados;
- Pagamentos reais encontrados;
- caminhos encontrados;
- diagnóstico de caminhos verificados.

## Critério de aprovação

Aprovado se:

1. antes do login os dados reais ficam bloqueados;
2. depois do login o botão `Ler dados reais agora` aparece;
3. clicar nele não altera nada real;
4. a prévia aparece separada dos dados LAB;
5. se não encontrar dados, aparece diagnóstico claro dos caminhos.

## Próximo bloco sugerido

`BLOCO 22C — Identificar caminho real correto e mapear dados reais`

Objetivo:

- usar o diagnóstico do 22B para descobrir onde estão os dados reais;
- mapear estrutura real;
- preparar importação controlada somente depois de backup completo.
