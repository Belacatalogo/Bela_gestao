# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.4-lab-catalog-gestao-compare
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

O BLOCO 22E-B criou uma página de exportação segura no repositório `Belacatalogo/Bela-catalogo`, branch `backup-export-lab`, arquivo `backup-export.html`.

O BLOCO 22E-C adicionou comparação segura entre backup do catálogo e backup real do Gestão.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppBackupCompare.js
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
lab/src/styles/backup-compare.css
```

## BLOCO 22E-C — Comparar backup do catálogo + backup real do Gestão

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.4-lab-catalog-gestao-compare
```

Arquivos principais:

```txt
lab/src/services/gestaoBackupCompareService.js
lab/src/cleanAppBackupCompare.js
lab/src/styles/backup-compare.css
lab/src/main.js
lab/index.html
lab/src/config/appConfig.js
docs/bloco-22e-c-catalog-gestao-compare.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona em Ajustes/Backup a seção `Comparação segura`;
- permite anexar JSON real do Gestão;
- analisa produtos, preços, vendas, clientes e pagamentos do backup Gestão;
- compara com o backup do catálogo;
- mostra produtos iguais nos dois;
- mostra produtos prontos para unir;
- mostra possíveis duplicados;
- mostra produtos só no catálogo;
- mostra produtos só no Gestão;
- mostra diferenças de preço;
- não importa automaticamente;
- não escreve no Firebase real;
- não altera catálogo real.

Regra de fonte dos dados:

```txt
Catálogo = fotos, visual e categorias/abas
Gestão = preços, vendas, clientes, pagamentos e histórico
```

## Checklist de teste do BLOCO 22E-C

1. Abrir preview Netlify da branch LAB.
2. Confirmar versão `0.22.4-lab-catalog-gestao-compare`.
3. Ir em Ajustes/Backup.
4. Confirmar que o backup do catálogo real já está anexado.
5. Na seção `Comparação segura`, anexar JSON real do Gestão.
6. Ver resumo do backup Gestão.
7. Tocar em `Comparar backups agora`.
8. Conferir: iguais, prontos, possíveis, só catálogo, só gestão e preço diferente.
9. Abrir os detalhes de prontos para unir.
10. Confirmar que nada foi importado automaticamente.
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
BLOCO 22E-D — Montar prévia unificada sem importar
```

Objetivo:

- montar uma lista final sugerida combinando foto do catálogo com preço/dados do Gestão;
- permitir revisão manual;
- ainda sem gravar nada real.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho do Gestão é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.4-lab-catalog-gestao-compare`. O BLOCO 22E-C criou `lab/src/services/gestaoBackupCompareService.js`, `lab/src/cleanAppBackupCompare.js` e `lab/src/styles/backup-compare.css`, adicionando comparação segura entre backup do catálogo e backup real do Gestão. Próximo bloco sugerido: `BLOCO 22E-D — Montar prévia unificada sem importar`."
