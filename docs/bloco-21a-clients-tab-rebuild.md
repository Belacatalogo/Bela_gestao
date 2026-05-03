# BLOCO 21A — Reconstrução fiel da aba Clientes

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.21.0-lab-clients-tab-rebuild`

## Objetivo

Reconstruir a aba Clientes no estilo do sistema antigo, usando dados LAB de vendas/pagamentos e preservando o histórico seguro.

Este bloco não conecta Firebase real, não altera login Google, não altera catálogo real e não mexe no sistema ativo da esposa.

## Arquivos criados/alterados

### Serviço de insights de clientes

Criado:

```txt
lab/src/services/clientInsightsService.js
```

Ele gera clientes a partir das vendas e pagamentos LAB:

- total gasto;
- total pendente;
- total recebido;
- quantidade de compras;
- produto favorito;
- VIP;
- fiel;
- sumida;
- ranking Top 5.

### Entrada visual com aba Clientes

Criado:

```txt
lab/src/cleanAppClients.js
```

Ela reaproveita os blocos anteriores e adiciona a aba:

```txt
Clientes
```

### Estilo da aba Clientes

Criado:

```txt
lab/src/styles/clients-tab.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/clients-tab.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppClients.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.21.0-lab-clients-tab-rebuild
```

## Funções implementadas na aba Clientes

- métricas: clientes, pendentes, VIP, sumidas e aniversariantes;
- Top 5 compradoras;
- filtros: Todas, Pendente, Quitadas, VIP e Fiel;
- ordenação: A-Z, Mais gasto, Mais compras, Recentes e Avaliação;
- busca por compradora;
- cards com avatar/iniciais;
- total gasto;
- quantidade de compras;
- badges pendente/quitado/VIP/Fiel;
- modal/perfil da cliente;
- métricas do perfil: compras, total gasto, ticket médio e pendente;
- produto mais comprado;
- histórico de compras.

## Limites conscientes

Ainda pendente para blocos futuros:

- edição real de perfil da cliente;
- aniversário real;
- avaliação real persistente;
- tags VIP/fiel manuais;
- dados reais via Firebase.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar versão `0.21.0-lab-clients-tab-rebuild`.
3. Ver se a aba `Clientes` aparece na navegação.
4. Registrar uma venda em Vendas, caso ainda não tenha cliente.
5. Voltar em Clientes.
6. Conferir métricas de clientes.
7. Conferir Top 5 compradoras.
8. Testar filtros.
9. Testar ordenação.
10. Buscar uma cliente.
11. Tocar em uma cliente.
12. Confirmar se abre o perfil/modal com total gasto, ticket médio e histórico.
13. Confirmar que nada pediu login Google.
14. Confirmar que nada real foi alterado.

## Critério de aprovação

Aprovado se a aba Clientes estiver parecida com o sistema antigo e funcional usando os dados LAB.

## Próximo bloco sugerido

`BLOCO 21B — Reconstrução fiel da aba Pagamentos`

Objetivo:

- reconstruir indicadores, filtros, busca e cards completos;
- mostrar vencimento, parcelas, recebido/falta receber;
- preparar botão Cobrar/WhatsApp em LAB;
- manter histórico seguro e ainda sem Firebase real.
