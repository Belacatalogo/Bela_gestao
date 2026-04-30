# Auditoria inicial de funções — Bela Gestão

Branch: `rewrite-bela-gestao-lab`

Status: rascunho inicial do BLOCO 0.

## Objetivo

Mapear as funções existentes antes de qualquer reconstrução real, para evitar perda de recursos importantes.

## Funções identificadas no sistema atual

O sistema atual está concentrado em `index.html` e contém, pelo menos, os seguintes grupos de função:

### 1. PWA / instalação no celular

- meta tags para app mobile;
- `manifest` gerado via JavaScript;
- ícone PWA inline;
- service worker inline;
- cache básico.

### 2. Interface principal

- navegação por abas;
- layout escuro com identidade visual Bela;
- filtros;
- busca;
- cards;
- modais;
- toast de feedback;
- rodapé/resumo fixo.

### 3. Produtos

- listagem de produtos;
- categorias/filtros;
- preço de venda;
- provável controle de custo/lucro;
- botões de ação por produto;
- seleção de produto em modal/carrossel.

### 4. Vendas / compradores

- adicionar comprador a produto;
- exibir chips de compradores;
- controlar dados de venda;
- calcular resumo de venda;
- abrir detalhes do comprador;
- editar/remover venda/comprador.

### 5. Pagamentos

- aba de pagamentos;
- cards de pagamento;
- parcelas;
- status pago/pendente;
- observações;
- filtros por status;
- ordenação;
- resumo no rodapé;
- botão/mensagem de WhatsApp.

### 6. Dashboard / resumo

- totalizadores;
- progresso;
- cartões de indicadores;
- valores vendidos/recebidos/pendentes.

### 7. Configurações

- área de configuração;
- instruções de PWA;
- ações administrativas;
- provável exportação/importação ou limpeza de dados.

## Riscos encontrados

### Risco 1 — Arquivo único gigante

HTML, CSS, JavaScript, regras de negócio, PWA e dados estão misturados. Isso torna qualquer alteração arriscada.

### Risco 2 — Ligação com catálogo

O Gestão aparentemente controla dados que aparecem no catálogo. Antes de alterar estrutura de dados, é obrigatório mapear quais campos o Catálogo lê.

### Risco 3 — Cache/PWA

Service worker e manifest inline podem causar cache antigo no iPhone. A reconstrução deve separar `manifest.webmanifest` e `service-worker.js`.

### Risco 4 — Dados antigos

A reconstrução deve suportar dados existentes e nunca apagar/reescrever dados sem validação.

## Funções que não podem ser removidas

- cadastro/listagem de produtos;
- vínculo de produto com catálogo;
- categorias/abas do catálogo;
- preço/custo/lucro;
- registro de vendas;
- compradores;
- parcelas/pagamentos;
- status pago/pendente;
- observações;
- WhatsApp;
- PWA/iPhone;
- backup/configurações, se existirem no fluxo atual.

## Próximo passo da auditoria

No próximo bloco de auditoria técnica, extrair do `index.html` atual:

- nomes das chaves de armazenamento;
- nomes das funções principais;
- formato real dos produtos;
- formato real das vendas;
- formato real dos pagamentos;
- qualquer referência a Firebase ou fonte compartilhada;
- campos usados pelo catálogo.
