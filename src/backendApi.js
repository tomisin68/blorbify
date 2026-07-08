import { auth } from './firebase';

function getBackendBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/g, '');
  }

  return '/api';
}

// The backend's root origin (no /api suffix) — needed for routes that live
// outside the /api prefix, like the Paystack callback page.
export function getBackendOrigin() {
  return getBackendBaseUrl().replace(/\/api\/?$/, '');
}

async function resolveAuthToken(token) {
  if (token) {
    return token;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You need to sign in before calling the backend.');
  }

  return currentUser.getIdToken();
}

async function parseResponse(response) {
  const rawText = await response.text();
  let data = {};
  let parseFailed = false;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      parseFailed = true;
    }
  }

  if (!response.ok || parseFailed) {
    const error = new Error(
      parseFailed
        ? 'Unexpected response from the backend (not JSON) — check VITE_BACKEND_API_BASE_URL is set correctly.'
        : data?.message || `Request failed with status ${response.status}.`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function backendRequest(path, { method = 'GET', body, headers = {}, token } = {}) {
  const authToken = await resolveAuthToken(token);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${getBackendBaseUrl()}${normalizedPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

// For public backend endpoints that don't require a signed-in user (e.g. plan
// listing, payment verification after a Paystack redirect where auth state
// may not have rehydrated yet).
export async function publicBackendRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${getBackendBaseUrl()}${normalizedPath}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

export async function loadBanks() {
  return publicBackendRequest('/sellers/banks', { method: 'GET' });
}

export async function loadSellerSubaccount(sellerId, token) {
  return backendRequest(`/sellers/${encodeURIComponent(sellerId)}/subaccount`, {
    method: 'GET',
    token,
  });
}

export async function saveSellerSubaccount(sellerId, payload, token) {
  return backendRequest(`/sellers/${encodeURIComponent(sellerId)}/subaccount`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function loadSubscriptionPlans() {
  return publicBackendRequest('/payments/plans', { method: 'GET' });
}

export async function initializeSubscriptionPayment(payload, token) {
  return backendRequest('/payments/subscriptions/initialize', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function verifySubscriptionPayment(reference) {
  return publicBackendRequest(`/payments/subscriptions/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
}

// Buyers checking out on a storefront aren't signed into Firebase, so these
// use the unauthenticated request path.
export async function initializeSellerOrderPayment(payload) {
  return publicBackendRequest('/seller-orders/paystack/initialize', {
    method: 'POST',
    body: payload,
  });
}

export async function verifySellerOrderPayment(reference) {
  return publicBackendRequest(`/seller-orders/paystack/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
  });
}

export async function sendEmailOtp(token) {
  return backendRequest('/auth/otp/send', { method: 'POST', token });
}

export async function verifyEmailOtp(code, token) {
  return backendRequest('/auth/otp/verify', { method: 'POST', token, body: { code } });
}

export async function sendEmailChangeOtp(newEmail, token) {
  return backendRequest('/auth/email-change/send', { method: 'POST', token, body: { newEmail } });
}

export async function confirmEmailChange(code, token) {
  return backendRequest('/auth/email-change/confirm', { method: 'POST', token, body: { code } });
}

export async function notifyOrderStatusUpdate({ orderId, status }, token) {
  return backendRequest('/notifications/order-status', {
    method: 'POST',
    token,
    body: { orderId, status },
  });
}

export async function sendOrderReceipt({ orderId }, token) {
  return backendRequest('/notifications/orders/receipt', {
    method: 'POST',
    token,
    body: { orderId },
  });
}

export async function createInvoice(payload, token) {
  return backendRequest('/invoices', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function resendInvoice(invoiceId, token) {
  return backendRequest(`/invoices/${encodeURIComponent(invoiceId)}/resend`, {
    method: 'POST',
    token,
  });
}

export async function requestFinancialReport(payload, token) {
  return backendRequest('/reports/financial', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function notifyLowStock({ productName, stock }, token) {
  return backendRequest('/notifications/low-stock', {
    method: 'POST',
    token,
    body: { productName, stock },
  });
}

export async function notifySupportMessage({ messagePreview }, token) {
  return backendRequest('/notifications/support-message', {
    method: 'POST',
    token,
    body: { messagePreview },
  });
}
