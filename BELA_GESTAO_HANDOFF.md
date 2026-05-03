# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.21.4-lab-settings-tab-rebuild
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

O BLOCO 21D reconstruiu o modal de Novo Produto com área de IA em modo LAB e corrigiu o fluxo Cloudinary automático.

O BLOCO 21E reconstruiu a aba Backup/Configurações no estilo do sistema antigo.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppSettings.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
lab/src/styles/products-tab.css
lab/src/styles/settings-tab.css
```

## BLOCO 21E — Reconstrução fiel da aba Backup/Configurações

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.21.4-lab-settings-tab-rebuild
```

Arquivos principais:

```txt
lab/src/services/settingsLabService.js
lab/src/cleanAppSettings.js
lab/src/styles/settings-tab.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-21e-settings-tab-rebuild.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- reconstrói Backup/Configurações no estilo do sistema antigo;
- mostra Cloudinary/upload automático;
- permite salvar/testar/limpar Cloudinary em LAB/localStorage;
- mostra chave Gemini em modo seguro LAB;
- permite salvar/testar/limpar chave Gemini local;
- mostra/oculta preços em modo LAB;
- simula sincronização de preços com catálogo;
- permite selecionar produtos para carrossel da coleção;
- permite limpar seleção do carrossel;
- permite salvar carrossel em modo LAB.

Regras mantidas:

- não escreve no Firebase real;
- não altera login Google real;
- não altera catálogo público real;
- não ativa Gemini real ainda;
- não mexe no sistema ativo da esposa;
- configurações ficam no localStorage da LAB.

## Checklist de teste do BLOCO 21E

1. Abrir preview Netlify.
2. Confirmar versão `0.21.4-lab-settings-tab-rebuild`.
3. Ir em Ajustes/Backup.
4. Conferir card Cloudinary.
5. Salvar Cloud name e Upload preset unsigned.
6. Testar botão Testar.
7. Conferir card Gemini.
8. Salvar chave fake ou real só em LAB.
9. Testar botão Testar.
10. Alternar mostrar/ocultar preços.
11. Simular sincronização de preços.
12. Conferir carrossel da coleção.
13. Selecionar produtos com foto.
14. Salvar carrossel no catálogo LAB.
15. Confirmar que nada pediu login Google e nada real foi alterado.

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
BLOCO 22 — Auditoria visual/funções pós-reconstrução 21A–21E
```

Objetivo:

- revisar Clientes, Pagamentos, Relatório, Produtos e Backup;
- corrigir bugs visuais/mobile;
- garantir que funções principais estão navegáveis;
- só depois preparar Firebase em modo leitura.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.21.4-lab-settings-tab-rebuild`. O BLOCO 21E criou `lab/src/services/settingsLabService.js`, `lab/src/cleanAppSettings.js` e `lab/src/styles/settings-tab.css`, reconstruindo Backup/Configurações no estilo antigo. Próximo bloco sugerido: `BLOCO 22 — Auditoria visual/funções pós-reconstrução 21A–21E`."
