export const storeTemplates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimalist design perfect for any business',
    accent: '#AFFF00',
    surface: '#F6F8F1',
    ink: '#192328',
    card: '#FFFFFF',
    button: '#AFFF00',
    buttonText: '#192328',
    layout: 'panel',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated look for fashion, beauty, and luxury',
    accent: '#D4AF37',
    surface: '#F7F1E7',
    ink: '#17130F',
    card: '#FFFDF8',
    button: '#17130F',
    buttonText: '#FFFFFF',
    layout: 'editorial',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Vibrant and eye-catching for energetic brands',
    accent: '#FF6B35',
    surface: '#FFF4F0',
    ink: '#16191D',
    card: '#FFFFFF',
    button: '#FF6B35',
    buttonText: '#16191D',
    layout: 'dark',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, clean, and focused on your products',
    accent: '#2C3E50',
    surface: '#F4F6F6',
    ink: '#1B2631',
    card: '#FFFFFF',
    button: '#1B2631',
    buttonText: '#FFFFFF',
    layout: 'minimal',
  },
  {
    id: 'oakmoss',
    name: 'Fondé',
    description: 'A warm editorial storefront with layered hero imagery, curated categories, and premium product cards',
    accent: '#1F3D2B',
    surface: '#FAF7F1',
    ink: '#16150F',
    card: '#FFFFFF',
    button: '#1F3D2B',
    buttonText: '#FFFFFF',
    layout: 'split',
  },
  {
    id: 'atelier',
    name: 'Atelier',
    description: 'Soft boutique layout for makers, beauty, and premium services',
    accent: '#B5603F',
    surface: '#F3E3DA',
    ink: '#2B211D',
    card: '#FFF8F4',
    button: '#B5603F',
    buttonText: '#FFFFFF',
    layout: 'boutique',
  },
  {
    id: 'market',
    name: 'Market',
    description: 'Bright, direct, and high-conversion for everyday retail',
    accent: '#008A5B',
    surface: '#F4FBF7',
    ink: '#10261E',
    card: '#FFFFFF',
    button: '#008A5B',
    buttonText: '#FFFFFF',
    layout: 'market',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Polished dark showroom for electronics, art, and modern brands',
    accent: '#57D9FF',
    surface: '#101417',
    ink: '#F4F8FA',
    card: '#171E22',
    button: '#57D9FF',
    buttonText: '#101417',
    layout: 'showroom',
  },
];

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
  checkoutLabel: 'Checkout',
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
  return storeTemplates.find((template) => template.id === templateId) || storeTemplates[0];
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
