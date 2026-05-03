# BLOCO 17 — Mapa real de funções do sistema antigo

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.17.0-lab-legacy-function-map`

## Objetivo

Mapear, antes de qualquer conexão real, as funções do sistema antigo que precisam continuar funcionando na versão nova.

Este bloco não conecta Firebase real, não pede login Google, não altera catálogo real e não mexe no sistema ativo da esposa.

## O que foi criado

### Serviço de mapa funcional

Criado:

```txt
lab/src/services/legacyFunctionMapService.js
```

Ele registra as funções críticas do sistema antigo com status:

- `confirmed` — confirmado por backup/código/teste;
- `partial` — parcialmente portado ou parcialmente mapeado;
- `needs-validation` — confirmado pelo usuário, mas ainda precisa validação técnica antes da entrega;
- `blocked-in-lab` — não deve ser ativado em LAB.

### Entrada visual com mapa na aba Ajustes

Criado:

```txt
lab/src/cleanAppFunctionMap.js
```

Alterado:

```txt
lab/src/main.js
```

Agora a LAB carrega `cleanAppFunctionMap.js`, que mostra em Ajustes o card:

```txt
Mapa real de funções antigas
```

### Estilo do mapa

Alterado:

```txt
lab/src/styles/clean-app.css
```

Foram adicionados cards expansíveis para cada função mapeada.

### Versão atualizada

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.17.0-lab-legacy-function-map
```

## Funções mapeadas

- Produtos;
- Ligação Gestão ↔ Catálogo;
- Upload de foto / URL automática;
- Vendas e compradores;
- Pagamentos e parcelas;
- Firebase, login Google e backup automático;
- IA na criação de produto;
- WhatsApp;
- PWA/iPhone.

## Resultado importante

Confirmado com mais segurança:

- vendas existem no backup antigo;
- parcelas existem no backup antigo;
- preços existem no backup antigo;
- o sistema precisa separar histórico financeiro de produto para evitar que dados de cliente sumam quando produto for apagado.

Ainda precisa validação técnica antes da entrega:

- Firebase real;
- login Google real;
- backup automático ativo;
- IA real de produto;
- serviço real de upload/URL de foto;
- campos exatos consumidos pelo catálogo real.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar a versão `0.17.0-lab-legacy-function-map`.
3. Entrar em Ajustes.
4. Ver o card `Mapa real de funções antigas`.
5. Abrir alguns itens do mapa.
6. Confirmar que há status como Confirmado, Parcial e Validar.
7. Confirmar que a tela não tenta login Google.
8. Confirmar que nada real foi alterado.
9. Confirmar se o mapa está legível no iPhone.

## Critério de aprovação

Aprovado se o usuário conseguir visualizar claramente o que já está confirmado e o que ainda falta validar antes da entrega final.

## Próximo bloco sugerido

`BLOCO 18 — Modelo final de dados preservando histórico`

Objetivo:

- separar definitivamente Product, Sale, Customer e Payment;
- garantir que venda/parcela/cliente não dependam da existência do produto;
- impedir novamente o erro onde apagar produto remove valor/histórico da ficha da cliente;
- manter tudo offline/LAB ainda.
