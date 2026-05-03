# BLOCO 15 — Experiência limpa baseada no sistema antigo

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.15.0-lab-clean-legacy-experience`

## Objetivo

Realinhar o Bela Gestão LAB com a intenção original da reconstrução:

- manter a arquitetura modular nova;
- manter a aparência premium/dark/gold baseada no sistema antigo e no catálogo;
- remover o excesso de ferramentas técnicas da experiência principal;
- preservar produtos, vendas, pagamentos, catálogo, backup e upload de foto;
- não tocar na `main`;
- não tocar no catálogo real;
- não escrever no Firebase real.

## O que mudou

### 1. Nova entrada limpa

Criado:

```txt
lab/src/cleanAppStable.js
```

Essa entrada renderiza uma interface principal enxuta com abas reais:

- Resumo;
- Produtos;
- Vendas;
- Pagamentos;
- Catálogo;
- Ajustes.

### 2. Entrada principal trocada

Alterado:

```txt
lab/src/main.js
```

Antes carregava `app.js`, que exibia muitos painéis técnicos.
Agora carrega `cleanAppStable.js`.

### 3. Ferramentas LAB ocultas da tela principal

Alterado:

```txt
lab/index.html
```

Foram removidos do carregamento automático os scripts técnicos de probe, importação, auditoria, consolidação e acesso.
Eles continuam nos arquivos da branch para consulta/migração, mas não fazem mais parte da experiência normal.

### 4. Estilo limpo dedicado

Criado:

```txt
lab/src/styles/clean-app.css
```

Define a camada visual da nova experiência principal: dark/gold, cards elegantes, navegação por abas, métricas, listas de produtos, vendas e pagamentos.

### 5. Versão visível atualizada

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.15.0-lab-clean-legacy-experience
```

## Garantias

- Não mexeu na `main`.
- Não mexeu no catálogo real.
- Não escreveu no Firebase real.
- Não removeu arquivos técnicos da branch; apenas deixou de carregá-los na tela principal.
- Não usou DOM injection.
- Não criou patch em bundle.
- Não transformou o sistema em outro HTML gigante.
- Busca de produtos usa botão/Enter para evitar re-render a cada letra no iPhone.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão visível: `0.15.0-lab-clean-legacy-experience`.
3. Ver se a tela inicial parece mais com sistema real, não com painel técnico.
4. Conferir se aparecem apenas as abas: Resumo, Produtos, Vendas, Pagamentos, Catálogo e Ajustes.
5. Entrar em Produtos.
6. Criar um produto com nome, marca, preço e foto.
7. Confirmar que o produto aparece na lista.
8. Testar busca digitando e usando o botão Buscar ou Enter.
9. Confirmar que o teclado não fecha a cada letra.
10. Editar o produto.
11. Publicar/ocultar o produto.
12. Abrir o catálogo fictício.
13. Registrar uma venda.
14. Ver se a venda gera pagamento.
15. Marcar pagamento como recebido/pendente.
16. Ir em Ajustes e exportar backup LAB.

## Critério de aprovação

Aprovado se:

- o visual ficou mais limpo e parecido com o Bela original;
- a tela não parece mais cheia de ferramentas inúteis;
- produtos, foto, vendas, pagamentos e backup continuam funcionando no LAB;
- nada real foi alterado.

## Próximo passo sugerido

Depois da aprovação visual/funcional deste bloco, seguir para:

`BLOCO 16 — Adaptador Firebase/Catálogo real controlado`

Objetivo do próximo bloco:

- preparar uma camada única de leitura/escrita controlada;
- mapear os campos reais do catálogo;
- conectar primeiro em leitura segura;
- só depois liberar escrita real com backup e confirmação.
