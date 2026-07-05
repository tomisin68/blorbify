const CLOUDINARY_CLOUD_NAME = 'dwshyzftx';
const CLOUDINARY_UPLOAD_PRESET = 'blorbmart';
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const MIN_PRODUCT_IMAGE_DIMENSION = 400;

function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image dimensions.'));
    };
    img.src = objectUrl;
  });
}

// Advisory only — small photos still get accepted (they display fine in the storefront itself),
// but they look blurry/cropped once Cloudinary pads them up for WhatsApp/Facebook/Twitter link
// previews. Surfacing this at upload time is cheaper than chasing it down later per-seller.
export async function checkProductImageDimensions(file) {
  try {
    const { width, height } = await getImageDimensions(file);
    if (width < MIN_PRODUCT_IMAGE_DIMENSION || height < MIN_PRODUCT_IMAGE_DIMENSION) {
      return `This photo is ${width}×${height}px, below the recommended ${MIN_PRODUCT_IMAGE_DIMENSION}×${MIN_PRODUCT_IMAGE_DIMENSION}px — it'll be added, but may look blurry or padded when shared as a link preview on WhatsApp, Facebook, or Twitter.`;
    }
    return '';
  } catch {
    // Don't block the upload if we can't read dimensions for some reason (unsupported format, etc).
    return '';
  }
}

export function validateImage(file, label = 'Image') {
  if (!file) {
    return `Please choose a ${label.toLowerCase()}.`;
  }

  if (!file.type?.startsWith('image/')) {
    return `${label} must be a JPG, PNG, WEBP, or another image file.`;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `${label} must be 8MB or smaller.`;
  }

  return '';
}

export function validateProductImage(file) {
  return validateImage(file, 'Product image');
}

export async function uploadImage(file, folder = 'blorbify/images', onProgress, label = 'Image') {
  const validationError = validateImage(file, label);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const result = JSON.parse(request.responseText || 'null');

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(result?.error?.message || 'Image upload failed. Please try again.'));
        return;
      }

      if (typeof onProgress === 'function') {
        onProgress(100);
      }

      resolve({
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    };

    request.onerror = () => reject(new Error('Image upload failed. Please check your connection and try again.'));
    request.send(formData);
  });
}

export function uploadProductImage(file, folder = 'blorbify/products', onProgress) {
  return uploadImage(file, folder, onProgress, 'Product image');
}

export function validateStoreLogo(file) {
  return validateImage(file, 'Store logo');
}

export function uploadStoreLogo(file, folder = 'blorbify/logos', onProgress) {
  return uploadImage(file, folder, onProgress, 'Store logo');
}

export function validateStoreBanner(file) {
  return validateImage(file, 'Store banner');
}

export function uploadStoreBanner(file, folder = 'blorbify/banners', onProgress) {
  return uploadImage(file, folder, onProgress, 'Store banner');
}
