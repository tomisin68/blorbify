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

export async function listPlans(token) {
  return backendRequest('/payments/plans', { method: 'GET', token });
}

export async function initializeSubscription(payload, token) {
  return backendRequest('/payments/subscriptions/initialize', {
    method: 'POST',
    token,
    body: payload,
  });
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
