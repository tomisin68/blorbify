import React, { useState } from 'react';

export default function LaunchStore({ formData, onBack, onComplete, loading }) {
  const [agreed, setAgreed] = useState(false);
  const storeUrl = `https://${formData.storeSlug || 'your-store'}.blorbify.com`;

  return (
    <div className="onboarding-screen">
      <style>{`
        .onboarding-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(120% 100% at 15% 0%, #223038 0%, #192328 55%, #0F1518 100%); font-family: 'Raleway', sans-serif; }
        .onboarding-card { width: 100%; max-width: 520px; background: #0F1518; color: #F6F8F1; border: 1px solid rgba(255,255,255,0.09); border-radius: 24px; padding: 36px 32px; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .step-label { color: #AFFF00; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
        .title { font-size: 28px; margin: 0 0 8px; }
        .subtitle { color: #93A2A6; margin: 0 0 24px; line-height: 1.5; }
        .summary { background: #233038; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .summary-item:last-child { border-bottom: none; }
        .summary-label { color: #93A2A6; }
        .summary-value { font-weight: 700; }
        .actions { display: flex; gap: 12px; margin-top: 10px; }
        .btn { flex: 1; padding: 14px 16px; border-radius: 999px; border: none; cursor: pointer; font-weight: 700; }
        .btn-primary { background: #AFFF00; color: #192328; }
        .btn-secondary { background: transparent; color: #F6F8F1; border: 1px solid rgba(255,255,255,0.14); }
        .check-row { display: flex; align-items: flex-start; gap: 10px; margin: 16px 0; color: #93A2A6; font-size: 14px; }
        .check-row input { margin-top: 2px; accent-color: #AFFF00; }
      `}</style>

      <div className="onboarding-card">
        <div className="step-label">Step 4 / 4</div>
        <h2 className="title">You’re ready to launch</h2>
        <p className="subtitle">Review your setup and launch your store online.</p>

        <div className="summary">
          <div className="summary-item">
            <span className="summary-label">Store name</span>
            <span className="summary-value">{formData.businessName || 'Not set'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Store URL</span>
            <span className="summary-value">{storeUrl}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Template</span>
            <span className="summary-value">{formData.template || 'minimal'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Products</span>
            <span className="summary-value">{(formData.products || []).filter((product) => product.name).length}</span>
          </div>
        </div>

        <label className="check-row">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>I’m ready to publish my store and save these details to Firestore.</span>
        </label>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
          <button type="button" className="btn btn-primary" onClick={() => agreed && onComplete()} disabled={loading || !agreed}>
            {loading ? 'Saving...' : 'Launch store'}
          </button>
        </div>
      </div>
    </div>
  );
}
