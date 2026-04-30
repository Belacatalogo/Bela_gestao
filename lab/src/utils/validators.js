export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeMoney(value) {
  const number = Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function normalizeTabs(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function validateProductDraft(draft) {
  const errors = [];

  if (!normalizeText(draft.name)) errors.push('Informe o nome do produto.');
  if (!normalizeText(draft.brand)) errors.push('Informe a marca.');
  if (!normalizeText(draft.category)) errors.push('Informe a categoria.');
  if (normalizeMoney(draft.price) <= 0) errors.push('Informe um preço maior que zero.');
  if (!normalizeText(draft.imageUrl)) errors.push('Informe uma URL de imagem.');

  return {
    ok: errors.length === 0,
    errors,
  };
}
