# Auditoria de funções de IA — Bela Gestão

Branch: `rewrite-bela-gestao-lab`

Status: BLOCO 0C iniciado.

## Objetivo

Mapear e proteger todas as funções de IA existentes no Bela Gestão antes da reconstrução modular.

O usuário informou explicitamente que o sistema usa funções de IA. Portanto, IA é considerada função crítica e não pode ser removida, simplificada ou substituída sem validação.

## Regra obrigatória

Nenhuma função relacionada a IA deve ser apagada, movida ou reescrita sem antes:

1. identificar onde ela está no código atual;
2. entender qual entrada ela recebe;
3. entender qual saída ela gera;
4. entender se usa Firebase, localStorage, prompt salvo ou chave de API;
5. entender se alimenta WhatsApp, produtos, vendas, pagamentos ou catálogo;
6. criar módulo equivalente na reconstrução.

## Possíveis funções de IA a preservar

A confirmar na auditoria técnica do `index.html`:

- geração de descrição de produto;
- geração de legenda/mensagem para cliente;
- geração de mensagem de cobrança;
- geração de mensagem de venda pelo WhatsApp;
- sugestão de preço, lucro ou organização;
- resumo de vendas/pagamentos;
- qualquer campo automático alimentado por IA;
- qualquer integração com chave/API externa.

## Buscas iniciais realizadas

Foram pesquisados termos relacionados a:

- Gemini;
- OpenAI;
- Google AI;
- generativelanguage;
- API key;
- prompt;
- geração de texto;
- mensagem automática;
- WhatsApp/cobrança;
- fetch/API.

Resultado inicial:
- não apareceu, pela busca indexada do GitHub, uma referência óbvia a `Gemini`, `OpenAI`, `generateContent`, `generativelanguage` ou `AIza`;
- isso não descarta a existência da função de IA, pois o sistema atual está em arquivo único grande e a função pode estar nomeada de outra forma;
- a auditoria deve continuar por leitura estrutural do `index.html` e busca por funções de mensagem, automação e configuração.

## Como a IA deve ficar na reconstrução

A reconstrução deve ter uma camada própria para IA:

```txt
src/services/aiService.js
src/services/messageService.js
src/config/aiConfig.js
src/utils/prompts.js
```

Separação recomendada:

- `aiService.js`: chamadas reais de IA;
- `messageService.js`: monta mensagens para WhatsApp/cobrança/venda;
- `aiConfig.js`: configurações e flags;
- `prompts.js`: prompts reutilizáveis e versionados.

## Regras de segurança da IA

- não expor chave sensível se existir;
- não salvar chave em lugar inseguro sem aviso;
- não remover fallback manual;
- sempre permitir editar texto gerado antes de enviar ao cliente;
- nunca enviar WhatsApp automaticamente sem ação do usuário;
- registrar erro de IA de forma clara;
- manter função manual funcionando se IA falhar.

## Checklist futuro de teste da IA

Quando a IA for reconstruída ou portada, testar:

- abrir painel de IA;
- gerar texto/mensagem;
- editar texto antes de usar;
- copiar/enviar para WhatsApp;
- testar falha de chave/API;
- confirmar que o sistema não trava;
- confirmar que produtos/vendas/pagamentos não são alterados indevidamente;
- confirmar que o catálogo não é afetado por erro de IA.

## Pendência crítica

Antes de iniciar a reescrita de telas com IA, localizar no `index.html` atual:

- nomes das funções relacionadas a IA;
- botões que chamam IA;
- campos usados pela IA;
- origem das chaves/configurações;
- se a IA depende do Firebase ou localStorage;
- se a IA é usada no Gestão, no Catálogo ou nos dois.
