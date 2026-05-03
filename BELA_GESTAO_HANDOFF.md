# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.19.0-lab-legacy-visual-import
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

O BLOCO 19 importou a identidade visual do sistema antigo por uma camada CSS modular, sem alterar dados ou produção.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppHistory.js
```

Camada visual atual:

```txt
lab/src/styles/legacy-visual-import.css
```

## BLOCO 19 — Importação visual definitiva do sistema antigo

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.19.0-lab-legacy-visual-import
```

Arquivos principais:

```txt
lab/src/styles/legacy-visual-import.css
lab/index.html
lab/src/config/appConfig.js
docs/bloco-19-legacy-visual-import.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- aproxima a LAB da aparência real do sistema antigo;
- deixa hero/topo mais compacto;
- muda abas para estilo antigo com underline dourado;
- reduz cards e botões para visual mais Gestão;
- usa fundo preto, dourado, Cormorant e Montserrat como no sistema antigo;
- mantém a estrutura modular e o histórico seguro do BLOCO 18.

O que NÃO faz:

- não altera serviços de dados;
- não altera venda blindada;
- não altera pagamento blindado;
- não altera importação offline;
- não conecta Firebase real;
- não pede login Google;
- não altera catálogo real;
- não mexe no sistema ativo da esposa.

## Checklist de teste do BLOCO 19

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
BLOCO 20 — Conferência das funções nos lugares corretos
```

Objetivo:

- organizar onde cada função deve aparecer;
- confirmar produtos, vendas, pagamentos, catálogo e ajustes;
- separar função de uso diário de ferramenta de migração/LAB;
- preparar a UI final antes de Firebase/login real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.19.0-lab-legacy-visual-import`. O BLOCO 19 adicionou `lab/src/styles/legacy-visual-import.css`, carregado em `lab/index.html`, para aproximar a LAB do visual antigo mantendo o histórico seguro do BLOCO 18. Próximo bloco sugerido: `BLOCO 20 — Conferência das funções nos lugares corretos`."
