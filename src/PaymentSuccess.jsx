import { useEffect, useState } from 'react';
import { verifySubscriptionPayment } from './backendApi';

function getReferenceFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return params.get('reference') || params.get('trxref') || '';
}

export default function PaymentSuccess() {
  const [reference] = useState(() => getReferenceFromLocation());
  const [status, setStatus] = useState(() => (reference ? 'checking' : 'error'));
  const [message, setMessage] = useState(() =>
    reference ? 'Confirming your payment…' : "We couldn't find a payment reference in this link."
  );

  useEffect(() => {
    if (!reference) return undefined;

    let cancelled = false;

    verifySubscriptionPayment(reference)
      .then((data) => {
        if (cancelled) return;
        const paymentStatus = String(
          data?.data?.verification?.status || data?.data?.result?.transaction?.status || ''
        ).toLowerCase();

        if (['paid', 'success', 'completed', 'active'].includes(paymentStatus)) {
          setStatus('success');
          setMessage('Your plan is now active. You can head back to your dashboard.');
        } else {
          setStatus('pending');
          setMessage("We're still waiting for confirmation from Paystack. This can take a minute.");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error.message || 'We could not verify this payment.');
      });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  const goToDashboard = () => {
    window.location.href = '/';
  };

  const iconFor = {
    checking: '⏳',
    success: '✅',
    pending: '⏳',
    error: '⚠️',
  }[status];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0F1518',
        color: '#F6F8F1',
        fontFamily: 'Raleway, sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '40px 32px',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>{iconFor}</div>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>
          {status === 'success' ? 'Payment received' : status === 'error' ? 'Payment issue' : 'Payment processing'}
        </h1>
        <p style={{ color: '#c7d1d4', lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <button
          type="button"
          onClick={goToDashboard}
          style={{
            background: '#AFFF00',
            color: '#0F1518',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
