# BLOCO 22E-D — Firebase Auto Backup Discovery LAB

Status: implementado na branch `rewrite-bela-gestao-lab`.

Versão esperada:

```txt
0.22.5-lab-firebase-auto-backup-discovery
```

## Objetivo

Descobrir se o backup automático do sistema atual do Gestão está salvo no Firebase/Firestore e identificar o melhor caminho de leitura sem importar, alterar ou escrever dados reais.

## Regras mantidas

- Não mexe na `main`.
- Não altera o sistema atual ativo da esposa.
- Não escreve no Firebase real.
- Não altera catálogo real.
- Não importa automaticamente para a LAB.
- Usa somente leitura após login Google.
- Usa a configuração Firebase salva no LAB/localStorage, não config hardcoded.

## Arquivos alterados

```txt
lab/src/services/firebaseAuthLabService.js
lab/src/services/realDataReadOnlyService.js
lab/src/cleanAppSettings.js
lab/src/config/appConfig.js
BELA_GESTAO_HANDOFF.md
docs/bloco-22e-d-firebase-auto-backup-discovery.md
```

## O que foi implementado

### 1. Config Firebase correta no LAB

O login Google e a leitura Firestore deixaram de depender de uma configuração fixa antiga e passaram a usar a configuração salva localmente pelo painel `Config Firebase LAB`.

### 2. Descoberta de backup automático

Foi adicionada a função:

```txt
discoverFirebaseAutoBackupsAfterLogin()
```

Ela testa caminhos prováveis em modo READ-ONLY, incluindo:

```txt
users/{uid}/backup/latest
usuarios/{uid}/backup/latest
backups/{uid}
backups/{email}
backup/ultimo
backup/latest
backup_diario
dailyBackups
users/{uid}/backups
usuarios/{uid}/backups
users/{uid}/autoBackups
usuarios/{uid}/autoBackups
belaGestao/{uid}/backups
belaGestao/{uid}/autoBackup/latest
gestao/yasmin/backup/latest
```

### 3. Diagnóstico estrutural

Para cada caminho encontrado, o sistema tenta identificar:

- produtos;
- vendas;
- clientes;
- pagamentos/parcelas;
- configurações;
- outros backups internos;
- caminhos prováveis dentro do documento.

### 4. Botão visual em Ajustes

Na seção `Login Google — dados reais`, após login, aparece:

```txt
Descobrir backup automático
```

Esse botão mostra:

- melhor caminho provável;
- projeto Firebase detectado;
- score do candidato;
- totais encontrados;
- candidatos encontrados;
- todos os caminhos testados;
- estrutura interna provável do backup.

## Checklist de teste no iPhone

1. Abrir preview da branch LAB.
2. Confirmar versão `0.22.5-lab-firebase-auto-backup-discovery`.
3. Ir na área onde aparece `Config Firebase LAB`.
4. Colar a config Firebase correta do Bela Gestão.
5. Salvar config no LAB.
6. Ir em Ajustes / Backup.
7. Fazer login Google com a conta da esposa.
8. Tocar em `Descobrir backup automático`.
9. Verificar se aparece um caminho provável com produtos, vendas, clientes ou pagamentos.
10. Confirmar que a tela informa que nenhuma importação e nenhuma escrita foram feitas.

## Próximo bloco sugerido

```txt
BLOCO 22E-E — Exportar backup automático encontrado como JSON local
```

Objetivo:

- depois de descobrir o melhor caminho, permitir baixar uma cópia local JSON do backup automático encontrado;
- continuar sem escrever no Firebase;
- usar esse JSON na comparação segura Catálogo x Gestão.
