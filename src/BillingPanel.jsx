import { useEffect, useState } from 'react';
import { initializeSubscriptionPayment, loadSubscriptionPlans } from './backendApi';

const paystackCallbackUrl = import.meta.env.VITE_PAYSTACK_CALLBACK_URL || '';

function formatNaira(amountNaira) {
  return `₦${Number(amountNaira || 0).toLocaleString('en-NG')}`;
}

function redirectTo(url) {
  window.location.href = url;
}

export default function BillingPanel({ user, userProfile }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingPlanId, setPayingPlanId] = useState('');
  const currentPlanId = userProfile?.subscription?.planId || userProfile?.billing?.planId || '';
  const currentPlanStatus = userProfile?.subscription?.status || userProfile?.billing?.status || '';

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await loadSubscriptionPlans();
        if (!active) return;
        setPlans(response?.data?.plans || []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || 'Could not load subscription plans.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSubscribe = async (planId) => {
    if (!user?.uid) return;

    setError('');
    setPayingPlanId(planId);

    try {
      const [firstName = '', lastName = ''] = (user.displayName || '').split(' ');
      const token = await user.getIdToken();
      const response = await initializeSubscriptionPayment(
        {
          userId: user.uid,
          email: user.email,
          firstName,
          lastName,
          planId,
          callbackUrl: paystackCallbackUrl,
          returnUrl: `${window.location.origin}/payment/success`,
        },
        token
      );

      const authorizationUrl = response?.data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error('Paystack did not return a checkout link.');
      }

      redirectTo(authorizationUrl);
    } catch (payError) {
      setError(payError?.message || 'Could not start checkout for this plan.');
      setPayingPlanId('');
    }
  };

  return (
    <div className="billing-panel">
      <style>{`
        .billing-panel {
          display: grid;
          gap: 16px;
        }
        .billing-panel-note {
          border-radius: 8px;
          border: 1px solid rgba(175,255,0,.22);
          background: rgba(175,255,0,.08);
          padding: 14px 16px;
          color: #3a5000;
          font-size: 13px;
          line-height: 1.55;
        }
        .billing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .billing-card {
          border-radius: 8px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 20px;
          display: grid;
          gap: 10px;
          min-width: 0;
        }
        .billing-card.current {
          border-color: #9bdc00;
          box-shadow: 0 0 0 3px rgba(175,255,0,.15);
        }
        .billing-card h4 {
          margin: 0;
          font-size: 18px;
        }
        .billing-price {
          font-size: 24px;
          font-weight: 900;
          color: var(--ink);
        }
        .billing-price span {
          font-size: 13px;
          font-weight: 700;
          color: var(--slate);
        }
        .billing-desc {
          color: var(--slate);
          font-size: 13px;
          line-height: 1.5;
          min-height: 40px;
        }
        .billing-btn {
          border: 0;
          border-radius: 999px;
          background: var(--signal);
          color: var(--ink);
          padding: 12px 16px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .billing-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .billing-tag {
          align-self: start;
          border-radius: 999px;
          padding: 6px 11px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
          background: rgba(175,255,0,.2);
          color: #4e7300;
        }
        .billing-alert {
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
          color: #9d2525;
          background: rgba(255,107,107,.1);
          border: 1px solid rgba(255,107,107,.24);
        }
        .billing-empty {
          border: 1px dashed var(--line);
          border-radius: 8px;
          padding: 28px 18px;
          text-align: center;
          color: var(--slate);
          line-height: 1.6;
        }
      `}</style>

      <div className="billing-panel-note">
        Payments are processed by Paystack. After checkout you'll be brought back here automatically.
      </div>

      {error && <div className="billing-alert">{error}</div>}

      {loading ? (
        <div className="billing-empty">Loading plans...</div>
      ) : (
        <div className="billing-grid">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId && currentPlanStatus === 'active';
            return (
              <div key={plan.id} className={`billing-card ${isCurrent ? 'current' : ''}`}>
                {isCurrent && <span className="billing-tag">Current plan</span>}
                <h4>{plan.name}</h4>
                <div className="billing-price">
                  {formatNaira(plan.amountNaira)} <span>/ {plan.interval}</span>
                </div>
                <p className="billing-desc">{plan.description}</p>
                <button
                  type="button"
                  className="billing-btn"
                  disabled={Boolean(payingPlanId) || isCurrent}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isCurrent ? 'Active' : payingPlanId === plan.id ? 'Redirecting…' : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
