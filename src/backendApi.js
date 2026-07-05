import { auth } from './firebase';

function getBackendBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/g, '');
  }

  return '/api';
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

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}.`);
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
