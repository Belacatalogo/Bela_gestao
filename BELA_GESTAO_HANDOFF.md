# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.3-lab-catalog-backup-receiver
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

O BLOCO 22C aplicou a camada visual Premium UI exata baseada no arquivo `Bela Gestão — Spec Handoff Premium UI` enviado pelo usuário.

O BLOCO 22D iniciou ajustes pixel-perfect e corrigiu overflow mobile na aba Pagamentos.

O BLOCO 22E-A adicionou recepção segura de backup JSON do catálogo real dentro do Gestão LAB.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppCatalogBackup.js
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
lab/src/styles/premium-spec-exact.css
lab/src/styles/catalog-backup.css
```

## BLOCO 22E-A — Receber backup do catálogo real no Gestão LAB

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.3-lab-catalog-backup-receiver
```

Arquivos principais:

```txt
lab/src/services/catalogBackupLabService.js
lab/src/cleanAppCatalogBackup.js
lab/src/styles/catalog-backup.css
lab/src/main.js
lab/index.html
lab/src/config/appConfig.js
docs/bloco-22e-a-catalog-backup-receiver.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona em Ajustes/Backup a seção `Backup do catálogo real`;
- permite selecionar um arquivo JSON do catálogo;
- analisa produtos, fotos, preços e categorias;
- mostra amostra dos produtos analisados;
- salva a análise apenas no LAB/localStorage;
- permite limpar o backup anexado;
- fornece um script emergencial para exportar produtos pelo navegador do catálogo;
- não importa automaticamente para os produtos LAB;
- não altera o catálogo real;
- não escreve no Firebase real.

Repositório do catálogo localizado:

```txt
Belacatalogo/Bela-catalogo
```

Observação: o catálogo atual é um `index.html` grande na `main`. Por segurança, o BLOCO 22E-A não alterou esse arquivo.

## Checklist de teste do BLOCO 22E-A

1. Abrir preview Netlify da branch LAB.
2. Confirmar versão `0.22.3-lab-catalog-backup-receiver`.
3. Ir em Ajustes/Backup.
4. Encontrar a seção `Backup do catálogo real`.
5. Anexar um JSON de backup do catálogo, se houver.
6. Conferir total de produtos, com foto, com preço e categorias.
7. Conferir amostra de produtos.
8. Testar `Limpar backup anexado`.
9. Conferir o script emergencial de exportação.
10. Confirmar que nada foi importado automaticamente para Produtos.
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
BLOCO 22E-B — Criar botão Exportar backup no catálogo em branch separada
```

Objetivo:

- criar branch de teste no `Belacatalogo/Bela-catalogo`;
- adicionar botão visual protegido para exportar JSON completo;
- não publicar na main até validação.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho do Gestão é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.3-lab-catalog-backup-receiver`. O BLOCO 22E-A criou `lab/src/services/catalogBackupLabService.js`, `lab/src/cleanAppCatalogBackup.js` e `lab/src/styles/catalog-backup.css`, adicionando recepção segura de backup JSON do catálogo real em Ajustes/Backup. Próximo bloco sugerido: `BLOCO 22E-B — Criar botão Exportar backup no catálogo em branch separada`."
