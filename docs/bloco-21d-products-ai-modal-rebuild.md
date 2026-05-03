# BLOCO 21D — Reconstrução fiel da aba Produtos + Novo Produto com IA

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.21.3-lab-products-ai-modal-rebuild`

## Objetivo

Reconstruir o fluxo de Produtos no estilo do sistema antigo e garantir que o botão `Novo produto` abra uma tela/modal grande com área de IA.

Este bloco não conecta Firebase real, não altera login Google, não altera catálogo real, não ativa IA real e não mexe no sistema ativo da esposa.

## Arquivos alterados/criados

### Modal de produto reconstruído

Alterado:

```txt
lab/src/components/ProductFormModal.js
```

Agora o modal tem:

- título `Novo Produto` / `Editar Produto`;
- área de fotos;
- campo de URL da foto;
- botão `Do celular`;
- seção `IA do produto`;
- botão `Preencher com IA LAB`;
- botão `Analisar foto` em modo LAB;
- nome;
- marca;
- descrição;
- preço;
- categoria por chips;
- abas do catálogo por chips;
- salvar/publicar;
- cancelar.

### Entrada visual Produtos

Criado:

```txt
lab/src/cleanAppProducts.js
```

Responsável por:

- manter toda a app anterior;
- adicionar comportamento dos chips;
- adicionar preenchimento simulado de IA LAB;
- deixar o lugar da IA real pronto para integração futura.

### Estilo do fluxo Produtos

Criado:

```txt
lab/src/styles/products-tab.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/products-tab.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppProducts.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.21.3-lab-products-ai-modal-rebuild
```

## Funções implementadas

- Botão `Novo produto` abre tela/modal grande.
- Modal está mais próximo do sistema antigo.
- Foto por URL.
- Foto do celular preservada no fluxo LAB.
- Chips de categoria.
- Chips de abas do catálogo.
- Seção de IA visível no novo produto.
- `Preencher com IA LAB` preenche sugestão fake/local.
- `Analisar foto` mostra aviso de integração futura.
- Salvamento continua em LAB/localStorage.
- Catálogo real segue bloqueado.

## Limites conscientes

Ainda pendente para blocos futuros:

- IA real Gemini na criação do produto;
- análise real da foto;
- upload real Cloudinary/serviço final;
- múltiplas fotos reais;
- carrossel real;
- sincronização real com catálogo/Firebase.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.21.3-lab-products-ai-modal-rebuild`.
3. Entrar em Produtos.
4. Tocar em `Novo produto`.
5. Confirmar que abre tela/modal grande.
6. Ver área de fotos.
7. Ver botão `Do celular`.
8. Ver seção `IA do produto`.
9. Tocar em `Preencher com IA LAB`.
10. Confirmar que campos são preenchidos.
11. Testar chips de categoria.
12. Testar chips de abas do catálogo.
13. Salvar produto.
14. Confirmar que aparece na lista de produtos.
15. Confirmar que nada pediu login Google.
16. Confirmar que nada real foi alterado.

## Critério de aprovação

Aprovado se o botão Novo Produto abrir uma tela semelhante ao sistema antigo e se a área de IA estiver claramente posicionada dentro do fluxo de produto.

## Próximo bloco sugerido

`BLOCO 21E — Reconstrução fiel da aba Backup/Configurações`

Objetivo:

- upload automático/Cloudinary em modo seguro;
- chave Gemini em modo seguro;
- mostrar/ocultar preços;
- sincronizar preços com catálogo;
- carrossel da coleção;
- ainda sem escrita real até etapa controlada.
