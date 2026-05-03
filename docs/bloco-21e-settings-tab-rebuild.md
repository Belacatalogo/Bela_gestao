# BLOCO 21E — Reconstrução fiel da aba Backup/Configurações

Branch: `rewrite-bela-gestao-lab`

Versão visível esperada: `0.21.4-lab-settings-tab-rebuild`

## Objetivo

Reconstruir a aba Backup/Configurações no estilo do sistema antigo, mantendo tudo em LAB/offline e sem escrita real.

## Arquivos criados/alterados

### Serviço de configurações LAB

Criado:

```txt
lab/src/services/settingsLabService.js
```

Controla:

- mostrar/ocultar preços no catálogo;
- chave Gemini salva localmente;
- seleção do carrossel;
- simulação de sincronização de preços.

### Entrada visual da aba Configurações

Criado:

```txt
lab/src/cleanAppSettings.js
```

### Estilo da aba Configurações

Criado:

```txt
lab/src/styles/settings-tab.css
```

### HTML

Alterado:

```txt
lab/index.html
```

Adicionado:

```txt
./src/styles/settings-tab.css
```

### Entrada principal

Alterado:

```txt
lab/src/main.js
```

Agora carrega:

```txt
cleanAppSettings.js
```

### Versão

Alterado:

```txt
lab/src/config/appConfig.js
```

Nova versão:

```txt
0.21.4-lab-settings-tab-rebuild
```

## Funções implementadas

- Upload automático/Cloudinary em card fiel ao sistema antigo;
- salvar/testar/limpar Cloudinary;
- chave Gemini em modo seguro LAB/localStorage;
- salvar/testar/limpar chave Gemini;
- mostrar/ocultar preços no catálogo em LAB;
- simular sincronização de preços com catálogo;
- selecionar produtos para carrossel da coleção;
- limpar seleção do carrossel;
- salvar carrossel em modo LAB.

## Regras mantidas

- Não escreve no Firebase real;
- não altera login Google real;
- não altera catálogo público real;
- não ativa Gemini real ainda;
- não mexe no sistema ativo da esposa;
- configurações ficam no localStorage da LAB.

## Checklist de teste no iPhone

1. Abrir preview Netlify.
2. Confirmar versão `0.21.4-lab-settings-tab-rebuild`.
3. Ir em Ajustes/Backup.
4. Conferir card Cloudinary.
5. Salvar Cloud name e Upload preset unsigned.
6. Testar botão Testar.
7. Conferir card Gemini.
8. Salvar chave fake ou real só em LAB.
9. Testar botão Testar.
10. Alternar mostrar/ocultar preços.
11. Simular sincronização de preços.
12. Conferir carrossel da coleção.
13. Selecionar produtos com foto.
14. Salvar carrossel no catálogo LAB.
15. Confirmar que nada pediu login Google e nada real foi alterado.

## Próximo bloco sugerido

`BLOCO 22 — Auditoria visual/funções pós-reconstrução 21A–21E`

Objetivo:

- revisar Clientes, Pagamentos, Relatório, Produtos e Backup;
- corrigir bugs visuais/mobile;
- garantir que funções principais estão navegáveis;
- só depois preparar Firebase em modo leitura.
