import { fail } from '../utils/response.js';
import { HttpError } from '../utils/httpError.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof HttpError ? error.message : 'Something went wrong.';

  if (statusCode >= 500) {
    console.error(error);
  }

  return fail(res, statusCode, message, error instanceof HttpError ? error.details : null);
}
