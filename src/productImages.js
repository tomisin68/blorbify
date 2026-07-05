export const MAX_PRODUCT_IMAGES = 6;

export function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length) return product.images;
  if (product?.imageUrl) {
    return [{
      url: product.imageUrl,
      publicId: product.imagePublicId || '',
      width: product.imageWidth || null,
      height: product.imageHeight || null,
      format: product.imageFormat || '',
      bytes: product.imageBytes || null,
    }];
  }
  return [];
}

export function getProductCoverImage(product) {
  return getProductImages(product)[0]?.url || '';
}
