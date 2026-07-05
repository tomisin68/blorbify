import { useEffect, useMemo, useState } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Blorbify 👋',
    body: "Let's take a quick tour of your dashboard so you know exactly where everything lives. It only takes a minute.",
  },
  {
    id: 'brand',
    selector: '[data-tour="brand"]',
    tab: 'overview',
    inSidebar: true,
    placement: 'right',
    title: 'Your command center',
    body: 'Everything about your store — products, orders, money, and design — lives in this dashboard.',
  },
  {
    id: 'nav-overview',
    selector: '[data-tour="nav-overview"]',
    tab: 'overview',
    inSidebar: true,
    placement: 'right',
    title: 'Overview',
    body: 'Your home base — a quick snapshot of how the store is doing.',
  },
  {
    id: 'stats',
    selector: '[data-tour="stats-grid"]',
    tab: 'overview',
    placement: 'bottom',
    title: 'Store stats',
    body: 'Revenue, orders, customers, and products — updated live as things happen.',
  },
  {
    id: 'store-link',
    selector: '[data-tour="store-link"]',
    tab: 'overview',
    placement: 'bottom',
    title: 'Your storefront',
    body: 'This is the live link customers use to shop. Tap it to preview your store, or copy and share it anywhere.',
  },
  {
    id: 'nav-products',
    selector: '[data-tour="nav-products"]',
    tab: 'products',
    inSidebar: true,
    placement: 'right',
    title: 'Products',
    body: 'Add products, set prices and stock, and upload photos.',
  },
  {
    id: 'products-card',
    selector: '[data-tour="products-card"]',
    tab: 'products',
    placement: 'left',
    title: 'Add your products',
    body: 'Build your catalog here — name it, price it, and it shows up on your storefront instantly.',
  },
  {
    id: 'nav-orders',
    selector: '[data-tour="nav-orders"]',
    tab: 'orders',
    inSidebar: true,
    placement: 'right',
    title: 'Orders',
    body: 'Every order placed on your storefront lands here, ready for you to confirm and fulfill.',
  },
  {
    id: 'nav-appearance',
    selector: '[data-tour="nav-appearance"]',
    tab: 'appearance',
    inSidebar: true,
    placement: 'right',
    title: 'Appearance',
    body: 'Pick a template, set your colors, and upload your logo and banner — no code needed.',
  },
  {
    id: 'nav-analytics',
    selector: '[data-tour="nav-analytics"]',
    tab: 'analytics',
    inSidebar: true,
    placement: 'right',
    title: 'Analytics',
    body: "Dig into sales trends and see what's actually driving revenue.",
  },
  {
    id: 'nav-payouts',
    selector: '[data-tour="nav-payouts"]',
    tab: 'payouts',
    inSidebar: true,
    placement: 'right',
    title: 'Payouts',
    body: 'Set up how and where you get paid for your sales.',
  },
  {
    id: 'nav-invoices',
    selector: '[data-tour="nav-invoices"]',
    inSidebar: true,
    placement: 'right',
    title: 'Invoices, billing & reports',
    body: "Further down you'll find invoicing, your subscription billing, and downloadable reports for bookkeeping.",
  },
  {
    id: 'account',
    selector: '[data-tour="account"]',
    inSidebar: true,
    placement: 'right',
    title: 'Your account',
    body: 'Your profile and a quick way to log out, right at the bottom of the menu.',
  },
  {
    id: 'restart',
    selector: '[data-tour="tour-trigger"]',
    placement: 'left',
    title: 'Come back anytime',
    body: 'Forgot something? Click this button whenever you want to replay the tour.',
  },
];

const HAND_BY_PLACEMENT = {
  right: '👈',
  left: '👉',
  top: '👇',
  bottom: '👆',
};

function getRouteForTab(tab) {
  return tab === 'overview' ? '/dashboard' : `/dashboard/${tab}`;
}

export default function DashboardTour({ navigate, setSidebarOpen, onFinish }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;

  useEffect(() => {
    if (step.tab) {
      navigate(getRouteForTab(step.tab));
    }
    setSidebarOpen(Boolean(step.inSidebar));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    let raf;
    let cancelled = false;
    let scrolled = false;
    const tick = () => {
      if (cancelled) return;
      const el = step.selector ? document.querySelector(step.selector) : null;
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          scrolled = true;
        }
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onFinish();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onFinish]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const cardWidth = isMobile ? Math.min(340, window.innerWidth - 32) : 320;
  const cardHeight = 190;

  const cardPosition = useMemo(() => {
    const margin = 18;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (isMobile) {
      return { top: vh - cardHeight - 20, left: (vw - cardWidth) / 2 };
    }

    if (!rect) {
      return { top: vh / 2 - cardHeight / 2, left: vw / 2 - cardWidth / 2 };
    }

    let top;
    let left;
    switch (step.placement) {
      case 'right':
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.right + margin;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.left - cardWidth - margin;
        break;
      case 'top':
        top = rect.top - cardHeight - margin;
        left = rect.left + rect.width / 2 - cardWidth / 2;
        break;
      case 'bottom':
      default:
        top = rect.bottom + margin;
        left = rect.left + rect.width / 2 - cardWidth / 2;
    }
    top = Math.min(Math.max(top, margin), vh - cardHeight - margin);
    left = Math.min(Math.max(left, margin), vw - cardWidth - margin);
    return { top, left };
  }, [rect, step.placement, isMobile, cardWidth]);

  const goNext = () => {
    if (stepIndex === total - 1) {
      onFinish();
    } else {
      setStepIndex((value) => value + 1);
    }
  };
  const goBack = () => setStepIndex((value) => Math.max(0, value - 1));

  const pad = 10;
  const hand = rect && !isMobile ? HAND_BY_PLACEMENT[step.placement] || null : null;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Dashboard tour">
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}

      <div className="tour-card" style={{ top: cardPosition.top, left: cardPosition.left, width: cardWidth }}>
        {hand && <div className={`tour-hand tour-hand-${step.placement}`}>{hand}</div>}
        <div className="tour-progress">
          Step {stepIndex + 1} of {total}
        </div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={onFinish}>
            Skip tour
          </button>
          <div className="tour-nav-buttons">
            {stepIndex > 0 && (
              <button type="button" className="tour-back" onClick={goBack}>
                Back
              </button>
            )}
            <button type="button" className="tour-next" onClick={goNext}>
              {stepIndex === total - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .tour-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          pointer-events: auto;
        }
        .tour-spotlight {
          position: fixed;
          border-radius: 14px;
          box-shadow: 0 0 0 9999px rgba(15, 21, 24, .62);
          border: 2px solid #afff00;
          transition: top .35s ease, left .35s ease, width .35s ease, height .35s ease;
          pointer-events: none;
        }
        .tour-card {
          position: fixed;
          background: #192328;
          color: #f6f8f1;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,.4);
          font-family: Raleway, system-ui, sans-serif;
          transition: top .35s ease, left .35s ease;
          box-sizing: border-box;
        }
        .tour-progress {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #afff00;
          margin-bottom: 6px;
        }
        .tour-card h4 {
          margin: 0 0 8px;
          font-size: 17px;
        }
        .tour-card p {
          margin: 0 0 16px;
          font-size: 13.5px;
          line-height: 1.5;
          color: rgba(246,248,241,.82);
        }
        .tour-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tour-skip {
          background: none;
          border: none;
          color: rgba(246,248,241,.6);
          font-size: 12.5px;
          cursor: pointer;
          padding: 6px 0;
        }
        .tour-skip:hover { color: #fff; }
        .tour-nav-buttons { display: flex; gap: 8px; }
        .tour-back, .tour-next {
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(246,248,241,.25);
          background: transparent;
          color: #f6f8f1;
        }
        .tour-next {
          background: #afff00;
          border-color: #afff00;
          color: #192328;
        }
        .tour-back:hover { background: rgba(246,248,241,.1); }
        .tour-next:hover { filter: brightness(1.05); }
        .tour-hand {
          position: absolute;
          font-size: 22px;
        }
        .tour-hand-right { left: -30px; top: 50%; transform: translateY(-50%); animation: tour-bounce-x 1.1s ease-in-out infinite; }
        .tour-hand-left { right: -30px; top: 50%; transform: translateY(-50%); animation: tour-bounce-x 1.1s ease-in-out infinite reverse; }
        .tour-hand-top { bottom: -32px; left: 50%; transform: translateX(-50%); animation: tour-bounce-y 1.1s ease-in-out infinite; }
        .tour-hand-bottom { top: -32px; left: 50%; transform: translateX(-50%); animation: tour-bounce-y 1.1s ease-in-out infinite reverse; }
        @keyframes tour-bounce-x {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-50%) translateX(-6px); }
        }
        @keyframes tour-bounce-y {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
