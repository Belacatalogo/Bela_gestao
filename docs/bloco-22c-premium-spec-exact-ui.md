# BLOCO 22C — Premium UI exata pelo Spec Handoff

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada:

```txt
0.22.2-lab-premium-spec-exact-ui
```

## Origem visual

Arquivo de referência enviado pelo usuário:

```txt
Bela Gestão — Spec Handoff Premium UI
```

O visual foi aplicado com base nos tokens e regras do spec:

- fundo global `#06050a`;
- gradiente dourado `linear-gradient(135deg,#7a5a18 0%,#c9a84c 38%,#f5e4a0 52%,#b8922a 100%)`;
- fontes `Cormorant Garamond` e `Montserrat`;
- app shell mobile-first com `max-width: 480px`;
- tab nav sticky;
- cards glass com borda dourada e brilho interno;
- botões pílula;
- chips ativos com gradiente dourado;
- modais bottom sheet;
- animações `fadeIn` e `slideUp`;
- estados green/danger/gold.

## Arquivos criados/alterados

Criado:

```txt
lab/src/styles/premium-spec-exact.css
```

Alterado:

```txt
lab/index.html
lab/src/config/appConfig.js
BELA_GESTAO_HANDOFF.md
```

## Estratégia

Foi adicionada uma camada CSS final, carregada por último, para refazer o visual sem mexer nas funções já implementadas.

Isso preserva:

- login Google protegido;
- leitura real somente leitura;
- Cloudinary automático;
- Novo Produto com IA bloqueada até URL;
- Clientes;
- Pagamentos;
- Relatório;
- Ajustes.

## Regras mantidas

- Não mexe na `main`;
- não escreve no Firebase real;
- não altera catálogo real;
- não altera sistema ativo da esposa;
- não mistura dados reais com dados LAB;
- não usa DOM injection;
- não usa bundle patch.

## Checklist de teste no iPhone

1. Abrir preview Netlify da branch LAB.
2. Confirmar versão `0.22.2-lab-premium-spec-exact-ui`.
3. Conferir fundo escuro profundo com halo dourado.
4. Conferir fonte Cormorant nos títulos.
5. Conferir tab nav sticky com aba ativa em gradiente dourado.
6. Conferir cards glass com bordas arredondadas.
7. Conferir Produtos.
8. Conferir Clientes.
9. Conferir Pagamentos.
10. Conferir Relatório.
11. Conferir Ajustes.
12. Abrir Novo Produto e conferir modal bottom sheet.
13. Testar Cloudinary automático.
14. Testar login Google protegido.
15. Confirmar que nenhuma função real foi alterada.

## Próximo bloco sugerido

```txt
BLOCO 22D — Ajustes finos pixel-perfect pós-teste iPhone
```

Objetivo:

- corrigir diferenças visuais percebidas no iPhone;
- ajustar espaçamentos, altura de cards, botões e abas;
- corrigir qualquer conflito da camada CSS com funções antigas.
