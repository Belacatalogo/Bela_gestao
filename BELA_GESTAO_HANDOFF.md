# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

## REGRA MÁXIMA

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

`rewrite-bela-gestao-lab`

Não mexer diretamente na `main`.
Não quebrar a ligação com o catálogo público.
Não remover funções existentes sem mapear antes.
Não remover funções de IA.
Não transformar o novo sistema em outro `index.html` gigante.
Não usar DOM injection.
Não fazer remendos sobrepostos.
Não misturar HTML, CSS, dados, Firebase, IA e regras de negócio no mesmo arquivo.

## Funções críticas que devem ser preservadas

- produtos;
- categorias/abas do catálogo;
- ligação Gestão ↔ Catálogo;
- upload de foto/geração automática de URL de imagem;
- Firebase/fonte compartilhada;
- localStorage/dados antigos;
- vendas;
- compradores;
- pagamentos/parcelas;
- WhatsApp;
- PWA/iPhone;
- backup/configurações;
- funções de IA.

## Regra específica para IA

O usuário informou que o Bela Gestão usa funções de IA.

Portanto:

- IA é função crítica;
- não remover IA;
- não simplificar IA sem autorização;
- não expor chaves sensíveis;
- não enviar mensagem automaticamente sem ação do usuário;
- manter fallback manual se IA falhar;
- mapear todas as funções de IA antes de reescrever telas que dependem delas.

Auditoria específica criada em:

```txt
docs/auditoria-ia.md
```

## Regra de validação do usuário

A partir do primeiro bloco que gerar algo testável, cada bloco deve terminar com:

1. resumo claro do que mudou;
2. link ou forma de preview disponível;
3. checklist exato do que o usuário deve testar no iPhone;
4. critério objetivo de aprovação;
5. aviso do que NÃO foi alterado.

Não avançar para blocos maiores sem orientar o teste do bloco anterior.

O usuário não quer testar pelo GitHub Pages e não quer mexer no Vercel atual, porque o Vercel está fixo no sistema de inglês. Portanto, a reconstrução deve considerar uma alternativa de preview separada, preferencialmente sem afetar Vercel nem produção.

## Estratégia de preview

Opções consideradas:

1. Cloudflare Pages separado para `Bela_gestao`:
   - não interfere no Vercel;
   - pode conectar ao GitHub;
   - gera previews por branch/PR;
   - bom para testar no iPhone.

2. Netlify separado para `Bela_gestao`:
   - não interfere no Vercel;
   - pode conectar ao GitHub;
   - gera deploy previews/branch deploys;
   - bom para app estático.

3. Preview temporário via RawGitHack:
   - útil para validar blocos iniciais;
   - atualmente funcional para `/lab/` e `/lab/catalogo-preview/`;
   - não deve ser considerado validação final de PWA/cache/Firebase.

Decisão recomendada:
- continuar usando RawGitHack nos blocos iniciais enquanto Cloudflare está em loop no iPhone;
- resolver Cloudflare/Netlify antes de PWA, Firebase real ou validação final.

## Objetivo da reconstrução

Reconstruir o Bela Gestão de forma modular, segura e limpa, preservando as funções importantes atuais e melhorando a manutenção futura.

O Bela Gestão é o painel interno usado para controlar produtos, vendas, pagamentos, IA e dados que alimentam o catálogo público enviado às clientes.

Fluxo esperado:

```txt
Bela Gestão
  ↓ cria/edita/publica produtos
Firebase / fonte compartilhada
  ↓ catálogo lê os produtos publicados
Bela Catálogo
```

## Estado inicial

Estado no início da reconstrução:

- repositório: `Belacatalogo/Bela_gestao`;
- branch base: `main`;
- commit base: `cd92d1e9595bd870641fe49639fccaddf0a3fa1e`;
- arquivo principal atual: `index.html`;
- arquitetura atual: arquivo único grande com HTML, CSS, JavaScript, PWA, lógica de produtos, vendas, pagamentos e configurações misturados.

## Branches

- `main`: produção atual, não mexer diretamente.
- `rewrite-bela-gestao-lab`: laboratório da reconstrução.

## Regras de trabalho por bloco

Cada bloco deve:

1. ter objetivo claro;
2. alterar poucos arquivos;
3. preservar funções existentes;
4. registrar o que mudou neste handoff;
5. permitir teste no iPhone;
6. não depender de gambiarra visual ou DOM injection;
7. manter compatibilidade com o catálogo;
8. entregar checklist de teste quando houver algo testável.

## Bloco atual

### BLOCO 4 FIX — Busca sem derrubar teclado no iPhone

Status: implementado, aguardando reteste rápido.

Objetivo:
- corrigir bug do Safari/iPhone em que o teclado fechava ao digitar no campo de busca;
- evitar renderização completa a cada letra digitada;
- manter busca funcional de forma segura.

Arquivos alterados:
- `lab/src/app.js`;
- `BELA_GESTAO_HANDOFF.md`.

Comportamento corrigido:
- digitar no campo `Buscar` não renderiza mais a tela a cada letra;
- o teclado deve permanecer aberto enquanto digita;
- a busca é aplicada ao tocar em `Aplicar busca` ou apertar `Enter`;
- filtros de categoria/status continuam aplicando ao mudar seleção.

Checklist de teste do BLOCO 4 FIX:
1. abrir `https://raw.githack.com/Belacatalogo/Bela_gestao/rewrite-bela-gestao-lab/lab/index.html`;
2. tocar no campo `Buscar`;
3. digitar algumas letras;
4. confirmar que o teclado não fecha a cada letra;
5. tocar em `Aplicar busca`;
6. confirmar que a lista filtra;
7. tocar em `Limpar filtros`;
8. confirmar que a lista volta ao normal.

Critério de aprovação:
- o teclado não fecha durante digitação no campo Buscar;
- busca continua funcionando com `Aplicar busca` ou Enter;
- filtros continuam funcionando;
- nada real foi alterado.

## Histórico de blocos

### BLOCO 4 — Tela de produtos refinada

Status: implementado com correção posterior.

Objetivo:
- melhorar a tela de produtos LAB;
- adicionar busca;
- adicionar filtro por categoria;
- adicionar filtro por status;
- mostrar contadores úteis;
- sinalizar produtos sem foto real;
- manter tudo em modo LAB, sem Firebase, login Google ou catálogo real.

### BLOCO 3 — Produtos LAB: cadastro e edição fictícia

Status: aprovado pelo usuário após correção.

Observação importante:
- o usuário confirmou que, no sistema original, a imagem não é inserida por URL manual;
- a função real é envio de foto com geração automática de URL por outro site/serviço;
- isso foi registrado como função crítica;
- no LAB, imagem URL virou opcional e usa placeholder quando vazia.

### BLOCO 2 — Camada de dados segura

Status: aprovado pelo usuário.

Objetivo:
- separar a lógica de ambiente/dados da UI;
- criar modo `LAB visitante`;
- criar modo `REAL somente leitura` bloqueado para escrita;
- impedir escrita em Firebase/catálogo real neste estágio.

### BLOCO 1B — Modo visitante e catálogo fictício LAB

Status: aprovado pelo usuário.

Objetivo:
- permitir teste inicial sem login Google da esposa;
- criar dados fictícios isolados;
- criar um catálogo fictício em `/lab/catalogo-preview/`;
- permitir testar publicar/ocultar produto sem tocar Firebase nem catálogo real.

### BLOCO 1 — Base modular limpa

Status: implementado.

Objetivo:
- criar uma base modular inicial sem substituir o sistema antigo;
- manter o `index.html` da raiz intacto;
- criar a reconstrução inicial em `/lab`.

### BLOCO 0C — Auditoria de IA e funções críticas

Status: implementado.

Objetivo:
- registrar IA como função crítica;
- criar auditoria separada para IA;
- garantir que a futura arquitetura tenha `aiService`, `messageService`, `aiConfig` e prompts versionados.

## Próximos blocos previstos

### BLOCO 5 — Sincronização com Catálogo LAB/contrato real

Garantir contrato de dados antes de conectar catálogo real.

### BLOCO 6 — Upload de foto/geração automática de URL em modo LAB

Portar de forma segura o fluxo essencial do sistema original: enviar imagem e obter URL automaticamente, primeiro em modo LAB.

### BLOCO 7 — Vendas

Recriar fluxo de compradores, vendas, valores e lucro.

### BLOCO 8 — Pagamentos

Recriar parcelas, status de pagamento, atrasos, observações e WhatsApp.

### BLOCO 9 — Dashboard

Resumo de vendas, lucro, produtos, pendências e indicadores.

### BLOCO 10 — Configurações, backup e IA

Exportar/importar backup, limpar cache, validar dados, status do sistema e configurações de IA.

### BLOCO 11 — PWA/iPhone

Manifest, service worker, cache seguro, versão visível e comportamento instalável.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`. O BLOCO 4 FIX corrigiu a busca para não derrubar o teclado no iPhone: agora digita primeiro e aplica com botão `Aplicar busca` ou Enter. O usuário testa pelo RawGitHack porque Cloudflare entrou em loop no iPhone. O usuário informou que no sistema original a imagem é enviada e a URL é gerada automaticamente por outro site/serviço; isso é função crítica e não pode ser removida. O usuário informou que o sistema usa funções de IA; IA também é crítica. O objetivo é reconstruir o Bela Gestão modularmente, preservando a ligação com o Bela Catálogo, Firebase, localStorage, vendas, pagamentos, WhatsApp, PWA, upload de foto/URL automática e IA. Siga por blocos pequenos, sem DOM injection, sem remendos sobrepostos e sem transformar o sistema em outro arquivo gigante."
