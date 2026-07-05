import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { getBackendOrigin, backendRequest, createInvoice, resendInvoice } from './backendApi';

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString()}`;
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function emptyItem() {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export default function InvoicesPanel({ user }) {
  const sellerId = user?.uid || '';
  const [invoices, setInvoices] = useState([]);
  const [loadingList, setLoadingList] = useState(Boolean(sellerId));
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyInvoiceId, setBusyInvoiceId] = useState('');

  useEffect(() => {
    if (!sellerId) return undefined;

    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        setInvoices(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setLoadingList(false);
      },
      (loadError) => {
        console.error('Invoices load failed:', loadError);
        setLoadingList(false);
      }
    );

    return unsubscribe;
  }, [sellerId]);

  const updateItem = (index, field, value) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const addItemRow = () => setItems((current) => [...current, emptyItem()]);
  const removeItemRow = (index) => setItems((current) => (
    current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current
  ));

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNote('');
    setItems([emptyItem()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Customer name and email are required.');
      return;
    }
    if (!items.some((item) => item.description.trim())) {
      setError('Add at least one item with a description.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await createInvoice(
        {
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          note: note.trim(),
          items: items
            .filter((item) => item.description.trim())
            .map((item) => ({
              description: item.description.trim(),
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
            })),
        },
        token
      );
      setSuccess('Invoice created and emailed to the customer.');
      resetForm();
    } catch (submitError) {
      setError(submitError?.message || 'Could not create the invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (invoiceId) => {
    setBusyInvoiceId(invoiceId);
    try {
      const token = await user.getIdToken();
      await resendInvoice(invoiceId, token);
    } catch (resendError) {
      console.error('Resend invoice failed:', resendError);
    } finally {
      setBusyInvoiceId('');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    setBusyInvoiceId(invoiceId);
    try {
      const token = await user.getIdToken();
      await backendRequest(`/invoices/${encodeURIComponent(invoiceId)}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'paid' },
      });
    } catch (statusError) {
      console.error('Mark invoice paid failed:', statusError);
    } finally {
      setBusyInvoiceId('');
    }
  };

  const downloadUrl = async (invoiceId) => {
    const token = await user.getIdToken();
    const response = await fetch(`${getBackendOrigin()}/api/invoices/${encodeURIComponent(invoiceId)}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!sellerId) {
    return (
      <div className="invoices-panel">
        <div className="invoices-empty">Sign in to manage invoices.</div>
      </div>
    );
  }

  return (
    <div className="invoices-panel">
      <style>{`
        .invoices-panel {
          display: grid;
          gap: 16px;
        }
        .invoices-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, .9fr);
          gap: 16px;
        }
        .invoices-card {
          border-radius: 8px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 18px;
          min-width: 0;
          display: grid;
          gap: 14px;
        }
        .invoices-card h4 {
          margin: 0;
          font-size: 18px;
        }
        .invoice-field {
          display: grid;
          gap: 6px;
        }
        .invoice-field span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .invoice-field input,
        .invoice-field textarea {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 11px 12px;
          font: inherit;
          font-size: 14px;
        }
        .invoice-row-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .invoice-items {
          display: grid;
          gap: 10px;
        }
        .invoice-item-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 70px 110px auto;
          gap: 8px;
          align-items: center;
        }
        .invoice-item-row input {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 9px 10px;
          font: inherit;
          font-size: 13px;
          width: 100%;
        }
        .invoice-remove-btn {
          border: 0;
          background: transparent;
          color: #9d2525;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
        .invoice-add-btn {
          justify-self: start;
          border: 1px dashed var(--line);
          background: transparent;
          border-radius: 8px;
          padding: 8px 12px;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          color: var(--ink);
        }
        .invoice-total {
          display: flex;
          justify-content: space-between;
          font-weight: 900;
          font-size: 15px;
          padding-top: 10px;
          border-top: 1px solid var(--paper-dim);
        }
        .invoice-btn {
          border: 0;
          border-radius: 999px;
          background: var(--signal);
          color: var(--ink);
          padding: 12px 16px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
          justify-self: start;
        }
        .invoice-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .invoice-alert {
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 700;
        }
        .invoice-alert.error {
          color: #9d2525;
          background: rgba(255,107,107,.1);
          border: 1px solid rgba(255,107,107,.24);
        }
        .invoice-alert.success {
          color: #3d5900;
          background: rgba(175,255,0,.16);
          border: 1px solid rgba(175,255,0,.3);
        }
        .invoices-list {
          display: grid;
          gap: 10px;
        }
        .invoice-row {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 12px 14px;
          display: grid;
          gap: 6px;
        }
        .invoice-row-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .invoice-row-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .invoice-link-btn {
          border: 0;
          background: transparent;
          color: var(--ink);
          text-decoration: underline;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
        }
        .invoice-status {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          background: rgba(25,35,40,.07);
          color: var(--ink);
          align-self: start;
        }
        .invoice-status.paid {
          background: rgba(175,255,0,.2);
          color: #4e7300;
        }
        .invoices-empty {
          border: 1px dashed var(--line);
          border-radius: 8px;
          padding: 28px 18px;
          text-align: center;
          color: var(--slate);
          line-height: 1.6;
        }
        @media (max-width: 920px) {
          .invoices-layout,
          .invoice-row-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="invoices-layout">
        <form className="invoices-card" onSubmit={handleSubmit}>
          <h4>New invoice</h4>

          <div className="invoice-row-grid">
            <label className="invoice-field">
              <span>Customer name</span>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Jane Doe" />
            </label>
            <label className="invoice-field">
              <span>Customer email</span>
              <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="jane@example.com" />
            </label>
            <label className="invoice-field">
              <span>Customer phone (optional)</span>
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="080..." />
            </label>
          </div>

          <div className="invoice-items">
            <span style={{ color: 'var(--slate)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em' }}>Items</span>
            {items.map((item, index) => (
              <div className="invoice-item-row" key={index}>
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(event) => updateItem(index, 'description', event.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                />
                <button type="button" className="invoice-remove-btn" onClick={() => removeItemRow(index)} aria-label="Remove item">×</button>
              </div>
            ))}
            <button type="button" className="invoice-add-btn" onClick={addItemRow}>+ Add item</button>
          </div>

          <label className="invoice-field">
            <span>Note (optional)</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </label>

          <div className="invoice-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {error && <div className="invoice-alert error">{error}</div>}
          {success && <div className="invoice-alert success">{success}</div>}

          <button type="submit" className="invoice-btn" disabled={submitting}>
            {submitting ? 'Sending…' : 'Create & send invoice'}
          </button>
        </form>

        <aside className="invoices-card">
          <h4>Past invoices</h4>
          {loadingList ? (
            <div className="invoices-empty">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="invoices-empty">No invoices yet. Create one to send your first customer receipt.</div>
          ) : (
            <div className="invoices-list">
              {invoices.map((invoice) => (
                <div className="invoice-row" key={invoice.id}>
                  <div className="invoice-row-top">
                    <div>
                      <strong>{invoice.customerName}</strong>
                      <div style={{ fontSize: 12, color: 'var(--slate)' }}>{invoice.invoiceNumber} · {formatDate(invoice.createdAt)}</div>
                    </div>
                    <strong>{formatCurrency(invoice.total)}</strong>
                  </div>
                  <span className={`invoice-status ${invoice.status === 'paid' ? 'paid' : ''}`}>{invoice.status}</span>
                  <div className="invoice-row-actions">
                    <button type="button" className="invoice-link-btn" disabled={busyInvoiceId === invoice.id} onClick={() => handleResend(invoice.id)}>
                      Resend
                    </button>
                    <button type="button" className="invoice-link-btn" onClick={() => downloadUrl(invoice.id)}>
                      Download PDF
                    </button>
                    {invoice.status !== 'paid' && (
                      <button type="button" className="invoice-link-btn" disabled={busyInvoiceId === invoice.id} onClick={() => handleMarkPaid(invoice.id)}>
                        Mark as paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
