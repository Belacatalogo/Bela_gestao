# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.21.3-lab-products-ai-modal-rebuild
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

O BLOCO 21A reconstruiu a aba Clientes.

O BLOCO 21B reconstruiu a aba Pagamentos.

O BLOCO 21C reconstruiu a aba Relatório.

O BLOCO 21D reconstruiu o modal de Novo Produto com área de IA em modo LAB.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppProducts.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
lab/src/styles/products-tab.css
```

## BLOCO 21D — Reconstrução fiel da aba Produtos + Novo Produto com IA

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.21.3-lab-products-ai-modal-rebuild
```

Arquivos principais:

```txt
lab/src/components/ProductFormModal.js
lab/src/cleanAppProducts.js
lab/src/styles/products-tab.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-21d-products-ai-modal-rebuild.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- reconstrói o modal de Novo Produto para ficar mais próximo do sistema antigo;
- adiciona área de fotos;
- mantém foto por URL;
- mantém foto do celular no fluxo LAB;
- adiciona seção `IA do produto`;
- adiciona botão `Preencher com IA LAB`;
- adiciona botão `Analisar foto` em modo LAB;
- adiciona chips de categoria;
- adiciona chips de abas do catálogo;
- mantém salvar/publicar em LAB/localStorage;
- mantém Firebase, login Google, catálogo real e IA real bloqueados.

Limites conscientes ainda pendentes:

- IA real Gemini na criação do produto;
- análise real da foto;
- upload real Cloudinary/serviço final;
- múltiplas fotos reais;
- carrossel real;
- sincronização real com catálogo/Firebase.

## Checklist de teste do BLOCO 21D

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
BLOCO 21E — Reconstrução fiel da aba Backup/Configurações
```

Objetivo:

- upload automático/Cloudinary em modo seguro;
- chave Gemini em modo seguro;
- mostrar/ocultar preços;
- sincronizar preços com catálogo;
- carrossel da coleção;
- ainda sem escrita real até etapa controlada.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.21.3-lab-products-ai-modal-rebuild`. O BLOCO 21D alterou `lab/src/components/ProductFormModal.js`, criou `lab/src/cleanAppProducts.js` e `lab/src/styles/products-tab.css`, reconstruindo Novo Produto com seção de IA LAB. Próximo bloco sugerido: `BLOCO 21E — Reconstrução fiel da aba Backup/Configurações`."
