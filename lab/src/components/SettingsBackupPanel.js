export function renderSettingsBackupPanel({ storageKeys }) {
  return `
    <section class="panel-card settings-panel">
      <div class="panel-title-row">
        <div>
          <h2>Configurações e Backup LAB</h2>
          <p>Exportar, importar e limpar dados locais de teste sem tocar no sistema real.</p>
        </div>
        <span class="safe-pill">Backup</span>
      </div>

      <div class="lab-actions three-actions">
        <button class="secondary-button" data-export-backup>Exportar backup</button>
        <label class="secondary-button file-action">
          Importar backup
          <input data-import-backup type="file" accept="application/json,.json">
        </label>
        <button class="secondary-button" data-clear-lab-storage>Limpar LAB</button>
      </div>

      <div class="storage-note">
        O backup inclui somente chaves <code>belaGestaoLab.*</code> salvas neste navegador.
        Não inclui Firebase real, catálogo real nem login Google.
      </div>

      <details class="diagnostic-details">
        <summary>Chaves LAB salvas</summary>
        ${storageKeys.length ? `
          <div class="diagnostic-table">
            ${storageKeys.map((row) => `
              <div class="diagnostic-row">
                <span>${row.key}</span>
                <strong>${row.sizeKb} KB</strong>
              </div>
            `).join('')}
          </div>
        ` : '<div class="diagnostic-ok">Nenhuma chave LAB salva agora.</div>'}
      </details>
    </section>
  `;
}
