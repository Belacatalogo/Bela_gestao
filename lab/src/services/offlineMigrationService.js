import { auditLegacyBackupText, summarizeLegacyAudit } from './legacyBackupAuditService.js';
import { importLegacyBackupToLab } from './legacyBackupImportService.js';

const LOCKED_REAL_TARGETS = Object.freeze([
  'Firebase real',
  'Login Google real',
  'Catálogo público real',
  'Backup automático ativo da esposa',
  'Funções reais de IA com chave/sessão ativa',
]);

const REQUIRED_FINAL_CAPABILITIES = Object.freeze([
  'Login Google mantendo conta e dados da esposa',
  'Leitura dos dados atuais do Firebase antes de qualquer escrita',
  'Backup completo antes de migração final',
  'Produtos com foto e URL automática',
  'Publicar/ocultar produto no catálogo',
  'IA na criação/descrição do produto com fallback manual',
  'Vendas, clientes, parcelas e histórico preservados mesmo se produto for removido',
]);

export function getOfflineMigrationStatus() {
  return {
    mode: 'offline-lab-only',
    canReadRealFirebase: false,
    canWriteRealFirebase: false,
    canChangeRealCatalog: false,
    canUseRealGoogleLogin: false,
    canRunRealAi: false,
    lockedRealTargets: LOCKED_REAL_TARGETS,
    requiredFinalCapabilities: REQUIRED_FINAL_CAPABILITIES,
    nextSafeStep: 'Analisar backup/export antigo e importar somente para LAB/localStorage.',
  };
}

export function analyzeLegacyBackupForOfflineMigration(text) {
  const audit = auditLegacyBackupText(text);
  if (!audit.ok) {
    return {
      ok: false,
      error: audit.error || 'Backup antigo inválido.',
      status: getOfflineMigrationStatus(),
    };
  }

  return {
    ok: true,
    summary: summarizeLegacyAudit(audit),
    audit,
    status: getOfflineMigrationStatus(),
    simulation: {
      willTouchFirebase: false,
      willTouchGoogleLogin: false,
      willTouchRealCatalog: false,
      willReplaceActiveSystem: false,
      canImportToLab: Boolean(audit.compatibility?.canImportToLabAfterReview),
      notes: [
        'A análise acontece no navegador, em modo LAB.',
        'A importação segura salva apenas no localStorage da LAB.',
        'Produtos importados podem aparecer como produtos legados até mapear a fonte real do catálogo.',
        'Clientes podem ser importados com anonimização para teste ou com dados reais apenas se o arquivo já estiver com você localmente.',
      ],
    },
  };
}

export function importLegacyBackupOfflineToLab(text, options = {}) {
  const analysis = analyzeLegacyBackupForOfflineMigration(text);
  if (!analysis.ok) return analysis;

  if (!analysis.simulation.canImportToLab) {
    return {
      ok: false,
      error: 'Backup analisado, mas ainda não está seguro para importação LAB.',
      analysis,
    };
  }

  const result = importLegacyBackupToLab(text, { anonymize: options.anonymize !== false });
  if (!result.ok) return result;

  return {
    ok: true,
    analysis,
    result,
    message: `Importação offline concluída no LAB: ${result.counts.products} produto(s), ${result.counts.sales} venda(s), ${result.counts.payments} parcela(s).`,
    guarantees: {
      touchedFirebase: false,
      touchedGoogleLogin: false,
      touchedRealCatalog: false,
      touchedActiveSystem: false,
    },
  };
}
