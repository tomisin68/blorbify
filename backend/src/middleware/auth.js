import { adminAuth } from '../config/firebaseAdmin.js';
import { createHttpError } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      throw createHttpError(401, 'Authorization token is required.');
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Unauthorized',
    });
  }
}
