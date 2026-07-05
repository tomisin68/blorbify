import { env } from '../config/env.js';

export function requireRelaySecret(req, res, next) {
  const provided = req.headers['x-relay-secret'] || '';

  if (!env.relaySharedSecret || provided !== env.relaySharedSecret) {
    return res.status(401).json({
      success: false,
      message: 'Invalid relay secret.',
    });
  }

  return next();
}
