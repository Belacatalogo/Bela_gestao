# BLOCO 22E-A — Receber backup do catálogo real no Gestão LAB

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada:

```txt
0.22.3-lab-catalog-backup-receiver
```

## Objetivo

Criar no Gestão LAB uma área segura para receber um backup JSON do catálogo real antes de qualquer integração direta.

## Por que este bloco existe

Antes de sincronizar Gestão ↔ Catálogo real, é mais seguro:

1. exportar um backup completo dos produtos do catálogo real;
2. anexar esse JSON no Gestão LAB;
3. analisar produtos, fotos, preços e categorias;
4. comparar com dados LAB;
5. só depois pensar em escrita/sincronização real.

## Arquivos criados/alterados

Criado:

```txt
lab/src/services/catalogBackupLabService.js
lab/src/cleanAppCatalogBackup.js
lab/src/styles/catalog-backup.css
```

Alterado:

```txt
lab/src/main.js
lab/index.html
lab/src/config/appConfig.js
```

## Funções implementadas

Na aba Ajustes/Backup aparece a área:

```txt
Backup do catálogo real
```

Ela permite:

- selecionar um arquivo JSON do catálogo;
- analisar total de produtos;
- contar produtos com foto;
- contar produtos com preço;
- identificar categorias;
- mostrar amostra de produtos;
- salvar análise somente em LAB/localStorage;
- limpar backup anexado;
- copiar script emergencial para exportar produtos pelo navegador do catálogo.

## Regras mantidas

- Não altera o catálogo real;
- não escreve no Firebase real;
- não mistura backup do catálogo com produtos LAB;
- não importa automaticamente;
- não mexe na main do Gestão;
- não mexe na main do Catálogo.

## Sobre o repositório do catálogo

Repositório localizado:

```txt
Belacatalogo/Bela-catalogo
```

O catálogo atual é um `index.html` grande na `main`. Por segurança, este bloco não alterou esse arquivo.

## Próximo bloco sugerido

```txt
BLOCO 22E-B — Criar botão Exportar backup no catálogo em branch separada
```

Objetivo:

- criar branch de teste no `Belacatalogo/Bela-catalogo`;
- adicionar botão visual protegido para exportar JSON completo;
- não publicar na main até validação.
