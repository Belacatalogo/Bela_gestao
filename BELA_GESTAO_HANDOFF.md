# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

## REGRA MÁXIMA

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

`rewrite-bela-gestao-lab`

Não mexer diretamente na `main`.
Não quebrar a ligação com o catálogo público.
Não remover funções existentes sem mapear antes.
Não transformar o novo sistema em outro `index.html` gigante.
Não usar DOM injection.
Não fazer remendos sobrepostos.
Não misturar HTML, CSS, dados, Firebase e regras de negócio no mesmo arquivo.

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

O Bela Gestão é o painel interno usado para controlar produtos, vendas, pagamentos e dados que alimentam o catálogo público enviado às clientes.

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

### BLOCO 0 — Auditoria e preparação

Status: iniciado.

Objetivo:
- criar branch lab;
- registrar regras do projeto;
- documentar funções atuais;
- documentar contrato inicial entre Gestão e Catálogo;
- preparar a reconstrução modular;
- registrar regra de teste por bloco;
- definir alternativa de preview sem GitHub Pages e sem mexer no Vercel atual.

Arquivos adicionados neste bloco:
- `BELA_GESTAO_HANDOFF.md`;
- `docs/auditoria-funcoes.md`;
- `docs/contrato-gestao-catalogo.md`.

Nenhuma função do sistema antigo deve ser removida neste bloco.

## Próximos blocos previstos

### BLOCO 1 — Base modular limpa

Criar estrutura inicial sem substituir a aplicação antiga de forma destrutiva:

```txt
src/
  main.js
  app.js
  config/
  services/
  data/
  state/
  components/
  screens/
  styles/
  utils/
```

Teste esperado quando houver preview:
- abrir o preview no iPhone;
- confirmar que a tela inicial da lab carrega;
- confirmar que aparece a versão/branch lab;
- confirmar que a `main` antiga continua intacta.

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

### BLOCO 9 — Configurações e backup

Exportar/importar backup, limpar cache, validar dados e status do sistema.

Teste esperado:
- exportar backup;
- validar dados;
- confirmar avisos antes de ações perigosas.

### BLOCO 10 — PWA/iPhone

Manifest, service worker, cache seguro, versão visível e comportamento instalável.

Teste esperado:
- instalar no iPhone;
- abrir como PWA;
- recarregar;
- confirmar versão correta;
- confirmar que cache antigo não prende versão anterior.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`. O usuário quer testar cada bloco testável no iPhone e não quer usar GitHub Pages nem mexer no Vercel atual, que está fixo no sistema de inglês. O objetivo é reconstruir o Bela Gestão modularmente, preservando a ligação com o Bela Catálogo. O Bloco 0 iniciou a auditoria, criou documentação inicial e registrou a regra de checklist por bloco. Siga por blocos pequenos, sem DOM injection, sem remendos sobrepostos e sem transformar o sistema em outro arquivo gigante."
