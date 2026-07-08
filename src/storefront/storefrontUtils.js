export function formatCurrency(value) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString()}`;
}

// Digital products have no stock count (unlimited copies) — only physical
// products can actually run out.
export function isProductAvailable(product) {
  if (product?.type === 'digital') return true;
  return Number(product?.stock || 0) > 0;
}

function normalizeWhatsAppDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('234') ? digits : `234${digits.replace(/^0/, '')}`;
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
    const digits = normalizeWhatsAppDigits(cleanValue);
    return digits ? `https://wa.me/${digits}` : '';
  }
  if (type === 'email') return `mailto:${cleanValue}`;
  return cleanValue;
}

// Builds a wa.me link pre-filled with an order summary so a buyer can tap through
// straight into a chat with the seller instead of a raw contact link.
export function getWhatsAppOrderHref(whatsappValue, message) {
  const cleanValue = String(whatsappValue || '').trim();
  if (!cleanValue) return '';

  if (/^https?:\/\//i.test(cleanValue)) {
    const url = new URL(cleanValue);
    if (message) url.searchParams.set('text', message);
    return url.toString();
  }

  const digits = normalizeWhatsAppDigits(cleanValue);
  if (!digits) return '';
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${query}`;
}

export function getBusinessTypeLabel(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
