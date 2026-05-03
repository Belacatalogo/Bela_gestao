# BLOCO 19 — Importação visual definitiva do sistema antigo

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.19.0-lab-legacy-visual-import`

## Objetivo

Aproximar a LAB da aparência real do sistema antigo, mantendo a nova estrutura modular e o modelo seguro do BLOCO 18.

Este bloco é somente visual:

- não escreve no Firebase real;
- não altera login Google real;
- não altera catálogo real;
- não mexe no sistema ativo da esposa;
- não altera a regra de histórico seguro;
- não usa DOM injection;
- não faz bundle patch.

## Referência visual usada

O `index.html` antigo da `main` usa:

- fundo `#080808`;
- cards escuros compactos;
- dourado `#C9A84C`;
- fonte `Cormorant Garamond` para títulos/valores;
- `Montserrat` para botões/textos técnicos;
- abas superiores simples com underline dourado;
- cards de produto compactos;
- botões retangulares arredondados, não tão “pill premium”;
- dashboard em grade com divisórias finas.

## Arquivos criados/alterados

### Camada visual modular

Criado:

```txt
lab/src/styles/legacy-visual-import.css
```

Essa camada sobrescreve apenas visualmente a experiência limpa atual para ficar mais próxima do sistema antigo.

### HTML da LAB

Alterado:

```txt
lab/index.html
```

Adicionado o CSS:

```txt
./src/styles/legacy-visual-import.css
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.19.0-lab-legacy-visual-import
```

## O que mudou visualmente

- hero ficou mais compacto e menos “landing page”;
- abas ficaram mais parecidas com o sistema antigo;
- cards ficaram mais escuros, menores e retos;
- botões ficaram mais próximos dos botões antigos;
- métricas ficaram em grade com divisórias finas;
- lista de produtos ficou mais compacta;
- ajustes/migração/auditoria mantêm o conteúdo, mas com visual menos LAB e mais Gestão.

## O que NÃO mudou

- serviços de dados;
- venda blindada;
- pagamento blindado;
- importação offline;
- auditoria de histórico;
- mapa de funções;
- Firebase real;
- login Google real;
- catálogo real;
- sistema ativo da esposa.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.19.0-lab-legacy-visual-import`.
3. Comparar a sensação visual com o sistema antigo.
4. Ver se o topo ficou menor e mais parecido com gestão real.
5. Ver se as abas ficaram legíveis e familiares.
6. Entrar em Produtos e conferir cards/botões.
7. Entrar em Vendas e Pagamentos.
8. Entrar em Ajustes e conferir se Migração/Auditoria continuam legíveis.
9. Criar venda e confirmar que snapshot/histórico continuam funcionando.
10. Confirmar que nada pediu login Google.
11. Confirmar que nada real foi alterado.

## Critério de aprovação

Aprovado se o usuário sentir que a LAB está visualmente mais próxima do sistema antigo, sem perder a estrutura segura e modular.

## Próximo bloco sugerido

`BLOCO 20 — Conferência das funções nos lugares corretos`

Objetivo:

- organizar onde cada função deve aparecer;
- confirmar produtos, vendas, pagamentos, catálogo e ajustes;
- separar o que é função de uso diário do que é ferramenta de migração/LAB;
- preparar a UI final antes de Firebase/login real.
