import { useState } from 'react';
import { requestFinancialReport } from './backendApi';

function formatNairaFromKobo(value) {
  const amount = Number(value || 0) / 100;
  return `NGN ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function presetRange(preset) {
  const now = new Date();
  if (preset === 'this-month') {
    return { start: startOfMonth(now), end: now };
  }
  if (preset === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end };
  }
  // last-30-days
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end: now };
}

export default function ReportsPanel({ user }) {
  const initial = presetRange('this-month');
  const [startDate, setStartDate] = useState(toDateInputValue(initial.start));
  const [endDate, setEndDate] = useState(toDateInputValue(initial.end));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const applyPreset = (preset) => {
    const range = presetRange(preset);
    setStartDate(toDateInputValue(range.start));
    setEndDate(toDateInputValue(range.end));
  };

  const handleRequest = async () => {
    setError('');
    setSummary(null);

    if (!startDate || !endDate) {
      setError('Choose a start and end date.');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await requestFinancialReport(
        { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() },
        token
      );
      setSummary(response?.data?.summary || null);
    } catch (requestError) {
      setError(requestError?.message || 'Could not generate the report.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.uid) {
    return (
      <div className="reports-panel">
        <div className="reports-empty">Sign in to request financial reports.</div>
      </div>
    );
  }

  return (
    <div className="reports-panel">
      <style>{`
        .reports-panel {
          display: grid;
          gap: 16px;
        }
        .reports-card {
          border-radius: 8px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .reports-presets {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .reports-preset-btn {
          border: 1px solid var(--line);
          background: transparent;
          border-radius: 999px;
          padding: 7px 14px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          color: var(--ink);
        }
        .reports-range {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .reports-field {
          display: grid;
          gap: 6px;
        }
        .reports-field span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .reports-field input {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 11px 12px;
          font: inherit;
          font-size: 14px;
        }
        .reports-btn {
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
        .reports-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .reports-alert {
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 700;
          color: #9d2525;
          background: rgba(255,107,107,.1);
          border: 1px solid rgba(255,107,107,.24);
        }
        .reports-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        .reports-summary-tile {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 14px;
          display: grid;
          gap: 4px;
        }
        .reports-summary-tile span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .reports-summary-tile strong {
          font-size: 18px;
        }
        .reports-empty {
          border: 1px dashed var(--line);
          border-radius: 8px;
          padding: 28px 18px;
          text-align: center;
          color: var(--slate);
          line-height: 1.6;
        }
      `}</style>

      <div className="reports-card">
        <h4 style={{ margin: 0, fontSize: 18 }}>Request a financial report</h4>
        <p style={{ margin: 0, color: 'var(--slate)', fontSize: 13, lineHeight: 1.55 }}>
          Pick a date range and we'll email you a CSV breakdown, plus show the summary below.
        </p>

        <div className="reports-presets">
          <button type="button" className="reports-preset-btn" onClick={() => applyPreset('this-month')}>This month</button>
          <button type="button" className="reports-preset-btn" onClick={() => applyPreset('last-month')}>Last month</button>
          <button type="button" className="reports-preset-btn" onClick={() => applyPreset('last-30-days')}>Last 30 days</button>
        </div>

        <div className="reports-range">
          <label className="reports-field">
            <span>Start date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="reports-field">
            <span>End date</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        {error && <div className="reports-alert">{error}</div>}

        <button type="button" className="reports-btn" disabled={loading} onClick={handleRequest}>
          {loading ? 'Generating…' : 'Request report'}
        </button>
      </div>

      {summary && (
        <div className="reports-card">
          <h4 style={{ margin: 0, fontSize: 16 }}>{summary.rangeLabel}</h4>
          <div className="reports-summary">
            <div className="reports-summary-tile">
              <span>Gross sales</span>
              <strong>{formatNairaFromKobo(summary.grossSales)}</strong>
            </div>
            <div className="reports-summary-tile">
              <span>Refunds</span>
              <strong>{formatNairaFromKobo(summary.refundsTotal)}</strong>
            </div>
            <div className="reports-summary-tile">
              <span>Net revenue</span>
              <strong>{formatNairaFromKobo(summary.netRevenue)}</strong>
            </div>
            <div className="reports-summary-tile">
              <span>Orders</span>
              <strong>{summary.orderCount}</strong>
            </div>
          </div>
          <p style={{ margin: 0, color: 'var(--slate)', fontSize: 12 }}>A CSV copy has also been emailed to you.</p>
        </div>
      )}
    </div>
  );
}
