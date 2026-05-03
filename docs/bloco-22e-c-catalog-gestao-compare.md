# BLOCO 22E-C — Comparar backup do catálogo + backup real do Gestão

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada:

```txt
0.22.4-lab-catalog-gestao-compare
```

## Objetivo

Comparar de forma segura o backup JSON do catálogo real com o backup JSON real do Gestão da esposa.

## Regras mantidas

- Nada é importado automaticamente.
- Nada é escrito no Firebase real.
- Nada é alterado no catálogo real.
- Nada substitui os dados LAB.
- Tudo fica salvo apenas em LAB/localStorage.

## Arquivos criados/alterados

Criado:

```txt
lab/src/services/gestaoBackupCompareService.js
lab/src/cleanAppBackupCompare.js
lab/src/styles/backup-compare.css
```

Alterado:

```txt
lab/src/main.js
lab/index.html
lab/src/config/appConfig.js
BELA_GESTAO_HANDOFF.md
```

## Funções implementadas

Em Ajustes/Backup, abaixo do backup do catálogo real, aparece:

```txt
Comparação segura
```

Ela permite:

- anexar JSON real do Gestão;
- analisar produtos, preços, vendas, clientes e pagamentos do backup Gestão;
- comparar com o backup do catálogo;
- mostrar produtos iguais nos dois;
- mostrar produtos prontos para unir;
- mostrar possíveis duplicados;
- mostrar produtos só no catálogo;
- mostrar produtos só no Gestão;
- mostrar diferenças de preço.

## Fontes usadas na comparação

- Catálogo: fotos, visual e categorias/abas.
- Gestão: preços, vendas, clientes, pagamentos e histórico.

## Critério de aprovação

Aprovado se:

1. Backup do catálogo fica anexado.
2. Backup do Gestão fica anexado.
3. Botão `Comparar backups agora` mostra resumo.
4. Produtos prontos para unir aparecem separados.
5. Possíveis duplicados aparecem separados.
6. Nada é importado automaticamente.

## Próximo bloco sugerido

```txt
BLOCO 22E-D — Montar prévia unificada sem importar
```

Objetivo:

- montar uma lista final sugerida combinando foto do catálogo com preço/dados do Gestão;
- permitir revisão manual;
- ainda sem gravar nada real.
