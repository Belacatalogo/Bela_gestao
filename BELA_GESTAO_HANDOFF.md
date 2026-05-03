# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.17.0-lab-legacy-function-map
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

O BLOCO 17 criou o mapa real de funções antigas, para visualizar o que já está confirmado, parcial ou pendente antes da entrega final.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppFunctionMap.js
```

## BLOCO 17 — Mapa real de funções do sistema antigo

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.17.0-lab-legacy-function-map
```

Arquivos principais:

```txt
lab/src/services/legacyFunctionMapService.js
lab/src/cleanAppFunctionMap.js
lab/src/styles/clean-app.css
lab/src/config/appConfig.js
docs/bloco-17-legacy-function-map.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- registra as funções antigas que precisam ser preservadas;
- classifica cada função como confirmada, parcial ou pendente de validação;
- mostra o mapa na aba Ajustes;
- deixa claro que isso é apenas mapeamento, sem conexão real;
- reforça que a entrega final depende de validar Firebase, login Google, catálogo, IA, upload real, WhatsApp, PWA e backup automático.

Funções mapeadas:

- Produtos;
- Ligação Gestão ↔ Catálogo;
- Upload de foto / URL automática;
- Vendas e compradores;
- Pagamentos e parcelas;
- Firebase, login Google e backup automático;
- IA na criação de produto;
- WhatsApp;
- PWA/iPhone.

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

## Checklist de teste do BLOCO 17

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.17.0-lab-legacy-function-map`.
3. Entrar em Ajustes.
4. Ver o card `Mapa real de funções antigas`.
5. Abrir alguns itens do mapa.
6. Confirmar que há status como Confirmado, Parcial e Validar.
7. Confirmar que a tela não tenta login Google.
8. Confirmar que nada real foi alterado.
9. Confirmar se o mapa está legível no iPhone.

## Próximo bloco recomendado

```txt
BLOCO 18 — Modelo final de dados preservando histórico
```

Objetivo:

- separar definitivamente Product, Sale, Customer e Payment;
- garantir que venda/parcela/cliente não dependam da existência do produto;
- impedir novamente o erro onde apagar produto remove valor/histórico da ficha da cliente;
- manter tudo offline/LAB ainda.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.17.0-lab-legacy-function-map`. O BLOCO 17 criou `lab/src/services/legacyFunctionMapService.js` e `lab/src/cleanAppFunctionMap.js`, mostrando em Ajustes o mapa real de funções antigas. Próximo bloco sugerido: `BLOCO 18 — Modelo final de dados preservando histórico`, para separar Product, Sale, Customer e Payment e impedir que apagar produto remova valores/histórico de cliente."
