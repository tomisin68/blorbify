import { next } from '@vercel/functions';
import { formatCurrency } from './src/storefront/storefrontUtils.js';

// Same public Firebase Web config as src/firebase.js. Safe to embed here too —
// this is the public web API key; access is gated by Firestore security rules
// (publicStores/{slug} only allows unauthenticated reads when published == true),
// not by keeping this value secret.
const FIREBASE_PROJECT_ID = 'blorbify-badfc';
const FIREBASE_API_KEY = 'AIzaSyC9xt2TclymW1iUXInOmJQ4by_IR9sarZY';

// WhatsApp link shares also trigger Meta's own crawlers (facebookexternalhit / Facebot)
// alongside the WhatsApp/ user agent, so both are included here.
const CRAWLER_UA_PATTERN = /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|telegrambot|linkedinbot/i;

// First path segments that are app routes, never store slugs — see App.jsx's route list.
const RESERVED_PATHS = new Set(['login', 'signup', 'onboarding', 'dashboard', 'payment']);

// Facebook's crawler validates og:image synchronously against declared dimensions; without
// them it does a slower async fetch-and-measure pass that can fail the image silently even
// though the rest of the tags parse fine. Fall back to these (Facebook's recommended
// large-image-card size) when the product's own image dimensions weren't captured at upload.
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;

export const config = {
  matcher: ['/((?!assets/|favicon\\.svg|robots\\.txt|manifest\\.json).*)'],
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function decodeFirestoreValue(value) {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return null;
}

function decodeFirestoreFields(fields) {
  const result = {};
  for (const key of Object.keys(fields || {})) {
    result[key] = decodeFirestoreValue(fields[key]);
  }
  return result;
}

async function fetchPublicStore(storeSlug) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/publicStores/${encodeURIComponent(storeSlug)}?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const doc = await response.json();
  if (!doc?.fields) return null;

  return decodeFirestoreFields(doc.fields);
}

function renderProductOgHtml({ title, description, image, imageWidth, imageHeight, pageUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = image ? escapeHtml(image) : '';
  const safeUrl = escapeHtml(pageUrl);
  const safeWidth = Number(imageWidth) > 0 ? Number(imageWidth) : DEFAULT_OG_IMAGE_WIDTH;
  const safeHeight = Number(imageHeight) > 0 ? Number(imageHeight) : DEFAULT_OG_IMAGE_HEIGHT;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<meta property="og:type" content="product">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
${safeImage ? `<meta property="og:image" content="${safeImage}">
<meta property="og:image:width" content="${safeWidth}">
<meta property="og:image:height" content="${safeHeight}">` : ''}
<meta property="og:url" content="${safeUrl}">
<meta name="twitter:card" content="${safeImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
${safeImage ? `<meta name="twitter:image" content="${safeImage}">` : ''}
</head>
<body>
<h1>${safeTitle}</h1>
<p>${safeDescription}</p>
</body>
</html>`;
}

export default async function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  if (!CRAWLER_UA_PATTERN.test(userAgent)) {
    // Real users (and anything else) get the normal SPA, untouched.
    return next();
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get('product');
  if (!productId) {
    // Store-level (or unrecognized) URL — fall back to the existing generic OG tags in index.html.
    return next();
  }

  const storeSlug = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '');
  if (!storeSlug || RESERVED_PATHS.has(storeSlug.toLowerCase())) {
    return next();
  }

  try {
    const store = await fetchPublicStore(storeSlug);
    if (!store || store.published !== true) {
      return next();
    }

    const products = Array.isArray(store.products) ? store.products : [];
    const product = products.find((item) => item?.id === productId);
    if (!product) {
      console.warn(`OG middleware: product "${productId}" not found in store "${storeSlug}".`);
      return next();
    }

    const title = `${product.name} — ${formatCurrency(product.price)} | ${store.businessName || 'Blorbify'}`;
    const description = product.description
      ? product.description
      : `Available now at ${store.businessName || 'this store'}. ${formatCurrency(product.price)}.`;

    const hasProductImage = Boolean(product.imageUrl);

    return new Response(
      renderProductOgHtml({
        title,
        description,
        image: product.imageUrl || store.bannerUrl || '',
        imageWidth: hasProductImage ? product.imageWidth : null,
        imageHeight: hasProductImage ? product.imageHeight : null,
        pageUrl: url.toString(),
      }),
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    console.error('OG middleware failed, falling back to generic preview:', error);
    return next();
  }
}
