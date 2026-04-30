# Contrato Gestão ↔ Catálogo — Bela

Branch: `rewrite-bela-gestao-lab`

Status: rascunho inicial do BLOCO 0.

## Objetivo

Definir e proteger a ligação entre o Bela Gestão e o Bela Catálogo.

O Gestão não é apenas um painel isolado. Ele controla informações que precisam aparecer corretamente no catálogo público enviado às clientes.

## Fluxo esperado

```txt
Bela Gestão
  ↓ cadastra/edita/publica produto
Fonte compartilhada / Firebase / armazenamento atual
  ↓ catálogo lê produtos publicados
Bela Catálogo
  ↓ cliente visualiza e chama no WhatsApp
Cliente
```

## Regra crítica

Nenhuma reconstrução pode alterar o formato dos produtos publicados sem antes garantir compatibilidade com o catálogo.

Se o modelo de dados for melhorado, deve existir uma camada de adaptação:

```txt
modelo novo interno
  ↓ adaptador
modelo compatível com catálogo atual
```

## Campos mínimos que o catálogo provavelmente precisa

A confirmar na auditoria técnica do `index.html` do Catálogo e do Gestão:

```js
{
  id: "",
  name: "",
  brand: "",
  description: "",
  price: 0,
  imageUrl: "",
  category: "",
  tabs: [],
  visibleInCatalog: true,
  badge: "",
  order: 0
}
```

## Campos internos recomendados para o Gestão

```js
{
  id: "",
  name: "",
  brand: "",
  description: "",
  price: 0,
  cost: 0,
  profit: 0,
  imageUrl: "",
  category: "",
  catalogTabs: [],
  visibleInCatalog: true,
  badge: "",
  stock: 0,
  order: 0,
  createdAt: "",
  updatedAt: ""
}
```

## Regras de publicação

- Produto publicado deve aparecer no Catálogo.
- Produto oculto não deve aparecer no Catálogo.
- Produto sem imagem deve ser sinalizado no Gestão antes de publicar.
- Produto sem preço deve ser sinalizado no Gestão antes de publicar.
- Categoria/aba deve ser escolhida de forma clara.
- O Gestão deve evitar salvar produto quebrado.

## Regras de compatibilidade

Durante a reconstrução:

1. manter leitura dos dados antigos;
2. normalizar dados antigos para o modelo novo;
3. salvar no formato compatível com o catálogo;
4. nunca apagar dados antigos automaticamente;
5. criar backup antes de migração real;
6. testar no catálogo antes de promover.

## Testes obrigatórios antes de considerar a integração aprovada

- criar produto novo no Gestão;
- confirmar que aparece no Catálogo;
- editar nome/preço/imagem no Gestão;
- confirmar atualização no Catálogo;
- ocultar produto no Gestão;
- confirmar que some do Catálogo;
- mudar categoria/aba no Gestão;
- confirmar mudança no Catálogo;
- testar no iPhone;
- testar recarregamento/cache.

## Pendências de auditoria

Ainda falta confirmar no código atual:

- onde os produtos são salvos;
- se existe Firebase real neste repositório;
- quais chaves de localStorage são usadas;
- quais campos o Catálogo usa para montar abas;
- como imagens são armazenadas;
- se existe função de exportação/importação;
- se Gestão e Catálogo compartilham o mesmo banco ou se a atualização é manual.
