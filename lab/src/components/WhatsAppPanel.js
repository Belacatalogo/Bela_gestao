import { buildWhatsAppMessage, buildWhatsAppUrl } from '../services/whatsappLabService.js';

export function renderWhatsAppPanel({ sales, payments }) {
  const pendingPayments = payments.filter((payment) => payment.status !== 'pago');
  const latestSale = sales[0] || null;
  const latestPending = pendingPayments[0] || null;
  const saleMessage = buildWhatsAppMessage({ type: 'sale-confirmation', sale: latestSale });
  const reminderMessage = buildWhatsAppMessage({ type: 'payment-reminder', payment: latestPending });
  const paidMessage = buildWhatsAppMessage({ type: 'payment-confirmation', payment: payments.find((payment) => payment.status === 'pago') || latestPending });

  return `
    <section class="panel-card whatsapp-panel">
      <div class="panel-title-row">
        <div>
          <h2>WhatsApp LAB</h2>
          <p>Mensagens prontas para cliente. O sistema abre o WhatsApp, mas não envia automaticamente.</p>
        </div>
        <span class="safe-pill">Manual</span>
      </div>

      <div class="storage-note">
        Use sem telefone para escolher o contato no WhatsApp, ou preencha um número manualmente antes de abrir.
      </div>

      <label class="form-field">
        <span>Telefone opcional</span>
        <input data-whatsapp-phone type="tel" placeholder="Ex: 62991930771">
      </label>

      <div class="sales-list">
        ${renderMessageCard({ title: 'Confirmar venda', text: saleMessage, type: 'sale-confirmation', disabled: !latestSale })}
        ${renderMessageCard({ title: 'Cobrar pendência', text: reminderMessage, type: 'payment-reminder', disabled: !latestPending })}
        ${renderMessageCard({ title: 'Confirmar pagamento', text: paidMessage, type: 'payment-confirmation', disabled: !payments.length })}
      </div>
    </section>
  `;
}

function renderMessageCard({ title, text, type, disabled }) {
  const href = buildWhatsAppUrl({ message: text });
  return `
    <article class="sale-card">
      <div>
        <div class="badge-row">
          <span class="mini-badge">WhatsApp</span>
          <span class="mini-badge muted-badge">${type}</span>
        </div>
        <h3>${title}</h3>
        <p>${text}</p>
        <small>Prévia da mensagem. O envio continua manual.</small>
      </div>
      <div class="product-actions">
        <a class="secondary-button ${disabled ? 'disabled-link' : ''}" href="${disabled ? '#' : href}" target="_blank" rel="noopener noreferrer" data-whatsapp-link data-message-type="${type}" aria-disabled="${disabled ? 'true' : 'false'}">
          Abrir
        </a>
      </div>
    </article>
  `;
}
