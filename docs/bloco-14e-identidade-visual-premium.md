# BLOCO 14E — Identidade visual definitiva do Gestão

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.14.8-lab-premium-visual-identity`

## Objetivo

Repaginar visualmente o Bela Gestão LAB com uma identidade premium baseada no catálogo, mantendo o sistema modular e sem alterar dados, Firebase, produção, catálogo antigo ou regras críticas.

## Arquivos alterados

- `lab/src/styles/premium-visual-identity.css`
  - nova camada visual modular com paleta dark/gold, grafite, degradês quentes, detalhes rosa/lilás, verde positivo e efeito liquid glass.
- `lab/index.html`
  - manteve a casca limpa e apenas adicionou o link para o CSS modular novo.
- `lab/src/config/appConfig.js`
  - atualizou a versão visível para `0.14.8-lab-premium-visual-identity`.

## Direção visual aplicada

- fundo grafite/preto profundo;
- dourado elegante como cor principal;
- gradientes discretos e profundos;
- liquid glass com transparência, blur e bordas iluminadas;
- botões e badges com acabamento premium;
- cards, hero, métricas, filtros, busca, modais e diagnóstico refinados;
- microinterações suaves de toque/hover;
- entrada leve com fade/slide;
- suporte a `prefers-reduced-motion`;
- fallback para navegadores sem `backdrop-filter`.

## Garantias do bloco

- Não mexeu na `main`.
- Não mexeu no catálogo antigo.
- Não escreveu no Firebase.
- Não alterou produção.
- Não adicionou DOM injection.
- Não embutiu CSS grande nem lógica no `index.html`.
- Não alterou serviços de dados, vendas, parcelas, backup, restore ou acesso controlado.

## Checklist de teste no iPhone/Android

1. Abrir o preview Netlify conectado à branch LAB.
2. Confirmar a versão visível `0.14.8-lab-premium-visual-identity`.
3. Conferir se o hero inicial ficou premium, legível e sem corte.
4. Rolar toda a tela e confirmar fluidez.
5. Verificar cards de dashboard, diagnóstico, Firebase LAB, PWA, backup, vendas, pagamentos, WhatsApp e produtos.
6. Testar busca e filtros de produtos.
7. Abrir modal de produto e conferir campos, foco, botões e upload.
8. Criar/editar um produto apenas no LAB.
9. Confirmar que nada pediu escrita em produção ou alterou catálogo real.

## Critério de aprovação

Aprovado se a UI parecer premium, dark/gold, organizada, legível no celular e todas as funções críticas continuarem operando como antes.
