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

## Regra de versão visível

Todo bloco, correção ou alteração testável deve atualizar a versão em:

```txt
lab/src/config/appConfig.js
```

A versão deve aparecer na tela da LAB para o usuário confirmar se o preview atualizou.

Versão atual:

```txt
0.6.0-lab-photo-upload
```

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
5. aviso do que NÃO foi alterado;
6. versão visível que deve aparecer na tela.

Não avançar para blocos maiores sem orientar o teste do bloco anterior.

O usuário não quer testar pelo GitHub Pages e não quer mexer no Vercel atual, porque o Vercel está fixo no sistema de inglês. Portanto, a reconstrução deve considerar uma alternativa de preview separada, preferencialmente sem afetar Vercel nem produção.

## Estratégia de preview

Preview principal atual:
- Netlify conectado à branch `rewrite-bela-gestao-lab`;
- publish directory: `lab`;
- Vercel do inglês continua intocado;
- GitHub Pages não será usado.

RawGitHack:
- fica apenas como fallback temporário;
- não é mais o preview principal por causa de cache/atraso.

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
8. entregar checklist de teste quando houver algo testável;
9. atualizar versão visível.

## Bloco atual

### BLOCO 6 — Upload de foto / geração automática de URL em modo LAB

Status: implementado, aguardando teste no iPhone.

Versão visível esperada:

```txt
0.6.0-lab-photo-upload
```

Objetivo:
- criar fluxo LAB para escolher foto do iPhone;
- gerar automaticamente uma URL local `data:image/...`;
- salvar essa URL no produto LAB;
- mostrar a foto no catálogo fictício;
- preservar a regra do sistema real: imagem não deve depender de URL manual;
- não enviar nada para serviço externo real neste bloco.

Arquivos adicionados/alterados:
- `lab/src/services/imageUploadLabService.js`;
- `lab/src/components/ProductFormModal.js`;
- `lab/src/app.js`;
- `lab/src/styles/layout.css`;
- `lab/src/config/appConfig.js`;
- `BELA_GESTAO_HANDOFF.md`.

Comportamento atual:
- formulário de produto tem campo `Enviar foto`;
- foto escolhida vira uma URL local automática;
- produto salvo com foto mostra selo `foto LAB`;
- catálogo fictício mostra a foto enviada;
- limite LAB: imagens até 4 MB;
- aceita JPG, PNG, WEBP e GIF;
- modo real continua bloqueado;
- Firebase real e catálogo real continuam desconectados.

Checklist de teste do BLOCO 6:
1. abrir o preview Netlify da LAB;
2. confirmar que a versão visível é `0.6.0-lab-photo-upload`;
3. tocar em `Novo produto`;
4. preencher nome, marca, preço e categoria;
5. tocar em `Enviar foto`;
6. escolher uma foto do iPhone;
7. salvar no LAB;
8. confirmar que o produto aparece na lista com selo `foto LAB`;
9. abrir o catálogo fictício;
10. confirmar que a foto aparece no produto;
11. editar esse produto;
12. confirmar que a imagem continua salva;
13. criar outro produto sem foto;
14. confirmar que ele ainda usa imagem provisória e aparece como sem foto real;
15. confirmar que nada pede login Google;
16. confirmar que modo real continua bloqueado.

Critério de aprovação:
- upload de foto abre no iPhone;
- salvar com foto funciona;
- foto aparece no catálogo fictício;
- produto sem foto continua funcionando com placeholder;
- nada real foi alterado.

## Histórico de blocos

### BLOCO 5 — Sincronização com Catálogo LAB / contrato real

Status: aprovado pelo usuário.

Objetivo:
- criar contrato de dados do catálogo;
- validar se os produtos LAB têm os campos que o catálogo precisa ler;
- mostrar categorias e abas visíveis;
- sinalizar produtos com avisos, como `sem foto real`;
- manter escrita no catálogo real bloqueada.

### BLOCO 4.2 — Preview mais leve

Status: aprovado indiretamente; Netlify passou a ser o preview principal.

Objetivo:
- remover fontes externas do preview LAB;
- reduzir dependências externas;
- melhorar carregamento.

### BLOCO 4 FIX — Busca sem derrubar teclado no iPhone

Status: aprovado pelo usuário.

Objetivo:
- corrigir bug do Safari/iPhone em que o teclado fechava ao digitar no campo de busca;
- evitar renderização completa a cada letra digitada;
- manter busca funcional de forma segura.

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

### BLOCO 6B — Adaptador real de upload externo

Mapear/configurar com segurança o serviço externo real usado para transformar foto em URL, sem expor segredo e sem quebrar fallback LAB.

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

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`. Sempre atualize a versão visível em `lab/src/config/appConfig.js` a cada bloco/fix; a versão atual é `0.6.0-lab-photo-upload`. O preview principal agora é o Netlify conectado à branch lab, com publish directory `lab`. O BLOCO 6 adicionou upload de foto LAB: o usuário escolhe foto no iPhone, o sistema gera uma URL local `data:image/...`, salva no produto e mostra no catálogo fictício. Isso ainda não envia para serviço externo real. O usuário informou que no sistema original a imagem é enviada e a URL é gerada automaticamente por outro site/serviço; isso é função crítica e não pode ser removida. O usuário informou que o sistema usa funções de IA; IA também é crítica. O objetivo é reconstruir o Bela Gestão modularmente, preservando a ligação com o Bela Catálogo, Firebase, localStorage, vendas, pagamentos, WhatsApp, PWA, upload de foto/URL automática e IA. Siga por blocos pequenos, sem DOM injection, sem remendos sobrepostos e sem transformar o sistema em outro arquivo gigante."
