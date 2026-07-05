import { env } from '../config/env.js';

// Chains after requireAuth, which has already verified the Firebase ID token
// and set req.user — this just narrows access to the platform-owner allowlist.
export function requireAdminEmail(req, res, next) {
  const email = String(req.user?.email || '').toLowerCase();

  if (!email || !env.adminEmails.includes(email)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to the admin console.',
    });
  }

  return next();
}
