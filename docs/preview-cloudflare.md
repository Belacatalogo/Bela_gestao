# Preview pelo Cloudflare Pages — Bela Gestão

Branch de trabalho: `rewrite-bela-gestao-lab`

## Objetivo

Criar um preview separado para testar o Bela Gestão no iPhone sem usar GitHub Pages e sem mexer no Vercel que está fixo no sistema de inglês.

## Quando usar

Usar quando o primeiro bloco visual/testável estiver pronto.

Recomendação:
- configurar o Cloudflare Pages no final do BLOCO 1 ou no começo do BLOCO 2;
- antes disso, ainda estamos apenas criando documentação e auditoria.

## Configuração recomendada

Projeto Cloudflare Pages separado:

```txt
Nome do projeto: bela-gestao-lab
Repositório: Belacatalogo/Bela_gestao
Branch de produção/preview inicial: rewrite-bela-gestao-lab
Framework preset: None / Static / HTML
Build command: deixar vazio
Output directory: /
```

Enquanto o projeto ainda for HTML/CSS/JS estático puro, não precisa build.

Quando a reconstrução modular evoluir para uma estrutura com bundler, essa configuração poderá mudar. Por enquanto, manter simples.

## Passo a passo no iPhone

1. Acesse o site da Cloudflare.
2. Crie ou entre na sua conta.
3. Vá em `Workers & Pages`.
4. Toque em `Create application`.
5. Escolha `Pages`.
6. Escolha `Connect to Git`.
7. Conecte sua conta GitHub se pedir autorização.
8. Selecione o repositório `Belacatalogo/Bela_gestao`.
9. Configure:

```txt
Project name: bela-gestao-lab
Production branch: rewrite-bela-gestao-lab
Framework preset: None
Build command: vazio
Build output directory: /
```

10. Toque em `Save and Deploy`.
11. Aguarde o deploy ficar pronto.
12. Abra o link gerado no iPhone.

## O que testar no primeiro preview

Quando houver um bloco visual testável:

- abrir o link no Safari do iPhone;
- confirmar que a branch lab aparece na tela ou no painel de diagnóstico;
- confirmar que o app carrega sem tela branca;
- confirmar que o layout não estoura a largura;
- confirmar que o teclado abre nos campos testáveis;
- confirmar que a rolagem funciona;
- confirmar que a `main` do GitHub não foi alterada.

## Observação importante sobre Firebase

Se o Firebase bloquear o domínio do Cloudflare, será necessário adicionar o domínio gerado pelo Cloudflare Pages na lista de domínios autorizados do Firebase Authentication, caso o Gestão use login/autenticação.

Isso deve ser feito apenas quando chegarmos no bloco de Firebase/autenticação, se necessário.

## Observação importante sobre PWA/cache

Durante a reconstrução, o service worker antigo pode prender cache no iPhone.

Por isso a versão nova deve:

- mostrar versão/branch visível;
- usar cache com nome versionado;
- ter botão ou orientação para limpar cache se necessário;
- evitar service worker inline no novo sistema.
