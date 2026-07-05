export const signatureTemplate = {
  id: 'signature',
  name: 'Signature',
  description: "Blorbify's flagship storefront — clean, editorial, and built to convert.",
  accent: '#AFFF00',
  surface: '#F6F8F1',
  ink: '#141B1E',
  card: '#FFFFFF',
  button: '#141B1E',
  buttonText: '#F6F8F1',
  layout: 'signature',
};

export const noirTemplate = {
  id: 'noir',
  name: 'Noir',
  description: 'A bold, dark gallery storefront with full-bleed imagery — for fashion, art, and premium brands.',
  accent: '#D9A441',
  surface: '#0B0B0C',
  ink: '#F5F5F2',
  card: '#17171A',
  button: '#F5F5F2',
  buttonText: '#0B0B0C',
  layout: 'noir',
};

export const storeTemplates = [signatureTemplate, noirTemplate];

export const colorPresets = [
  '#AFFF00',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#DDA0DD',
  '#F0E68C',
  '#4A5D45',
  '#B5603F',
  '#008A5B',
  '#57D9FF',
  '#17130F',
];

export const defaultStoreCopy = {
  announcement: '',
  heroEyebrow: '',
  heroHeadline: '',
  heroSubtext: '',
  primaryButtonLabel: 'Shop products',
  secondaryButtonLabel: 'Call store',
  productsHeading: 'Shop products',
  productsSubheading: '',
  addToCartLabel: 'Add to cart',
  checkoutLabel: 'Place order',
  footerText: '',
};

export const socialLinkFields = [
  { key: 'instagram', label: 'Instagram', placeholder: '@yourbrand or https://instagram.com/yourbrand' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbrand' },
  { key: 'twitter', label: 'X / Twitter', placeholder: '@yourbrand or https://x.com/yourbrand' },
  { key: 'tiktok', label: 'TikTok', placeholder: '@yourbrand or https://tiktok.com/@yourbrand' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '08012345678 or https://wa.me/234...' },
  { key: 'email', label: 'Email', placeholder: 'hello@yourbrand.com' },
];

export function getStoreTemplate(templateId) {
  return storeTemplates.find((template) => template.id === templateId) || signatureTemplate;
}

export function getReadableTextColor(backgroundColor, dark = '#192328', light = '#FFFFFF') {
  const hex = String(backgroundColor || '').replace('#', '').trim();
  const normalizedHex = hex.length === 3
    ? hex.split('').map((character) => `${character}${character}`).join('')
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return dark;
  }

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 150 ? dark : light;
}

export function getTemplateTheme(templateId, overrides = {}) {
  const template = getStoreTemplate(templateId);
  const primaryColor = overrides.primaryColor || template.accent;
  const backgroundColor = overrides.backgroundColor || template.surface;
  const textColor = overrides.textColor || template.ink;
  const cardColor = overrides.cardColor || template.card || '#FFFFFF';
  const buttonColor = overrides.buttonColor || template.button || primaryColor;
  const buttonTextColor = overrides.buttonTextColor || template.buttonText || getReadableTextColor(buttonColor, textColor);

  return {
    primaryColor,
    backgroundColor,
    textColor,
    cardColor,
    buttonColor,
    buttonTextColor,
  };
}

export function getStoreCopy(store = {}) {
  return {
    ...defaultStoreCopy,
    announcement: store.announcement || defaultStoreCopy.announcement,
    heroEyebrow: store.heroEyebrow || defaultStoreCopy.heroEyebrow,
    heroHeadline: store.heroHeadline || defaultStoreCopy.heroHeadline,
    heroSubtext: store.heroSubtext || defaultStoreCopy.heroSubtext,
    primaryButtonLabel: store.primaryButtonLabel || defaultStoreCopy.primaryButtonLabel,
    secondaryButtonLabel: store.secondaryButtonLabel || defaultStoreCopy.secondaryButtonLabel,
    productsHeading: store.productsHeading || defaultStoreCopy.productsHeading,
    productsSubheading: store.productsSubheading || defaultStoreCopy.productsSubheading,
    addToCartLabel: store.addToCartLabel || defaultStoreCopy.addToCartLabel,
    checkoutLabel: store.checkoutLabel || defaultStoreCopy.checkoutLabel,
    footerText: store.footerText || defaultStoreCopy.footerText,
  };
}

export function getStoreSocialLinks(store = {}) {
  return socialLinkFields.reduce((links, field) => {
    links[field.key] = store[field.key] || '';
    return links;
  }, {});
}
