function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function ensureBrazilPhone(value) {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function buildWhatsAppMessage({ type, sale = null, payment = null }) {
  const clientName = payment?.saleClientName || sale?.clientName || 'cliente';
  const productName = payment?.saleProductName || sale?.productName || 'produto';
  const amount = payment?.amount ?? sale?.total ?? 0;

  if (type === 'payment-reminder') {
    return `Olá, ${clientName}! Tudo bem? Passando para lembrar da pendência referente a ${productName}, no valor de ${money(amount)}. Quando puder, me avise sobre o pagamento. Obrigada!`;
  }

  if (type === 'payment-confirmation') {
    return `Olá, ${clientName}! Pagamento confirmado referente a ${productName}, no valor de ${money(amount)}. Muito obrigada pela compra!`;
  }

  return `Olá, ${clientName}! Sua compra foi registrada: ${productName}, valor ${money(amount)}. Obrigada pela preferência!`;
}

export function buildWhatsAppUrl({ phone = '', message }) {
  const normalizedPhone = ensureBrazilPhone(phone);
  const encodedMessage = encodeURIComponent(message || '');
  const phonePart = normalizedPhone ? `/${normalizedPhone}` : '';
  return `https://wa.me${phonePart}?text=${encodedMessage}`;
}

export function openWhatsAppMessage({ phone = '', message }) {
  const url = buildWhatsAppUrl({ phone, message });
  window.open(url, '_blank', 'noopener,noreferrer');
  return url;
}
