# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.21.0-lab-clients-tab-rebuild
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

O BLOCO 18 criou o modelo de dados com histórico seguro.

O BLOCO 19 importou a identidade visual do sistema antigo por uma camada CSS modular.

O BLOCO 20 organizou a conferência das funções nos lugares corretos.

O BLOCO 21A reconstruiu a aba Clientes, usando vendas/pagamentos LAB para gerar clientes, ranking, filtros, busca e perfil.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppClients.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
```

## BLOCO 21A — Reconstrução fiel da aba Clientes

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.21.0-lab-clients-tab-rebuild
```

Arquivos principais:

```txt
lab/src/services/clientInsightsService.js
lab/src/cleanAppClients.js
lab/src/styles/clients-tab.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-21a-clients-tab-rebuild.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona a aba Clientes;
- calcula clientes a partir das vendas/pagamentos LAB;
- mostra métricas: clientes, pendentes, VIP, sumidas e aniversariantes;
- mostra Top 5 compradoras;
- adiciona filtros: Todas, Pendente, Quitadas, VIP e Fiel;
- adiciona ordenação: A-Z, Mais gasto, Mais compras, Recentes e Avaliação;
- adiciona busca;
- adiciona cards de cliente com avatar/iniciais;
- adiciona modal/perfil da cliente com total gasto, ticket médio, pendente, produto mais comprado e histórico.

Limites conscientes ainda pendentes:

- edição real de perfil da cliente;
- aniversário real;
- avaliação persistente;
- tags manuais VIP/fiel;
- dados reais via Firebase.

## Checklist de teste do BLOCO 21A

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.21.0-lab-clients-tab-rebuild`.
3. Ver se a aba `Clientes` aparece na navegação.
4. Registrar uma venda em Vendas, caso ainda não tenha cliente.
5. Voltar em Clientes.
6. Conferir métricas de clientes.
7. Conferir Top 5 compradoras.
8. Testar filtros.
9. Testar ordenação.
10. Buscar uma cliente.
11. Tocar em uma cliente.
12. Confirmar se abre o perfil/modal com total gasto, ticket médio e histórico.
13. Confirmar que nada pediu login Google.
14. Confirmar que nada real foi alterado.

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
BLOCO 21B — Reconstrução fiel da aba Pagamentos
```

Objetivo:

- reconstruir indicadores, filtros, busca e cards completos;
- mostrar vencimento, parcelas, recebido/falta receber;
- preparar botão Cobrar/WhatsApp em LAB;
- manter histórico seguro e ainda sem Firebase real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.21.0-lab-clients-tab-rebuild`. O BLOCO 21A criou `lab/src/services/clientInsightsService.js`, `lab/src/cleanAppClients.js` e `lab/src/styles/clients-tab.css`, adicionando a aba Clientes fiel ao sistema antigo. Próximo bloco sugerido: `BLOCO 21B — Reconstrução fiel da aba Pagamentos`."
