# Blorbify

Blorbify is a React storefront and business dashboard with a Node.js backend for billing, notifications, and Firestore admin workflows.

## Frontend

```bash
npm install
npm run dev
```

## Backend

The backend lives in [`backend/`](./backend) and runs as a separate Node service.

```bash
cd backend
npm install
npm run dev
```

## API

The frontend proxies `/api` requests to `http://localhost:4000` in development.
For production, set `VITE_BACKEND_API_BASE_URL` if your backend is deployed on a separate host.

Key backend routes:

- `GET /health`
- `GET /api/payments/plans`
- `POST /api/payments/subscriptions/initialize`
- `GET /api/payments/subscriptions/verify/:reference`
- `POST /api/paystack/webhook`
- `POST /api/sellers/:sellerId/subaccount`
- `GET /api/sellers/:sellerId/subaccount`
- `POST /api/seller-orders/paystack/initialize`
- `GET /api/seller-orders/paystack/verify/:reference`
- `POST /api/notifications/welcome`
- `POST /api/notifications/welcome/send`
- `POST /api/notifications/orders`

## Environment

Copy [`backend/.env.example`](./backend/.env.example) to `backend/.env` and fill in:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- SMTP settings if you want email delivery immediately
- `VITE_BACKEND_API_BASE_URL` if your frontend is hosted separately from the backend

## Notes

- The backend currently activates store-owner subscriptions first.
- Welcome and order-notification flows are scaffolded in the backend and ready to wire into the frontend once the payment flow is hooked up.
- Seller subaccounts now work through the dashboard using the same Paystack account and metadata-based routing.
