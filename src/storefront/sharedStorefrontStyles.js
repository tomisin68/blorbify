export const sharedStorefrontStyles = `
  .storefront * { box-sizing: border-box; }
  .storefront :where(button, input, textarea, a) { font: inherit; color: inherit; }
  .storefront button { cursor: pointer; }
  .storefront img { max-width: 100%; display: block; }
  .store-wrap { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
  .icon-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: 0; background: transparent; transition: background .15s ease; }
  .icon-btn:hover { background: color-mix(in srgb, var(--store-ink) 6%, transparent); }
  .icon-dot { position: absolute; top: -1px; right: -1px; background: var(--store-accent); color: var(--store-accent-text); font-size: 10px; font-weight: 800; min-width: 17px; height: 17px; border: 2px solid var(--store-surface); border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }
  .only-mobile { display: none; }
  .qty-stepper { display: inline-flex; align-items: center; border: 1.5px solid var(--store-line); border-radius: 999px; overflow: hidden; }
  .qty-stepper button { width: 26px; height: 26px; border: 0; background: none; display: flex; align-items: center; justify-content: center; }
  .qty-stepper button:hover { background: var(--store-card); }
  .qty-stepper b { width: 22px; text-align: center; font-size: 12.5px; }

  .cart-drawer { position: fixed; inset: 0; z-index: 120; pointer-events: none; }
  .cart-drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.36); opacity: 0; transition: opacity .3s ease; }
  .cart-drawer-panel { position: absolute; top: 0; right: 0; bottom: 0; width: 420px; max-width: 92vw; background: var(--store-surface); display: flex; flex-direction: column; min-height: 0; overflow: hidden; transform: translateX(100%); transition: transform .35s cubic-bezier(.4,0,.2,1); }
  .cart-drawer.open { pointer-events: auto; }
  .cart-drawer.open .cart-drawer-overlay { opacity: 1; }
  .cart-drawer.open .cart-drawer-panel { transform: translateX(0); }
  .cart-drawer-head { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 20px 22px; border-bottom: 1px solid var(--store-line); }
  .cart-drawer-head h3 { display: flex; align-items: center; gap: 9px; margin: 0; font-size: 17px; font-weight: 700; }
  .cart-drawer-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; }
  .cart-drawer-items { flex: 0 0 auto; padding: 6px 22px; }
  .cart-drawer-empty { flex: 1 1 auto; min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--store-muted); padding: 40px; text-align: center; }
  .cart-row { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--store-line); }
  .cart-row-img { width: 68px; height: 68px; border-radius: 12px; overflow: hidden; background: var(--store-card); flex-shrink: 0; }
  .cart-row-img img { width: 100%; height: 100%; object-fit: cover; }
  .cart-row-info { flex: 1; min-width: 0; }
  .cart-row-name { margin: 0 0 3px; font-weight: 700; font-size: 13.5px; overflow-wrap: anywhere; }
  .cart-row-price { margin: 0 0 8px; color: var(--store-muted); font-size: 12px; }
  .cart-row-controls { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .cart-row-total { font-weight: 800; font-size: 13px; }
  .cart-row-remove { align-self: flex-start; background: none; border: 0; color: var(--store-muted); padding: 4px; }
  .cart-row-remove:hover { color: #C4432B; }
  .cart-drawer-foot { flex: 0 0 auto; margin-top: auto; padding: 16px 22px 22px; border-top: 1px solid var(--store-line); background: var(--store-surface); }
  .ship-progress { padding-bottom: 14px; }
  .ship-progress-msg { display: flex; align-items: center; gap: 8px; font-size: 12.5px; margin-bottom: 8px; }
  .ship-progress-track { height: 6px; border-radius: 999px; background: var(--store-line); overflow: hidden; }
  .ship-progress-fill { height: 100%; background: var(--store-accent); border-radius: 999px; transition: width .4s ease; }
  .cart-totals { display: grid; gap: 7px; margin-bottom: 14px; }
  .cart-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--store-muted); font-weight: 700; }
  .cart-total-row.grand { font-size: 16px; color: var(--store-ink); font-weight: 800; }
  .cart-checkout-form { display: grid; gap: 9px; }
  .cart-checkout-form input, .cart-checkout-form textarea { width: 100%; padding: 11px 13px; border: 1.5px solid var(--store-line); border-radius: 12px; background: var(--store-card); outline: none; }
  .cart-checkout-form textarea { min-height: 62px; resize: vertical; }
  .cart-checkout-form input:focus, .cart-checkout-form textarea:focus { border-color: var(--store-accent); }
  .cart-success { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 28px; gap: 6px; overflow-y: auto; }
  .cart-success-badge { width: 60px; height: 60px; border-radius: 50%; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; margin-bottom: 10px; }
  .cart-success h4 { color: inherit; margin: 0; font-family: var(--store-display); font-size: 22px; }
  .cart-success p { margin: 8px 0 20px; color: var(--store-muted); font-size: 14px; line-height: 1.55; }

  .pdetail-modal { position: fixed; inset: 0; z-index: 140; display: grid; place-items: center; padding: 24px; }
  .pdetail-overlay { position: absolute; inset: 0; background: rgba(10,14,16,.5); }
  .pdetail-panel { position: relative; z-index: 1; width: min(960px, 100%); max-height: min(760px, calc(100vh - 48px)); overflow: auto; background: var(--store-surface); border-radius: 24px; box-shadow: 0 40px 90px -24px rgba(0,0,0,.4); display: grid; grid-template-columns: minmax(280px, .95fr) minmax(0, 1fr); gap: 30px; padding: 26px; animation: modalIn .25s cubic-bezier(.22,1,.36,1); }
  @keyframes modalIn { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .pdetail-close { position: absolute; top: 16px; right: 16px; z-index: 2; width: 38px; height: 38px; border-radius: 50%; border: 0; background: var(--store-card); display: grid; place-items: center; }
  .pdetail-gallery { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
  .pdetail-media { border-radius: 18px; overflow: hidden; background: var(--store-card); min-height: 380px; flex: 1 1 auto; }
  .pdetail-media img { width: 100%; height: 100%; object-fit: cover; }
  .pdetail-thumbs { display: flex; gap: 8px; flex-wrap: wrap; flex: 0 0 auto; }
  .pdetail-thumb { width: 56px; height: 56px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; padding: 0; opacity: .6; flex: 0 0 auto; }
  .pdetail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pdetail-thumb:hover { opacity: .85; }
  .pdetail-thumb.active { border-color: var(--store-accent); opacity: 1; }
  .pdetail-copy { padding: 10px 8px 4px 0; }
  .pdetail-eyebrow { display: inline-block; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: var(--store-accent); margin-bottom: 10px; }
  .pdetail-copy h2 { color: inherit; margin: 0 0 12px; font-family: var(--store-display); font-size: clamp(26px, 4vw, 38px); font-weight: 600; line-height: 1.05; }
  .pdetail-price { font-weight: 800; font-size: 19px; margin-bottom: 16px; }
  .pdetail-desc { color: var(--store-muted); line-height: 1.7; margin: 0 0 18px; }
  .pdetail-meta { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-bottom: 18px; }
  .pdetail-meta div { border: 1px solid var(--store-line); border-radius: 14px; padding: 12px; background: var(--store-card); }
  .pdetail-meta span { display: block; color: var(--store-faint); font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; }
  .pdetail-meta b { display: block; margin-top: 4px; font-size: 13.5px; }
  .pdetail-qty { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; font-weight: 700; font-size: 13px; }
  .pdetail-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  .store-footer { border-top: 1px solid var(--store-line); padding: 48px 0 24px; }
  .store-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 36px; padding-bottom: 32px; border-bottom: 1px solid var(--store-line); }
  .store-footer-mark { width: 40px; height: 40px; border-radius: 10px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 800; overflow: hidden; margin-bottom: 10px; }
  .store-footer-mark img { width: 100%; height: 100%; object-fit: cover; }
  .store-footer-brand strong { display: block; font-family: var(--store-display); font-size: 17px; margin-bottom: 8px; }
  .store-footer-brand p { margin: 0 0 14px; color: var(--store-muted); font-size: 13.5px; line-height: 1.6; max-width: 300px; }
  .store-footer-socials { display: flex; gap: 8px; }
  .store-footer-socials a { width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--store-line); display: grid; place-items: center; color: var(--store-ink); }
  .store-footer-socials a:hover { background: var(--store-ink); color: var(--store-surface); border-color: var(--store-ink); }
  .store-footer-col h4 { font-size: 12.5px; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 14px; color: var(--store-muted); }
  .store-footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; }
  .store-footer-col a { color: var(--store-muted); text-decoration: none; }
  .store-footer-col a:hover { color: var(--store-ink); }
  .store-footer-bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 20px; font-size: 12.5px; color: var(--store-muted); flex-wrap: wrap; }
  .store-footer-made { color: var(--store-muted); text-decoration: none; }
  .store-footer-made strong { color: var(--store-ink); }
  .store-footer-made:hover { color: var(--store-ink); }

  @media (max-width: 680px) {
    .cart-drawer-panel { width: 100%; max-width: 100%; }
  }
`;
