import { useEffect, useMemo, useState } from 'react';
import { listPlans, initializeSubscription } from './backendApi';

const planFeatures = {
  starter: ['Pro website + storefront', 'Unlimited products', 'Shareable store link', 'No ads included'],
  growth: ['Everything in Starter', 'Connected delivery', 'Ads that bring buyers', 'Order tracking for customers'],
  pro: ['Everything in Growth', 'Full ad campaigns', 'Priority delivery', 'Dedicated support'],
};

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BillingPanel({ user, profile }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscribingId, setSubscribingId] = useState('');
  const [error, setError] = useState('');
  const [initialBanner] = useState(() => {
    const billingResult = new URLSearchParams(window.location.search).get('billing');
    if (!billingResult) return '';
    return billingResult === 'success'
      ? 'Confirming your payment with Paystack — this usually takes just a few seconds.'
      : 'Your payment was not completed. You can try again below.';
  });

  const subscription = profile?.subscription || null;
  const activePlanId = subscription?.status === 'active' ? subscription.planId : '';

  const returnBanner = activePlanId && initialBanner.startsWith('Confirming')
    ? `Payment confirmed — your ${subscription.planName} plan is now active.`
    : initialBanner;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('billing')) return;
    params.delete('billing');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPlans(true);
      try {
        const token = await user.getIdToken();
        const response = await listPlans(token);
        if (active) setPlans(response?.data?.plans || []);
      } catch (loadError) {
        if (active) setError(loadError?.message || 'Could not load subscription plans.');
      } finally {
        if (active) setLoadingPlans(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => a.amountNaira - b.amountNaira),
    [plans]
  );

  const handleSubscribe = async (plan) => {
    setError('');
    setSubscribingId(plan.id);
    try {
      const token = await user.getIdToken();
      const response = await initializeSubscription({
        userId: user.uid,
        email: user.email || profile?.email || '',
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        planId: plan.id,
        callbackUrl: import.meta.env.VITE_PAYSTACK_CALLBACK_URL || '',
        returnUrl: `${window.location.origin}/dashboard?billing=success`,
      }, token);

      const authorizationUrl = response?.data?.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error('Paystack did not return a checkout link. Please try again.');
      }
      window.location.assign(authorizationUrl);
    } catch (subscribeError) {
      setError(subscribeError?.message || 'Could not start checkout. Please try again.');
      setSubscribingId('');
    }
  };

  return (
    <div className="billing-panel">
      <style>{`
        .billing-panel { display: grid; gap: 16px; }
        .billing-current {
          border-radius: 8px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .billing-current-label { color: var(--slate); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
        .billing-current-value { font-size: 18px; font-weight: 900; color: var(--ink); }
        .billing-current-meta { color: var(--slate); font-size: 12.5px; margin-top: 4px; }
        .billing-status-pill { border-radius: 999px; padding: 6px 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; background: rgba(25,35,40,.07); color: var(--ink); }
        .billing-status-pill.active { background: rgba(175,255,0,.2); color: #4e7300; }
        .billing-banner { border-radius: 8px; padding: 12px 14px; font-size: 13px; font-weight: 700; line-height: 1.5; background: rgba(175,255,0,.14); border: 1px solid rgba(175,255,0,.3); color: #4e7300; }
        .billing-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .billing-plan-card { border-radius: 8px; border: 1px solid var(--line); background: #fff; padding: 18px; display: grid; gap: 12px; align-content: start; position: relative; }
        .billing-plan-card.current { border-color: #9bdc00; box-shadow: 0 0 0 3px rgba(175,255,0,.16); }
        .billing-plan-name { font-size: 18px; font-weight: 900; color: var(--ink); }
        .billing-plan-desc { color: var(--slate); font-size: 12.5px; line-height: 1.5; margin: 0; }
        .billing-plan-price { font-size: 26px; font-weight: 900; color: var(--ink); }
        .billing-plan-price span { font-size: 13px; font-weight: 700; color: var(--slate); }
        .billing-plan-features { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .billing-plan-features li { display: flex; align-items: flex-start; gap: 8px; color: var(--ink); font-size: 13px; line-height: 1.4; }
        .billing-plan-features li::before { content: '✓'; color: #4e7300; font-weight: 900; flex-shrink: 0; }
        .billing-plan-btn { border: 0; border-radius: 999px; background: var(--signal); color: var(--ink); padding: 12px 16px; font: inherit; font-weight: 900; cursor: pointer; margin-top: 4px; }
        .billing-plan-btn:disabled { opacity: .65; cursor: not-allowed; }
        .billing-plan-btn.current-btn { background: rgba(25,35,40,.06); color: var(--ink); border: 1px solid var(--line); cursor: default; }
        .billing-alert { border-radius: 8px; padding: 11px 13px; font-size: 13px; line-height: 1.5; font-weight: 700; color: #9d2525; background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.24); }
        .billing-empty { border: 1px dashed var(--line); border-radius: 8px; padding: 28px 18px; text-align: center; color: var(--slate); line-height: 1.6; }
        @media (max-width: 920px) {
          .billing-plans { grid-template-columns: 1fr; }
        }
      `}</style>

      {returnBanner && <div className="billing-banner">{returnBanner}</div>}

      <div className="billing-current">
        <div>
          <div className="billing-current-label">Current plan</div>
          <div className="billing-current-value">{subscription?.planName || 'No active plan'}</div>
          {subscription?.status === 'active' && subscription?.endsAt && (
            <div className="billing-current-meta">Renews on {formatDate(subscription.endsAt)}</div>
          )}
        </div>
        <span className={`billing-status-pill ${subscription?.status === 'active' ? 'active' : ''}`}>
          {subscription?.status === 'active' ? 'Active' : subscription?.status === 'pending' ? 'Pending' : 'Not subscribed'}
        </span>
      </div>

      {error && <div className="billing-alert">{error}</div>}

      {loadingPlans ? (
        <div className="billing-empty">Loading plans...</div>
      ) : orderedPlans.length ? (
        <div className="billing-plans">
          {orderedPlans.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            return (
              <div className={`billing-plan-card ${isCurrent ? 'current' : ''}`} key={plan.id}>
                <div className="billing-plan-name">{plan.name}</div>
                <p className="billing-plan-desc">{plan.description}</p>
                <div className="billing-plan-price">{formatNaira(plan.amountNaira)}<span> / {plan.interval === 'yearly' ? 'year' : 'month'}</span></div>
                <ul className="billing-plan-features">
                  {(planFeatures[plan.id] || []).map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                {isCurrent ? (
                  <button type="button" className="billing-plan-btn current-btn" disabled>Current plan</button>
                ) : (
                  <button
                    type="button"
                    className="billing-plan-btn"
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribingId === plan.id}
                  >
                    {subscribingId === plan.id ? 'Redirecting to Paystack...' : subscription?.status === 'active' ? 'Switch to this plan' : 'Subscribe'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="billing-empty">Plans are not available right now. Please try again shortly.</div>
      )}
    </div>
  );
}
