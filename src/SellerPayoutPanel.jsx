import { useEffect, useMemo, useState } from 'react';
import { loadBanks, loadSellerSubaccount, saveSellerSubaccount } from './backendApi';

function formatDate(value) {
  if (!value) return 'Not updated yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not updated yet' : date.toLocaleString();
}

function buildForm(profile, fallbackBusinessName, fallbackEmail) {
  return {
    businessName: profile?.businessName || fallbackBusinessName || '',
    bankCode: profile?.bankCode || '',
    accountNumber: profile?.accountNumber || '',
    description: profile?.description || '',
    primaryContactEmail: profile?.primaryContactEmail || fallbackEmail || '',
  };
}

export default function SellerPayoutPanel({ user, storeInfo }) {
  const sellerId = user?.uid || '';
  const fallbackBusinessName = storeInfo?.businessName || '';
  const fallbackEmail = user?.email || '';
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(() => buildForm(null, fallbackBusinessName, fallbackEmail));
  const [loading, setLoading] = useState(Boolean(sellerId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [banks, setBanks] = useState([]);
  const [banksError, setBanksError] = useState('');

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await loadBanks();
        if (!active) return;
        setBanks(response?.data?.banks || []);
      } catch (banksLoadError) {
        if (!active) return;
        setBanksError(banksLoadError?.message || 'Could not load the bank list.');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const statusLabel = useMemo(() => {
    if (!profile?.subaccountCode) return 'Not created';
    return profile.status === 'inactive' ? 'Inactive' : 'Active';
  }, [profile]);

  useEffect(() => {
    if (!sellerId) {
      return undefined;
    }

    let active = true;

    void (async () => {
      setLoading(true);
      setError('');
      try {
        const token = await user.getIdToken();
        const response = await loadSellerSubaccount(sellerId, token);
        if (!active) return;

        const nextProfile = response?.data?.profile || null;
        setProfile(nextProfile);
        setForm(buildForm(nextProfile, fallbackBusinessName, fallbackEmail));
      } catch (loadError) {
        if (!active) return;

        if (loadError?.status === 404) {
          setProfile(null);
          setForm(buildForm(null, fallbackBusinessName, fallbackEmail));
        } else {
          setError(loadError?.message || 'Could not load your seller payout details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [sellerId, user, fallbackBusinessName, fallbackEmail]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const businessName = form.businessName.trim();
    const bankCode = form.bankCode.trim();
    const accountNumber = form.accountNumber.trim();
    const primaryContactEmail = form.primaryContactEmail.trim();
    const description = form.description.trim();

    if (!businessName) {
      setError('Enter your business name.');
      return;
    }

    if (!bankCode) {
      setError('Enter the bank code for your settlement bank.');
      return;
    }

    if (!accountNumber) {
      setError('Enter the account number that should receive settlements.');
      return;
    }

    setSaving(true);
    try {
      const hadExistingProfile = Boolean(profile?.subaccountCode);
      const token = await user.getIdToken();
      const response = await saveSellerSubaccount(
        sellerId,
        {
          businessName,
          bankCode,
          accountNumber,
          description,
          primaryContactEmail,
        },
        token
      );

      const nextProfile = response?.data?.profile || null;
      setProfile(nextProfile);
      setForm(buildForm(nextProfile, businessName, primaryContactEmail || fallbackEmail));
      setSuccess(hadExistingProfile ? 'Seller subaccount updated.' : 'Seller subaccount created.');
    } catch (saveError) {
      setError(saveError?.message || 'Could not save the seller subaccount.');
    } finally {
      setSaving(false);
    }
  };

  if (!sellerId) {
    return (
      <div className="seller-payout-panel">
        <div className="seller-panel-empty">Sign in to manage seller payouts.</div>
      </div>
    );
  }

  return (
    <div className="seller-payout-panel">
      <style>{`
        .seller-payout-panel {
          display: grid;
          gap: 16px;
        }
        .seller-panel-note {
          border-radius: 8px;
          border: 1px solid rgba(175,255,0,.22);
          background: rgba(175,255,0,.08);
          padding: 14px 16px;
          color: #3a5000;
          font-size: 13px;
          line-height: 1.55;
        }
        .seller-panel-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
          gap: 16px;
        }
        .seller-panel-card {
          border-radius: 8px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 18px;
          min-width: 0;
          display: grid;
          gap: 14px;
        }
        .seller-panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .seller-panel-title h4 {
          margin: 0;
          font-size: 20px;
          line-height: 1.1;
        }
        .seller-status {
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
          background: rgba(25,35,40,.07);
          color: var(--ink);
        }
        .seller-status.active {
          background: rgba(175,255,0,.2);
          color: #4e7300;
        }
        .seller-status.inactive {
          background: rgba(255,160,122,.18);
          color: #a84c22;
        }
        .seller-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .seller-field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .seller-field.full {
          grid-column: 1 / -1;
        }
        .seller-field span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .seller-field input,
        .seller-field select,
        .seller-field textarea {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 12px 13px;
          background: #fff;
          color: var(--ink);
          font: inherit;
          font-size: 14px;
          outline: none;
        }
        .seller-field textarea {
          resize: vertical;
          min-height: 92px;
        }
        .seller-field input:focus,
        .seller-field select:focus,
        .seller-field textarea:focus {
          border-color: #9bdc00;
          box-shadow: 0 0 0 4px rgba(175,255,0,.15);
        }
        .seller-help {
          color: var(--slate);
          font-size: 12px;
          line-height: 1.45;
          margin: -2px 0 0;
        }
        .seller-summary {
          display: grid;
          gap: 10px;
        }
        .seller-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--paper-dim);
        }
        .seller-summary-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }
        .seller-summary-row span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .seller-summary-row strong {
          color: var(--ink);
          font-size: 13px;
          text-align: right;
          overflow-wrap: anywhere;
        }
        .seller-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .seller-btn {
          border: 0;
          border-radius: 999px;
          background: var(--signal);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .seller-btn.secondary {
          background: rgba(25,35,40,.06);
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .seller-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .seller-alert {
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
        }
        .seller-alert.error {
          color: #9d2525;
          background: rgba(255,107,107,.1);
          border: 1px solid rgba(255,107,107,.24);
        }
        .seller-alert.success {
          color: #3d5900;
          background: rgba(175,255,0,.16);
          border: 1px solid rgba(175,255,0,.3);
        }
        .seller-panel-empty {
          border: 1px dashed var(--line);
          border-radius: 8px;
          padding: 28px 18px;
          text-align: center;
          color: var(--slate);
          line-height: 1.6;
        }
        @media (max-width: 920px) {
          .seller-panel-layout,
          .seller-form-grid {
            grid-template-columns: 1fr;
          }
          .seller-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="seller-panel-note">
        This uses the same Paystack business account, then creates a separate subaccount for this seller.
        When a buyer pays, the payment settles straight to your bank account — you keep 100% of the sale.
      </div>

      <div className="seller-panel-layout">
        <form className="seller-panel-card" onSubmit={handleSubmit}>
          <div className="seller-panel-title">
            <h4>Seller subaccount</h4>
            <span className={`seller-status ${profile?.subaccountCode ? (profile.status === 'inactive' ? 'inactive' : 'active') : ''}`}>{statusLabel}</span>
          </div>

          <div className="seller-form-grid">
            <label className="seller-field full">
              <span>Business name</span>
              <input
                value={form.businessName}
                onChange={(event) => updateField('businessName', event.target.value)}
                placeholder="Blorbify Fashion Store"
              />
            </label>
            <label className="seller-field">
              <span>Bank</span>
              {banks.length > 0 ? (
                <select value={form.bankCode} onChange={(event) => updateField('bankCode', event.target.value)}>
                  <option value="">Select your bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.bankCode}
                  onChange={(event) => updateField('bankCode', event.target.value)}
                  placeholder={banksError ? 'Enter your bank code' : 'Loading banks...'}
                />
              )}
            </label>
            <label className="seller-field">
              <span>Account number</span>
              <input
                inputMode="numeric"
                value={form.accountNumber}
                onChange={(event) => updateField('accountNumber', event.target.value)}
                placeholder="1234567890"
              />
            </label>
            <label className="seller-field">
              <span>Contact email</span>
              <input
                type="email"
                value={form.primaryContactEmail}
                onChange={(event) => updateField('primaryContactEmail', event.target.value)}
                placeholder="seller@example.com"
              />
            </label>
            <label className="seller-field full">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Short note for the payout profile"
              />
            </label>
          </div>

          <p className="seller-help">
            You keep 100% of every sale — Blorbify does not deduct a commission from your payments.
          </p>

          {error && <div className="seller-alert error">{error}</div>}
          {success && <div className="seller-alert success">{success}</div>}

          <div className="seller-actions">
            <button type="submit" className="seller-btn" disabled={saving || loading}>
              {saving ? 'Saving...' : profile?.subaccountCode ? 'Update subaccount' : 'Create subaccount'}
            </button>
            <button
              type="button"
              className="seller-btn secondary"
              onClick={() => {
                if (!sellerId) return;

                void (async () => {
                  setLoading(true);
                  setError('');
                  try {
                    const token = await user.getIdToken();
                    const response = await loadSellerSubaccount(sellerId, token);
                    const nextProfile = response?.data?.profile || null;
                    setProfile(nextProfile);
                    setForm(buildForm(nextProfile, fallbackBusinessName, fallbackEmail));
                  } catch (loadError) {
                    setError(loadError?.message || 'Could not load your seller payout details.');
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              disabled={saving || loading}
            >
              Refresh
            </button>
          </div>
        </form>

        <aside className="seller-panel-card">
          <div className="seller-panel-title">
            <h4>Current details</h4>
          </div>

          {loading ? (
            <div className="seller-panel-empty">Loading seller payout details...</div>
          ) : (
            <div className="seller-summary">
              <div className="seller-summary-row">
                <span>Subaccount code</span>
                <strong>{profile?.subaccountCode || 'Not created yet'}</strong>
              </div>
              <div className="seller-summary-row">
                <span>Settlement bank</span>
                <strong>{profile?.settlementBank || 'Not set'}</strong>
              </div>
              <div className="seller-summary-row">
                <span>Account name</span>
                <strong>{profile?.accountName || 'Not set'}</strong>
              </div>
              <div className="seller-summary-row">
                <span>You keep</span>
                <strong>100% of every sale</strong>
              </div>
              <div className="seller-summary-row">
                <span>Updated</span>
                <strong>{formatDate(profile?.updatedAt)}</strong>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
