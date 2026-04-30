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
7. manter compatibilidade com o catálogo.

## Bloco atual

### BLOCO 0 — Auditoria e preparação

Status: iniciado.

Objetivo:
- criar branch lab;
- registrar regras do projeto;
- documentar funções atuais;
- documentar contrato inicial entre Gestão e Catálogo;
- preparar a reconstrução modular.

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

### BLOCO 2 — Camada de dados e Firebase

Separar conexão, leitura, escrita, fallback local e status de sincronização.

### BLOCO 3 — Produtos

Recriar cadastro, edição, visibilidade no catálogo e categorias.

### BLOCO 4 — Tela de produtos

Criar UI limpa, responsiva e segura para iPhone.

### BLOCO 5 — Sincronização com Catálogo

Garantir que produto criado/editado no Gestão continue aparecendo corretamente no Catálogo.

### BLOCO 6 — Vendas

Recriar fluxo de compradores, vendas, valores e lucro.

### BLOCO 7 — Pagamentos

Recriar parcelas, status de pagamento, atrasos, observações e WhatsApp.

### BLOCO 8 — Dashboard

Resumo de vendas, lucro, produtos, pendências e indicadores.

### BLOCO 9 — Configurações e backup

Exportar/importar backup, limpar cache, validar dados e status do sistema.

### BLOCO 10 — PWA/iPhone

Manifest, service worker, cache seguro, versão visível e comportamento instalável.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`. O objetivo é reconstruir o Bela Gestão modularmente, preservando a ligação com o Bela Catálogo. O Bloco 0 iniciou a auditoria e criou documentação inicial. Siga por blocos pequenos, sem DOM injection, sem remendos sobrepostos e sem transformar o sistema em outro arquivo gigante."
