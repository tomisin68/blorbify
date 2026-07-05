export function formatCurrency(value) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString()}`;
}

export function getSocialHref(type, value) {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return '';
  if (/^https?:\/\//i.test(cleanValue) || /^mailto:/i.test(cleanValue)) return cleanValue;

  const withoutAt = cleanValue.replace(/^@/, '');
  if (type === 'instagram') return `https://instagram.com/${withoutAt}`;
  if (type === 'twitter') return `https://x.com/${withoutAt}`;
  if (type === 'tiktok') return `https://tiktok.com/@${withoutAt}`;
  if (type === 'whatsapp') {
    const digits = cleanValue.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits.startsWith('234') ? digits : `234${digits.replace(/^0/, '')}`}` : '';
  }
  if (type === 'email') return `mailto:${cleanValue}`;
  return cleanValue;
}

export function getBusinessTypeLabel(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
