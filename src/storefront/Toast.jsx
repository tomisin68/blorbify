import { StoreIcon } from './icons';

const typeIconName = {
  success: 'check',
  cart: 'bag',
  wish: 'heart',
  error: 'alert',
  order: 'sparkles',
  info: 'info',
};

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <style>{`
        .toast-stack {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          z-index: 300;
          display: flex;
          flex-direction: column-reverse;
          gap: 10px;
          width: min(380px, calc(100vw - 32px));
        }
        .toast-item {
          display: flex;
          align-items: center;
          gap: 11px;
          background: var(--store-ink, #141B1E);
          color: var(--store-surface, #F6F8F1);
          border-radius: 999px;
          padding: 13px 18px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.28);
          font-size: 13.5px;
          font-weight: 700;
          line-height: 1.35;
          cursor: pointer;
          animation: toastRise 0.32s cubic-bezier(.22,1,.36,1);
        }
        .toast-item.error {
          background: #B5432D;
          color: #fff;
        }
        .toast-item.order {
          background: var(--store-accent, #AFFF00);
          color: var(--store-accent-text, #141B1E);
        }
        .toast-icon { display: inline-flex; flex: 0 0 auto; color: currentColor; }
        @keyframes toastRise {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 520px) {
          .toast-stack { bottom: 16px; }
        }
      `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item ${toast.type}`}
          onClick={() => onDismiss(toast.id)}
        >
          <span className="toast-icon"><StoreIcon name={toast.icon || typeIconName[toast.type] || typeIconName.info} size={17} /></span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
