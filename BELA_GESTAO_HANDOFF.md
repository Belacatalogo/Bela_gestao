# Bela Gestão — Handoff LAB

Branch atual de trabalho: `rewrite-bela-gestao-lab`

Branch protegida de produção: `main`

Versão atual visível:

```txt
0.22.0-lab-google-login-gate
```

## REGRA MÁXIMA ATUAL

Toda reconstrução do Bela Gestão deve acontecer primeiro na branch:

```txt
rewrite-bela-gestao-lab
```

Não mexer diretamente na `main`.
Não mexer no sistema antigo ativo da esposa.
Não escrever no Firebase real neste estágio.
Não alterar catálogo público real neste estágio.
Não interromper backup automático atual.
Não remover funções existentes sem mapear antes.
Não remover funções de IA.
Não usar DOM injection.
Não fazer bundle patch.
Não transformar o novo sistema em outro `index.html` gigante.

## Estado atual

O BLOCO 15 limpou a experiência principal da LAB.

O BLOCO 16 criou uma ponte de migração offline segura.

O BLOCO 17 criou o mapa real de funções antigas.

O BLOCO 18 criou o modelo de dados com histórico seguro.

O BLOCO 19 importou a identidade visual do sistema antigo por uma camada CSS modular.

O BLOCO 20 organizou a conferência das funções nos lugares corretos.

O BLOCO 21A reconstruiu a aba Clientes.

O BLOCO 21B reconstruiu a aba Pagamentos.

O BLOCO 21C reconstruiu a aba Relatório.

O BLOCO 21D reconstruiu o modal de Novo Produto com área de IA em modo LAB e corrigiu o fluxo Cloudinary automático.

O BLOCO 21E reconstruiu a aba Backup/Configurações no estilo do sistema antigo.

O BLOCO 22A adicionou o portão de login Google protegido para que dados reais só apareçam após login na conta da esposa.

Entrada atual da LAB:

```txt
lab/src/main.js
  -> lab/src/cleanAppSettings.js
```

Camadas visuais atuais:

```txt
lab/src/styles/legacy-visual-import.css
lab/src/styles/function-placement.css
lab/src/styles/clients-tab.css
lab/src/styles/payments-tab.css
lab/src/styles/report-tab.css
lab/src/styles/products-tab.css
lab/src/styles/settings-tab.css
```

## BLOCO 22A — Login Google protegido em Ajustes

Status: implementado, aguardando teste no iPhone.

Versão esperada na tela:

```txt
0.22.0-lab-google-login-gate
```

Arquivos principais:

```txt
lab/src/services/googleLoginGateService.js
lab/src/services/firebaseAuthLabService.js
lab/src/cleanAppSettings.js
lab/src/styles/settings-tab.css
lab/src/config/appConfig.js
BELA_GESTAO_HANDOFF.md
```

O que o bloco faz:

- adiciona em Ajustes o card `Login Google — dados reais`;
- mostra que dados reais ficam bloqueados antes do login;
- permite `Entrar com Google`;
- salva estado do login em LAB/localStorage;
- mostra a conta logada;
- adiciona botão `Verificar dados reais`;
- mantém leitura real como próximo passo controlado;
- mantém escrita real bloqueada.

Regras mantidas:

- dados reais não aparecem antes do login;
- dados LAB não são misturados com dados reais;
- nenhuma escrita real automática foi liberada;
- Firebase real ainda não é escrito;
- catálogo real ainda não é alterado;
- sistema ativo da esposa não foi alterado.

## Checklist de teste do BLOCO 22A

1. Abrir preview Netlify.
2. Confirmar versão `0.22.0-lab-google-login-gate`.
3. Ir em Ajustes/Backup.
4. Ver o card `Login Google — dados reais`.
5. Confirmar que aparece `Dados reais bloqueados` antes do login.
6. Tocar em `Entrar com Google`.
7. Escolher a conta da esposa.
8. Confirmar que a conta aparece logada no card.
9. Tocar em `Verificar dados reais`.
10. Confirmar que aparece aviso de próximo bloco/leitura controlada.
11. Confirmar que produtos/vendas/pagamentos reais ainda não foram misturados automaticamente.

## Funções críticas finais que precisam continuar antes da entrega

- produtos;
- categorias/abas do catálogo;
- ligação Gestão ↔ Catálogo;
- upload de foto/geração automática de URL de imagem;
- Firebase/fonte compartilhada;
- login Google da esposa;
- backup automático atual;
- localStorage/dados antigos;
- vendas;
- compradores/clientes;
- pagamentos/parcelas;
- WhatsApp;
- PWA/iPhone;
- backup/configurações;
- funções de IA na criação/descrição de produto;
- histórico preservado mesmo se produto for removido.

## Próximo bloco recomendado

```txt
BLOCO 22B — Leitura controlada dos dados reais após login
```

Objetivo:

- ler dados reais somente após login Google;
- ainda sem escrita real;
- mostrar prévia dos dados reais separados dos dados LAB;
- validar estrutura antes da migração definitiva.

## Como continuar em outro chat

"Continue a reconstrução do Bela Gestão. Leia `BELA_GESTAO_HANDOFF.md` antes de qualquer alteração. A branch de trabalho é `rewrite-bela-gestao-lab`. Não mexa na `main`, não mexa no sistema antigo ativo da esposa, não escreva no Firebase real, não altere catálogo real. A versão atual é `0.22.0-lab-google-login-gate`. O BLOCO 22A criou `lab/src/services/googleLoginGateService.js` e `lab/src/services/firebaseAuthLabService.js`, adicionando em Ajustes o login Google protegido. Próximo bloco sugerido: `BLOCO 22B — Leitura controlada dos dados reais após login`."
