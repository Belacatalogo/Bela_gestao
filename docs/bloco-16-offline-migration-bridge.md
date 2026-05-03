# BLOCO 16 — Ponte de migração offline segura

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.16.0-lab-offline-migration-bridge`

## Objetivo

Preparar a futura migração do sistema antigo da esposa para o novo Bela Gestão sem tocar no sistema ativo agora.

A regra deste bloco é clara:

- não escrever no Firebase real;
- não alterar login Google real;
- não alterar catálogo público real;
- não interromper backup automático atual;
- não substituir o sistema antigo;
- testar tudo offline/LAB primeiro.

## O que foi criado

### Serviço de migração offline

Criado:

```txt
lab/src/services/offlineMigrationService.js
```

Responsável por:

- declarar que os alvos reais estão bloqueados;
- analisar backup/export antigo;
- simular o que pode ser importado;
- importar apenas para LAB/localStorage;
- garantir que Firebase, Google Login, catálogo real e sistema ativo não sejam tocados.

### Tela limpa com área de migração

Criado:

```txt
lab/src/cleanAppMigration.js
```

Essa versão mantém a tela limpa do BLOCO 15 e adiciona, na aba Ajustes, a área:

```txt
Migração offline do sistema antigo
```

Nela é possível:

1. selecionar um backup/export antigo JSON;
2. analisar o arquivo localmente;
3. ver resumo de preços, vendas e parcelas;
4. importar para LAB/localStorage;
5. confirmar que nada real foi alterado.

### Entrada principal atualizada

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppMigration.js
```

### Versão atualizada

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.16.0-lab-offline-migration-bridge
```

## O que continua bloqueado

A própria tela informa que estão bloqueados:

- Firebase real;
- Login Google real;
- Catálogo público real;
- Backup automático ativo da esposa;
- Funções reais de IA com chave/sessão ativa.

## Funções finais que ainda precisam continuar funcionando antes da entrega

Antes de entregar para a esposa, a nova versão precisa preservar:

- login Google mantendo conta e dados dela;
- leitura dos dados atuais do Firebase antes de qualquer escrita;
- backup completo antes de migração final;
- produtos com foto e URL automática;
- publicar/ocultar produto no catálogo;
- IA na criação/descrição do produto com fallback manual;
- vendas, clientes, parcelas e histórico preservados mesmo se produto for removido.

## Checklist de teste no iPhone

1. Abrir o preview Netlify da branch LAB.
2. Confirmar a versão `0.16.0-lab-offline-migration-bridge`.
3. Entrar em Ajustes.
4. Ver o card `Migração offline do sistema antigo`.
5. Confirmar que a tela informa os alvos reais como bloqueados.
6. Selecionar um backup/export antigo `.json`, se tiver um arquivo disponível.
7. Conferir se a análise mostra preços, vendas e parcelas.
8. Tocar em `Importar para LAB` apenas se a análise estiver OK.
9. Conferir Produtos, Vendas e Pagamentos após importar.
10. Confirmar que nenhum login Google foi pedido.
11. Confirmar que nenhum Firebase real foi alterado.
12. Confirmar que o catálogo real não foi alterado.

## Critério de aprovação

Aprovado se:

- o sistema antigo ativo continuar intocado;
- a LAB conseguir analisar um backup antigo;
- a LAB conseguir importar para localStorage;
- dados importados aparecem em produtos/vendas/pagamentos;
- fica claro que a entrega final ainda depende de validar Firebase, login, IA, catálogo e backup automático.

## Próximo bloco sugerido

`BLOCO 17 — Mapa real de funções do sistema antigo`

Objetivo:

- mapear no `index.html` antigo as funções reais de produto, catálogo, IA, foto, Firebase, Google Login e backup;
- criar uma lista objetiva do que falta portar para o novo sistema;
- não mexer ainda em produção.
