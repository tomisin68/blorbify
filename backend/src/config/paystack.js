import axios from 'axios';
import crypto from 'node:crypto';
import { env } from './env.js';

const paystackHttp = axios.create({
  baseURL: env.paystackBaseUrl,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${env.paystackSecretKey}`,
    'Content-Type': 'application/json',
  },
});

export function requirePaystackSecretKey() {
  if (!env.paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }
}

async function paystackRequest(method, path, payload = null, params = null) {
  requirePaystackSecretKey();

  const response = await paystackHttp.request({
    method,
    url: path,
    data: payload,
    params,
  });

  return response.data;
}

export function verifyPaystackSignature(rawBody, signature) {
  if (!env.paystackSecretKey || !signature) {
    return false;
  }

  const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''));
  const hash = crypto.createHmac('sha512', env.paystackSecretKey).update(payload).digest('hex');
  return hash === signature;
}

export async function initializePaystackTransaction(payload) {
  return paystackRequest('post', '/transaction/initialize', payload);
}

export async function verifyPaystackTransaction(reference) {
  return paystackRequest('get', `/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function createPaystackSubaccount(payload) {
  return paystackRequest('post', '/subaccount', payload);
}

export async function updatePaystackSubaccount(subaccountCode, payload) {
  if (!subaccountCode) {
    throw new Error('subaccountCode is required.');
  }

  return paystackRequest('put', `/subaccount/${encodeURIComponent(subaccountCode)}`, payload);
}
