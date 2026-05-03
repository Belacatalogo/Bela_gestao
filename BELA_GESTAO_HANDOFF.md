# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.2-lab-premium-spec-exact-ui
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

## Estado atual

O BLOCO 15 limpou a experiência principal da LAB.

O BLOCO 16 criou uma ponte de migração offline segura.

O BLOCO 17 criou o mapa real de funções antigas.

O BLOCO 18 criou o modelo de dados com histórico seguro.

O BLOCO 19 importou a identidade visual do sistema antigo por uma camada CSS modular.

O BLOCO 20 organizou a conferência das funções nos lugares corretos.

O BLOCO 21A reconstruiu a aba Clientes.

O BLOCO 21B reconstruiu a aba Pagamentos.

O BLOCO 21C reconstruiu a aba Relatório.

O BLOCO 21D reconstruiu o modal de Novo Produto com área de IA em modo LAB e corrigiu o fluxo Cloudinary automático.

O BLOCO 21E reconstruiu a aba Backup/Configurações no estilo do sistema antigo.

O BLOCO 22A adicionou o portão de login Google protegido.

O BLOCO 22B adicionou leitura controlada de dados reais em modo somente leitura após login.

O BLOCO 22C aplicou a camada visual Premium UI exata baseada no arquivo `Bela Gestão — Spec Handoff Premium UI` enviado pelo usuário.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppSettings.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
lab/src/styles/products-tab.css
lab/src/styles/settings-tab.css
lab/src/styles/premium-spec-exact.css
```

## BLOCO 22C — Premium UI exata pelo Spec Handoff

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.2-lab-premium-spec-exact-ui
```

Arquivos principais:

```txt
lab/src/styles/premium-spec-exact.css
lab/index.html
lab/src/config/appConfig.js
docs/bloco-22c-premium-spec-exact-ui.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- aplica fundo `#06050a` com halos dourado/violeta;
- aplica fontes `Cormorant Garamond` e `Montserrat`;
- aplica shell mobile-first `max-width: 480px`;
- aplica tab nav sticky com aba ativa em gradiente dourado;
- aplica cards glass com borda dourada e brilho interno;
- aplica botões pílula e chips com gradiente dourado ativo;
- aplica estilo de modal bottom sheet;
- aplica animações `fadeIn` e `slideUp`;
- aplica estados gold/green/danger;
- preserva as funções já feitas.

Regras mantidas:

- não escreve no Firebase real;
- não altera login Google real além do portão já criado;
- não altera catálogo público real;
- não interrompe backup automático atual;
- não mistura dados reais com LAB;
- não usa DOM injection;
- não usa bundle patch.

## Checklist de teste do BLOCO 22C

1. Abrir preview Netlify.
2. Confirmar versão `0.22.2-lab-premium-spec-exact-ui`.
3. Conferir fundo escuro profundo com halo dourado.
4. Conferir fonte Cormorant nos títulos.
5. Conferir tab nav sticky com aba ativa em gradiente dourado.
6. Conferir cards glass arredondados.
7. Conferir Produtos.
8. Conferir Clientes.
9. Conferir Pagamentos.
10. Conferir Relatório.
11. Conferir Ajustes.
12. Abrir Novo Produto e conferir modal bottom sheet.
13. Testar upload Cloudinary automático.
14. Testar login Google protegido.
15. Confirmar que nenhuma função real foi alterada.

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
BLOCO 22D — Ajustes finos pixel-perfect pós-teste iPhone
```

Objetivo:

- corrigir diferenças visuais percebidas no iPhone;
- ajustar espaçamentos, altura de cards, botões e abas;
- corrigir qualquer conflito da camada CSS com funções antigas.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.2-lab-premium-spec-exact-ui`. O BLOCO 22C criou `lab/src/styles/premium-spec-exact.css`, carregado por último em `lab/index.html`, aplicando o visual Premium UI do spec enviado. Próximo bloco sugerido: `BLOCO 22D — Ajustes finos pixel-perfect pós-teste iPhone`."
