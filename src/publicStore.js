import { createStoreSlug, getStoreUrl } from './storeLinks';
import { defaultStoreCopy, getStoreSocialLinks, getTemplateTheme } from './storeTemplates';

export function buildPublicStorePayload(storeInfo, ownerId) {
  const storeSlug = createStoreSlug(storeInfo.storeSlug || storeInfo.businessName || 'your-store');
  const products = Array.isArray(storeInfo.products)
    ? storeInfo.products
      .filter((product) => product?.name && product?.imageUrl)
      // The real digital file URL must never land in this publicly-readable
      // doc — buyers only get it after payment, via the backend delivery flow.
      .map((product) => {
        if (product.type !== 'digital') return product;
        const { digitalFile, ...rest } = product;
        return { ...rest, hasDigitalFile: Boolean(digitalFile?.url) };
      })
    : [];
  const theme = getTemplateTheme(storeInfo.template || 'modern', storeInfo);
  const socials = getStoreSocialLinks(storeInfo);

  return {
    ownerId,
    businessName: storeInfo.businessName || 'Your store',
    businessType: storeInfo.businessType || '',
    description: storeInfo.description || '',
    phone: storeInfo.phone || '',
    city: storeInfo.city || '',
    state: storeInfo.state || '',
    instagram: storeInfo.instagram || '',
    facebook: socials.facebook,
    twitter: socials.twitter,
    tiktok: socials.tiktok,
    whatsapp: socials.whatsapp,
    email: socials.email,
    template: storeInfo.template || 'modern',
    primaryColor: theme.primaryColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    cardColor: theme.cardColor,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
    logoUrl: storeInfo.logoUrl || '',
    logoPublicId: storeInfo.logoPublicId || '',
    bannerUrl: storeInfo.bannerUrl || '',
    bannerPublicId: storeInfo.bannerPublicId || '',
    announcement: storeInfo.announcement || defaultStoreCopy.announcement,
    heroEyebrow: storeInfo.heroEyebrow || defaultStoreCopy.heroEyebrow,
    heroHeadline: storeInfo.heroHeadline || defaultStoreCopy.heroHeadline,
    heroSubtext: storeInfo.heroSubtext || defaultStoreCopy.heroSubtext,
    primaryButtonLabel: storeInfo.primaryButtonLabel || defaultStoreCopy.primaryButtonLabel,
    secondaryButtonLabel: storeInfo.secondaryButtonLabel || defaultStoreCopy.secondaryButtonLabel,
    productsHeading: storeInfo.productsHeading || defaultStoreCopy.productsHeading,
    productsSubheading: storeInfo.productsSubheading || defaultStoreCopy.productsSubheading,
    addToCartLabel: storeInfo.addToCartLabel || defaultStoreCopy.addToCartLabel,
    checkoutLabel: storeInfo.checkoutLabel || defaultStoreCopy.checkoutLabel,
    footerText: storeInfo.footerText || defaultStoreCopy.footerText,
    deliveryFee: Number(storeInfo.deliveryFee || 0),
    storeSlug,
    storeUrl: getStoreUrl(storeSlug),
    products,
    published: true,
  };
}
