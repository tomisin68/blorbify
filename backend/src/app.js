import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import crypto from 'node:crypto';
import { env, isProduction } from './config/env.js';
import paymentsRoutes from './routes/payments.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import sellerOrdersRoutes from './routes/sellerOrders.routes.js';
import { handlePaystackWebhook } from './controllers/webhooks.controller.js';
import { verifyPaystackTransaction } from './config/paystack.js';
import { applyVerifiedPayment } from './services/billing.service.js';
import { applySellerOrderPayment } from './services/sellerOrder.service.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CSP is set per-route (see /payment/callback) with a request-specific nonce;
// Helmet's default CSP has no knowledge of that nonce and would block the inline
// redirect script, so its built-in CSP is disabled here.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.clientOrigin,
  credentials: true,
}));
app.use(morgan(isProduction() ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'blorbify-backend',
    status: 'ok',
    environment: env.nodeEnv,
  });
});

app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), handlePaystackWebhook);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/seller-orders', sellerOrdersRoutes);

app.get('/payment/callback', async (req, res) => {
  const safe = (value) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rawReference = String(req.query.reference || req.query.trxref || '').trim();
  let continueUrl = '';
  let paymentStatus = 'pending';

  if (rawReference) {
    try {
      const verification = await verifyPaystackTransaction(rawReference);
      const payload = verification.data || {};
      const metadata = payload.metadata || {};
      paymentStatus = String(payload.status || 'pending').toLowerCase();

      if (paymentStatus === 'success') {
        if (metadata?.purpose === 'seller_order_payment') {
          const result = await applySellerOrderPayment({
            reference: rawReference,
            verificationData: payload,
            source: 'callback',
          });
          continueUrl = metadata.returnUrl || result?.order?.returnUrl || '';
        } else if (metadata?.purpose === 'store_owner_subscription') {
          const result = await applyVerifiedPayment({
            reference: rawReference,
            verificationData: payload,
            source: 'callback',
          });
          continueUrl = metadata.returnUrl || result?.subscription?.returnUrl || '';
        }

        if (continueUrl) {
          const separator = continueUrl.includes('?') ? '&' : '?';
          continueUrl = `${continueUrl}${separator}reference=${encodeURIComponent(rawReference)}`;
        }
      }
    } catch (error) {
      console.error('Payment callback error:', error.message);
    }
  }

  const title = paymentStatus === 'success' ? 'Payment received' : 'Payment processing';
  const message = paymentStatus === 'success'
    ? 'Your payment was completed successfully.'
    : 'Your payment is being processed. You can safely return to the app.';

  const cspNonce = crypto.randomBytes(16).toString('base64');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' 'nonce-${cspNonce}'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests`
  );

  res.status(200).send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${safe(title)}</title>
      <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0f1518; color: #f6f8f1; font-family: Arial, sans-serif; padding: 24px; }
        .card { width: 100%; max-width: 560px; background: #192328; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); text-align: center; }
        h1 { margin: 0 0 12px; font-size: 28px; }
        p { margin: 0 0 10px; color: #c7d1d4; line-height: 1.6; }
        code { display: inline-block; margin-top: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(175,255,0,0.12); color: #afff00; word-break: break-all; }
        a { color: #afff00; }
      </style>
    </head>
    <body>
      <main class="card">
        <h1>${safe(title)}</h1>
        <p>${safe(message)}</p>
        ${rawReference ? `<p>Reference</p><code>${safe(rawReference)}</code>` : ''}
        ${continueUrl ? `<p style="margin-top:16px;">You will be redirected shortly.</p>` : '<p style="margin-top:16px;">You can close this tab and return to the app.</p>'}
      </main>
      <script nonce="${cspNonce}">
        const continueUrl = ${JSON.stringify(continueUrl)};
        if (continueUrl) {
          setTimeout(() => { window.location.href = continueUrl; }, 2200);
        } else {
          setTimeout(() => { window.close(); }, 2200);
        }
      </script>
    </body>
  </html>`);
});

app.use(notFound);
app.use(errorHandler);

export default app;
