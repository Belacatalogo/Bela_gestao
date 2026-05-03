# BLOCO 20 — Conferência das funções nos lugares corretos

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.20.0-lab-function-placement-review`

## Objetivo

Organizar e conferir onde cada função deve aparecer antes de conectar Firebase/login real.

Este bloco separa:

- funções de uso diário;
- ferramentas LAB/admin/migração;
- funções já no lugar;
- funções parciais;
- funções pendentes;
- funções bloqueadas até etapa real controlada.

## Regras mantidas

- Não mexe na `main`.
- Não mexe no sistema ativo da esposa.
- Não escreve no Firebase real.
- Não altera login Google real.
- Não altera catálogo real.
- Não remove histórico seguro do BLOCO 18.
- Não usa DOM injection.
- Não faz bundle patch.

## Arquivos criados/alterados

### Mapa de lugares das funções

Criado:

```txt
lab/src/services/functionPlacementService.js
```

Mapeia onde cada função deve ficar:

- Produtos;
- Vendas;
- Pagamentos;
- Catálogo;
- Ajustes.

### Entrada visual do bloco

Criado:

```txt
lab/src/cleanAppPlacement.js
```

Ela reaproveita a tela do BLOCO 18 e adiciona:

- card `Conferência das funções nos lugares corretos`;
- agrupamento por aba;
- status de cada função;
- ferramentas LAB recolhidas em `Ferramentas LAB / Migração`.

### Estilo

Criado:

```txt
lab/src/styles/function-placement.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/function-placement.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppPlacement.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.20.0-lab-function-placement-review
```

## Organização definida

### Produtos

Uso diário:

- adicionar produto;
- editar produto;
- enviar foto;
- publicar/ocultar no catálogo;
- IA de descrição, ainda pendente.

### Vendas

Uso diário:

- registrar cliente/compradora;
- produto vendido;
- valor final;
- histórico preservado;
- lucro parcial.

### Pagamentos

Uso diário:

- recebido/pendente;
- valor da parcela;
- parcelas múltiplas, pendente;
- WhatsApp, pendente;
- observações/vencimento, pendente.

### Catálogo

Uso diário:

- prévia fictícia;
- produtos que iriam ao catálogo;
- categorias/abas parcial;
- escrita real bloqueada.

### Ajustes

Admin/LAB:

- backup LAB;
- migração offline;
- auditoria de histórico;
- mapa de funções antigas;
- login Google/Firebase real bloqueado.

## Checklist de teste no iPhone

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

## Critério de aprovação

Aprovado se a interface deixar claro onde cada função fica e se as ferramentas técnicas não atrapalharem mais o uso diário.

## Próximo bloco sugerido

`BLOCO 21 — Preparação Firebase/Login/Backup em modo leitura`

Objetivo:

- preparar camada de Firebase e Google em modo leitura somente;
- ainda sem escrita real;
- validar como os dados reais serão lidos;
- manter backup antigo intacto;
- só avançar para escrita depois de backup completo e aprovação.
