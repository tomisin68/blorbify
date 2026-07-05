import { useState } from 'react';
import { IconRocket, IconArrowLeft, IconCheck } from './onboardingIcons';
import { createStoreSlug, getStoreUrl } from './storeLinks';

export default function LaunchStore({ formData, onBack, onComplete, loading }) {
  const [agreed, setAgreed] = useState(false);
  const [checkboxError, setCheckboxError] = useState(false);
  const [toast, setToast] = useState(null);
  const slug = createStoreSlug(formData.businessName || formData.storeSlug || 'your-store');
  const storeUrl = getStoreUrl(slug);

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3200);
  };

  const handleLaunchClick = () => {
    if (!agreed) {
      setCheckboxError(true);
      showToast('Please tick the checkbox to confirm before opening your dashboard.');
      return;
    }
    onComplete();
  };

  return (
    <div className="onboarding-screen">
      <style>{`
        .onboarding-screen { display: flex; align-items: center; justify-content: center; padding: 6px; font-family: 'Raleway', sans-serif; }
        .onboarding-card { width: 100%; max-width: 560px; background: linear-gradient(180deg, #fff, #f8fbeb); color: #192328; border: 1px solid rgba(25,35,40,0.08); border-radius: 24px; padding: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.08); }
        .step-label { display: inline-flex; align-items: center; gap: 8px; color: #192328; background: rgba(175,255,0,0.18); padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 14px; text-transform: uppercase; }
        .title { font-size: clamp(22px, 2.5vw, 28px); margin: 0 0 8px; }
        .subtitle { color: #5C6B6E; margin: 0 0 18px; line-height: 1.6; }
        .summary { background: rgba(25,35,40,0.03); border-radius: 16px; padding: 14px; margin-bottom: 14px; }
        .summary-item { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(25,35,40,0.08); }
        .summary-item:last-child { border-bottom: none; }
        .summary-label { color: #5C6B6E; }
        .summary-value { font-weight: 700; text-align: right; }
        .actions { display: flex; gap: 12px; margin-top: 10px; }
        .btn { flex: 1; padding: 13px 16px; border-radius: 999px; border: none; cursor: pointer; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary { background: #AFFF00; color: #192328; box-shadow: 0 10px 24px rgba(175,255,0,0.22); }
        .btn-secondary { background: transparent; color: #192328; border: 1px solid rgba(25,35,40,0.12); }
        .check-row { display: flex; align-items: flex-start; gap: 10px; margin: 16px 0; padding: 8px 10px; border-radius: 12px; color: #5C6B6E; font-size: 14px; border: 1px solid transparent; transition: border-color 0.2s ease, background 0.2s ease; }
        .check-row input { margin-top: 2px; accent-color: #AFFF00; }
        .check-row.error { border-color: rgba(220,53,69,0.4); background: rgba(220,53,69,0.06); animation: shake 0.32s ease; }
        .check-row.error span { color: #A52828; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #192328; color: #F6F8F1; padding: 12px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; box-shadow: 0 12px 30px rgba(0,0,0,0.25); z-index: 50; animation: toastIn 0.25s ease; max-width: 90vw; text-align: center; }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @media (max-width: 580px) { .onboarding-card { padding: 18px; } .actions { flex-direction: column-reverse; } .btn { width: 100%; } }
      `}</style>

      {toast && <div className="toast" role="status">{toast}</div>}

      <div className="onboarding-card">
        <div className="step-label"><IconRocket size={14} /> Step 3 / 3</div>
        <h2 className="title">You’re ready to launch</h2>
        <p className="subtitle">Review your setup and save your store profile. You can add products later from your dashboard.</p>

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
        </div>

        <label className={`check-row${checkboxError ? ' error' : ''}`}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => {
              setAgreed(event.target.checked);
              if (event.target.checked) setCheckboxError(false);
            }}
          />
          <span>I’m ready to save these onboarding details to Firestore and open my dashboard.</span>
        </label>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            <IconArrowLeft size={16} />
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={handleLaunchClick} disabled={loading}>
            {loading ? 'Saving...' : <><IconCheck size={16} /> Open dashboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}
