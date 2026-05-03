# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.1-lab-real-readonly-preview
```

## REGRA MÁXIMA ATUAL

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

```txt
rewrite-bela-gestao-lab
```

Não mexer diretamente na `main`.
Não mexer no sistema antigo ativo da esposa.
Não escrever no Firebase real neste estágio.
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

O BLOCO 22A adicionou o portão de login Google protegido.

O BLOCO 22B adicionou leitura controlada de dados reais em modo somente leitura após login.

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

## BLOCO 22B — Leitura controlada dos dados reais após login

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.1-lab-real-readonly-preview
```

Arquivos principais:

```txt
lab/src/services/realDataReadOnlyService.js
lab/src/cleanAppSettings.js
lab/src/styles/settings-tab.css
lab/src/config/appConfig.js
docs/bloco-22b-real-readonly-preview.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- mantém dados reais bloqueados antes do login Google;
- depois do login, permite tocar em `Ler dados reais agora`;
- tenta ler caminhos candidatos do Firestore em modo leitura;
- mostra totais encontrados de produtos, vendas, clientes e pagamentos;
- mostra caminhos encontrados;
- mostra diagnóstico de caminhos vazios/bloqueados;
- não importa nada para LAB;
- não altera nada no Firebase real;
- não altera catálogo real.

Regras mantidas:

- dados reais só aparecem depois do login Google;
- dados reais não substituem dados LAB;
- dados reais não são misturados automaticamente;
- escrita real continua bloqueada;
- sistema ativo da esposa não foi alterado.

## Checklist de teste do BLOCO 22B

1. Abrir preview Netlify.
2. Confirmar versão `0.22.1-lab-real-readonly-preview`.
3. Ir em Ajustes/Backup.
4. Fazer login Google com a conta da esposa.
5. Tocar em `Ler dados reais agora`.
6. Conferir se aparece `Prévia dos dados reais — somente leitura`.
7. Conferir produtos/vendas/clientes/pagamentos encontrados.
8. Abrir `Caminhos encontrados`.
9. Abrir `Diagnóstico de caminhos verificados`.
10. Confirmar que Produtos/Vendas/Pagamentos da LAB não foram substituídos.
11. Confirmar que nada real foi alterado.

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
BLOCO 22C — Identificar caminho real correto e mapear dados reais
```

Objetivo:

- usar o diagnóstico do 22B para descobrir onde estão os dados reais;
- mapear estrutura real;
- preparar importação controlada somente depois de backup completo.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.1-lab-real-readonly-preview`. O BLOCO 22B criou `lab/src/services/realDataReadOnlyService.js` e conectou em Ajustes o botão `Ler dados reais agora`, mostrando prévia separada e diagnóstico. Próximo bloco sugerido: `BLOCO 22C — Identificar caminho real correto e mapear dados reais`."
