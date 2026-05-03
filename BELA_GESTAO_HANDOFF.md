# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.20.0-lab-function-placement-review
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

O BLOCO 20 organizou a conferência das funções nos lugares corretos, separando uso diário de ferramentas LAB/admin.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppPlacement.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
```

## BLOCO 20 — Conferência das funções nos lugares corretos

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.20.0-lab-function-placement-review
```

Arquivos principais:

```txt
lab/src/services/functionPlacementService.js
lab/src/cleanAppPlacement.js
lab/src/styles/function-placement.css
lab/index.html
lab/src/main.js
lab/src/config/appConfig.js
docs/bloco-20-function-placement-review.md
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- cria um mapa de onde cada função deve ficar;
- adiciona em Ajustes o card `Conferência das funções nos lugares corretos`;
- agrupa funções por Produtos, Vendas, Pagamentos, Catálogo e Ajustes;
- marca funções como No lugar, No lugar LAB, Parcial, Pendente, Bloqueado ou Ferramenta LAB;
- recolhe Backup, Auditoria, Migração e Mapa antigo dentro de `Ferramentas LAB / Migração`;
- deixa as funções diárias mais separadas das ferramentas técnicas.

## Organização atual

### Produtos

- adicionar produto;
- editar produto;
- enviar foto;
- publicar/ocultar no catálogo;
- IA de descrição ainda pendente.

### Vendas

- registrar cliente/compradora;
- produto vendido;
- valor final;
- histórico preservado;
- lucro parcial.

### Pagamentos

- recebido/pendente;
- valor da parcela;
- parcelas múltiplas pendente;
- WhatsApp pendente;
- observações/vencimento pendente.

### Catálogo

- prévia fictícia;
- produtos que iriam ao catálogo;
- categorias/abas parcial;
- escrita real bloqueada.

### Ajustes

- backup LAB;
- migração offline;
- auditoria de histórico;
- mapa de funções antigas;
- login Google/Firebase real bloqueado.

## Checklist de teste do BLOCO 20

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.20.0-lab-function-placement-review`.
3. Entrar em Ajustes.
4. Ver o card `Conferência das funções nos lugares corretos`.
5. Conferir se Produtos, Vendas, Pagamentos, Catálogo e Ajustes aparecem no mapa.
6. Confirmar se `Ferramentas LAB / Migração` aparece recolhido.
7. Abrir `Ferramentas LAB / Migração` e confirmar que Backup, Auditoria, Migração e Mapa antigo continuam lá.
8. Conferir se Produtos/Vendas/Pagamentos continuam funcionando.
9. Confirmar que nada pediu login Google.
10. Confirmar que nada real foi alterado.

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
BLOCO 21 — Preparação Firebase/Login/Backup em modo leitura
```

Objetivo:

- preparar camada de Firebase e Google em modo leitura somente;
- ainda sem escrita real;
- validar como os dados reais serão lidos;
- manter backup antigo intacto;
- só avançar para escrita depois de backup completo e aprovação.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere login Google real e não altere catálogo real. A versão atual é `0.20.0-lab-function-placement-review`. O BLOCO 20 criou `lab/src/services/functionPlacementService.js`, `lab/src/cleanAppPlacement.js` e `lab/src/styles/function-placement.css`, mostrando em Ajustes a conferência das funções nos lugares corretos e recolhendo ferramentas LAB. Próximo bloco sugerido: `BLOCO 21 — Preparação Firebase/Login/Backup em modo leitura`."
