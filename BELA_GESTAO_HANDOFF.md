# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

## REGRA MÁXIMA

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

`rewrite-bela-gestao-lab`

Não mexer diretamente na `main`.
Não quebrar a ligação com o catálogo público.
Não remover funções existentes sem mapear antes.
Não remover funções de IA.
Não transformar o novo sistema em outro `index.html` gigante.
Não usar DOM injection.
Não fazer remendos sobrepostos.
Não misturar HTML, CSS, dados, Firebase, IA e regras de negócio no mesmo arquivo.

## Funções críticas que devem ser preservadas

- produtos;
- categorias/abas do catálogo;
- ligação Gestão ↔ Catálogo;
- Firebase/fonte compartilhada;
- localStorage/dados antigos;
- vendas;
- compradores;
- pagamentos/parcelas;
- WhatsApp;
- PWA/iPhone;
- backup/configurações;
- funções de IA.

## Regra específica para IA

O usuário informou que o Bela Gestão usa funções de IA.

Portanto:

- IA é função crítica;
- não remover IA;
- não simplificar IA sem autorização;
- não expor chaves sensíveis;
- não enviar mensagem automaticamente sem ação do usuário;
- manter fallback manual se IA falhar;
- mapear todas as funções de IA antes de reescrever telas que dependem delas.

Auditoria específica criada em:

```txt
docs/auditoria-ia.md
```

## Regra de validação do usuário

A partir do primeiro bloco que gerar algo testável, cada bloco deve terminar com:

1. resumo claro do que mudou;
2. link ou forma de preview disponível;
3. checklist exato do que o usuário deve testar no iPhone;
4. critério objetivo de aprovação;
5. aviso do que NÃO foi alterado.

Não avançar para blocos maiores sem orientar o teste do bloco anterior.

O usuário não quer testar pelo GitHub Pages e não quer mexer no Vercel atual, porque o Vercel está fixo no sistema de inglês. Portanto, a reconstrução deve considerar uma alternativa de preview separada, preferencialmente sem afetar Vercel nem produção.

## Estratégia de preview

Opções consideradas:

1. Cloudflare Pages separado para `Bela_gestao`:
   - não interfere no Vercel;
   - pode conectar ao GitHub;
   - gera previews por branch/PR;
   - bom para testar no iPhone.

2. Netlify separado para `Bela_gestao`:
   - não interfere no Vercel;
   - pode conectar ao GitHub;
   - gera deploy previews/branch deploys;
   - bom para testar app estático.

3. Preview temporário via arquivo/ZIP:
   - útil só para inspeção simples;
   - pior para PWA, Firebase e cache;
   - não recomendado como validação principal.

Decisão recomendada para o projeto:
- usar Cloudflare Pages ou Netlify como preview exclusivo do Bela Gestão;
- manter Vercel intocado;
- manter GitHub Pages fora do fluxo, conforme pedido do usuário.

## Objetivo da reconstrução

Reconstruir o Bela Gestão de forma modular, segura e limpa, preservando as funções importantes atuais e melhorando a manutenção futura.

O Bela Gestão é o painel interno usado para controlar produtos, vendas, pagamentos, IA e dados que alimentam o catálogo público enviado às clientes.

Fluxo esperado:

```txt
Bela Gestão
  ↓ cria/edita/publica produtos
Firebase / fonte compartilhada
  ↓ catálogo lê os produtos publicados
Bela Catálogo
```

## Estado inicial

Estado no início da reconstrução:

- repositório: `Belacatalogo/Bela_gestao`;
- branch base: `main`;
- commit base: `cd92d1e9595bd870641fe49639fccaddf0a3fa1e`;
- arquivo principal atual: `index.html`;
- arquitetura atual: arquivo único grande com HTML, CSS, JavaScript, PWA, lógica de produtos, vendas, pagamentos e configurações misturados.

## Branches

- `main`: produção atual, não mexer diretamente.
- `rewrite-bela-gestao-lab`: laboratório da reconstrução.

## Regras de trabalho por bloco

Cada bloco deve:

1. ter objetivo claro;
2. alterar poucos arquivos;
3. preservar funções existentes;
4. registrar o que mudou neste handoff;
5. permitir teste no iPhone;
6. não depender de gambiarra visual ou DOM injection;
7. manter compatibilidade com o catálogo;
8. entregar checklist de teste quando houver algo testável.

## Bloco atual

### BLOCO 1B — Modo visitante e catálogo fictício LAB

Status: implementado, aguardando preview/teste no iPhone.

Objetivo:
- permitir teste inicial sem login Google da esposa;
- criar dados fictícios isolados;
- criar um catálogo fictício em `/lab/catalogo-preview/`;
- permitir testar publicar/ocultar produto sem tocar Firebase nem catálogo real;
- manter tudo separado do sistema antigo.

Arquivos adicionados/alterados neste bloco:
- `lab/src/services/labDataService.js`;
- `lab/src/utils/money.js`;
- `lab/src/app.js`;
- `lab/src/styles/layout.css`;
- `lab/catalogo-preview/index.html`;
- `lab/catalogo-preview/preview.js`;
- `lab/catalogo-preview/preview.css`;
- `BELA_GESTAO_HANDOFF.md`.

Comportamento atual:
- a Gestão LAB mostra modo visitante;
- produtos fictícios são salvos no navegador com `localStorage` pela chave `belaGestaoLab.products.v1`;
- botão `Ocultar/Publicar` altera apenas o produto fictício;
- botão `Restaurar dados teste` volta para os produtos fictícios iniciais;
- o catálogo fictício lê apenas produtos visíveis;
- nada escreve no Firebase;
- nada altera o catálogo real;
- não usa login Google;
- não usa IA real ainda.

Checklist de teste do BLOCO 1B:
1. abrir o preview Cloudflare no iPhone;
2. entrar em `/lab/`;
3. confirmar que aparece o painel `Modo visitante`;
4. confirmar que aparecem 3 produtos de teste;
5. tocar em `Abrir catálogo fictício`;
6. confirmar que abre `/lab/catalogo-preview/`;
7. confirmar que aparecem apenas 2 produtos visíveis;
8. voltar para a Gestão LAB;
9. tocar em `Publicar` no produto oculto;
10. abrir o catálogo fictício de novo;
11. confirmar que agora aparecem 3 produtos;
12. voltar e tocar em `Ocultar` em algum produto visível;
13. confirmar que ele some do catálogo fictício;
14. tocar em `Restaurar dados teste`;
15. confirmar que volta para 3 produtos no painel e 2 visíveis no catálogo;
16. abrir `/` e confirmar que o sistema antigo da raiz continua intacto.

Critério de aprovação:
- modo visitante funciona no iPhone;
- catálogo fictício abre;
- publicar/ocultar altera somente o catálogo fictício;
- restaurar dados teste funciona;
- nenhum dado real é alterado;
- app antigo continua intacto.

## Histórico de blocos

### BLOCO 1 — Base modular limpa

Status: implementado.

Objetivo:
- criar uma base modular inicial sem substituir o sistema antigo;
- manter o `index.html` da raiz intacto;
- criar a reconstrução inicial em `/lab`;
- mostrar branch, versão e funções críticas preservadas;
- preparar o primeiro teste visual no Cloudflare Pages.

Arquivos adicionados neste bloco:
- `lab/index.html`;
- `lab/src/main.js`;
- `lab/src/app.js`;
- `lab/src/config/appConfig.js`;
- `lab/src/styles/base.css`;
- `lab/src/styles/layout.css`.

### BLOCO 0C — Auditoria de IA e funções críticas

Status: implementado.

Objetivo:
- registrar IA como função crítica;
- criar auditoria separada para IA;
- garantir que a futura arquitetura tenha `aiService`, `messageService`, `aiConfig` e prompts versionados;
- continuar mapeando funções reais antes da reescrita de produtos/vendas/pagamentos.

Arquivos adicionados/atualizados neste bloco:
- `docs/auditoria-ia.md`;
- `BELA_GESTAO_HANDOFF.md`.

Nenhuma função do sistema antigo foi removida neste bloco.

## Próximos blocos previstos

### BLOCO 2 — Camada de dados e Firebase

Separar conexão, leitura, escrita, fallback local e status de sincronização.

Teste esperado:
- abrir status de conexão;
- confirmar que erro aparece de forma clara se Firebase falhar;
- confirmar que nada é salvo em local errado.

### BLOCO 3 — Produtos

Recriar cadastro, edição, visibilidade no catálogo e categorias.

Teste esperado:
- cadastrar produto teste;
- editar produto teste;
- ocultar/publicar produto;
- confirmar que os dados ficam persistidos.

### BLOCO 4 — Tela de produtos

Criar UI limpa, responsiva e segura para iPhone.

Teste esperado:
- testar busca;
- testar filtros;
- abrir/fechar modal;
- digitar em campos e confirmar que teclado abre corretamente;
- testar rolagem no iPhone.

### BLOCO 5 — Sincronização com Catálogo

Garantir que produto criado/editado no Gestão continue aparecendo corretamente no Catálogo.

Teste esperado:
- criar produto no Gestão;
- confirmar aparição no Catálogo;
- mudar categoria;
- confirmar aba correta no Catálogo;
- ocultar produto;
- confirmar remoção visual no Catálogo.

### BLOCO 6 — Vendas

Recriar fluxo de compradores, vendas, valores e lucro.

Teste esperado:
- registrar venda;
- adicionar comprador;
- confirmar cálculo de lucro;
- editar/remover venda de teste.

### BLOCO 7 — Pagamentos

Recriar parcelas, status de pagamento, atrasos, observações e WhatsApp.

Teste esperado:
- marcar parcela paga;
- marcar pendente;
- adicionar observação;
- gerar mensagem WhatsApp;
- testar filtros de pagamento.

### BLOCO 8 — Dashboard

Resumo de vendas, lucro, produtos, pendências e indicadores.

Teste esperado:
- conferir se números batem com vendas/produtos cadastrados;
- confirmar que não há números falsos;
- confirmar atualização após venda/pagamento.

### BLOCO 9 — Configurações, backup e IA

Exportar/importar backup, limpar cache, validar dados, status do sistema e configurações de IA.

Teste esperado:
- exportar backup;
- validar dados;
- confirmar avisos antes de ações perigosas;
- testar configuração/erro de IA, se existir.

### BLOCO 10 — PWA/iPhone

Manifest, service worker, cache seguro, versão visível e comportamento instalável.

Teste esperado:
- instalar no iPhone;
- abrir como PWA;
- recarregar;
- confirmar versão correta;
- confirmar que cache antigo não prende versão anterior.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`. O BLOCO 1B criou modo visitante com dados fictícios e catálogo fictício em `/lab/catalogo-preview/`, sem Firebase, sem login Google e sem alterar catálogo real. O usuário quer testar cada bloco testável no iPhone usando Cloudflare Pages ou outra alternativa que não mexa no Vercel nem use GitHub Pages. O usuário informou que o sistema usa funções de IA; IA é função crítica e não pode ser removida. O objetivo é reconstruir o Bela Gestão modularmente, preservando a ligação com o Bela Catálogo, Firebase, localStorage, vendas, pagamentos, WhatsApp, PWA e IA. Siga por blocos pequenos, sem DOM injection, sem remendos sobrepostos e sem transformar o sistema em outro arquivo gigante."
