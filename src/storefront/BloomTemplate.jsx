import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import BloomProductCard from './BloomProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

const trustRow = [
  { icon: 'sparkles', label: 'Gentle formulas' },
  { icon: 'truck', label: 'Freshly packed orders' },
  { icon: 'heart', label: 'Loved by repeat customers' },
];

export default function BloomTemplate(props) {
  const {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    filteredProducts, productCategories, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
    featuredImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading, products,
    formatCurrency, wishlist, isWished, toggleWishlist, addToCart, selectedProduct, setSelectedProduct,
    cart, cartCount, cartSubtotal, cartTotal, deliveryFee, freeShippingThreshold, updateQuantity, removeItem,
    cartOpen, setCartOpen, closeCart, mobileMenuOpen, setMobileMenuOpen,
    customer, updateCustomer, handleCheckout, submittingOrder, orderPlaced, digitalDelivery,
    whatsappEnabled, handleWhatsAppCheckout, couponCode, setCouponCode,
    newsletterEmail, setNewsletterEmail, handleNewsletterSubmit,
    toasts, dismiss,
  } = props;

  return (
    <main className="storefront bloom">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700;800&display=swap');

        .storefront.bloom {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 58%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 36%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 10%, transparent);
          --store-display: 'Cormorant Garamond', Georgia, serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        .bloom .store-footer-col h4 { font-family: var(--store-display); font-size: 16px; font-style: italic; }

        .bloom-announce { background: color-mix(in srgb, var(--store-accent) 16%, var(--store-surface)); color: var(--store-ink); text-align: center; font-size: 12.5px; font-weight: 600; letter-spacing: .02em; padding: 10px 16px; }

        .bloom-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 90%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--store-line); }
        .bloom-header-inner { display: flex; align-items: center; gap: 20px; padding: 16px 0; }
        .bloom-brand { display: flex; align-items: center; gap: 12px; margin-right: auto; min-width: 0; text-decoration: none; }
        .bloom-logo { width: 44px; height: 44px; border-radius: 999px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 700; font-family: var(--store-display); font-size: 18px; overflow: hidden; flex: 0 0 auto; }
        .bloom-logo img { width: 100%; height: 100%; object-fit: cover; }
        .bloom-brand strong { font-family: var(--store-display); font-size: 21px; font-weight: 600; overflow-wrap: anywhere; }
        .bloom-brand span { display: block; color: var(--store-muted); font-size: 12px; margin-top: 1px; }
        .bloom-nav-links { display: flex; gap: 28px; font-size: 13.5px; font-weight: 600; color: var(--store-muted); }
        .bloom-nav-links a:hover { color: var(--store-ink); }
        .bloom-header-actions { display: flex; align-items: center; gap: 6px; }
        .bloom-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-accent) 10%, transparent); border-radius: 999px; padding: 9px 15px; width: 190px; }
        .bloom-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(58,46,44,.32); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 600; }

        .bloom-hero { position: relative; padding: clamp(40px, 7vw, 76px) 0 clamp(36px, 6vw, 60px); overflow: hidden; }
        .bloom-hero::before { content: ''; position: absolute; top: -20%; right: -8%; width: 460px; height: 460px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--store-accent) 30%, transparent) 0%, transparent 70%); pointer-events: none; }
        .bloom-hero::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--store-accent) 18%, transparent) 0%, transparent 70%); pointer-events: none; }
        .bloom-hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .8fr); gap: clamp(28px, 5vw, 60px); align-items: center; }
        .bloom-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 18px; font-family: 'Inter', sans-serif; }
        .bloom-eyebrow::before { content: '✦'; font-size: 11px; }
        .bloom-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-style: italic; font-size: clamp(38px, 5.6vw, 66px); line-height: 1.06; font-weight: 600; }
        .bloom-hero p { margin: 22px 0 0; color: var(--store-muted); font-size: 16.5px; line-height: 1.7; max-width: 460px; }
        .bloom-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); padding: 15px 26px; font-weight: 700; font-size: 14px; text-decoration: none; transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--store-button) 55%, transparent); }
        .store-cta.secondary { background: transparent; color: var(--store-ink); border: 1.5px solid var(--store-line); }
        .store-cta.secondary:hover { border-color: var(--store-ink); }
        .store-cta.block { width: 100%; }
        .whatsapp-cta { background: #25D366; color: #fff; margin-top: 4px; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
        .bloom-hero-art { position: relative; aspect-ratio: 1 / 1; }
        .bloom-hero-frame { position: absolute; inset: 6%; border-radius: 50% 50% 46% 54% / 54% 46% 54% 46%; overflow: hidden; box-shadow: 0 30px 60px -24px rgba(58,46,44,.28); background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); }
        .bloom-hero-frame img { width: 100%; height: 100%; object-fit: cover; }
        .bloom-hero-tag { position: absolute; bottom: 6%; right: -4%; background: var(--store-card); border-radius: 20px; padding: 14px 18px; box-shadow: 0 16px 34px -16px rgba(58,46,44,.3); display: flex; align-items: center; gap: 10px; }
        .bloom-hero-tag b { display: block; font-size: 14px; }
        .bloom-hero-tag span { display: block; color: var(--store-muted); font-size: 11px; }

        .bloom-trust { border-top: 1px solid var(--store-line); border-bottom: 1px solid var(--store-line); }
        .bloom-trust ul { max-width: 1180px; margin: 0 auto; width: min(1180px, calc(100% - 40px)); padding: 20px 0; list-style: none; display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
        .bloom-trust li { display: flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 600; color: var(--store-muted); }
        .bloom-trust svg { color: var(--store-accent); }

        .bloom-products { padding: clamp(40px, 6vw, 68px) 0 60px; }
        .bloom-section-head { text-align: center; margin-bottom: 30px; }
        .bloom-section-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-style: italic; font-size: clamp(28px, 4vw, 42px); font-weight: 600; }
        .bloom-section-head p { margin: 10px auto 0; color: var(--store-muted); max-width: 440px; }
        .bloom-filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 20px; }
        .bloom-filter-pill { padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1.5px solid var(--store-line); background: var(--store-card); color: var(--store-muted); transition: all .15s ease; }
        .bloom-filter-pill:hover, .bloom-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); }

        .bloom-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px; }
        .bloom-card { min-width: 0; }
        .bloom-card-media { position: relative; aspect-ratio: 1 / 1.05; border-radius: 28px; overflow: hidden; background: var(--store-card); cursor: pointer; }
        .bloom-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .bloom-card-media:hover img { transform: scale(1.06); }
        .bloom-badge { position: absolute; top: 12px; left: 12px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; padding: 5px 11px; border-radius: 999px; background: var(--store-card); color: var(--store-ink); z-index: 2; }
        .bloom-badge.low { background: var(--store-accent); color: var(--store-accent-text); }
        .bloom-badge.out { background: color-mix(in srgb, var(--store-ink) 80%, transparent); color: var(--store-surface); }
        .bloom-wish { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.9); border: 0; display: flex; align-items: center; justify-content: center; color: var(--store-ink); transition: transform .15s ease; z-index: 2; }
        .bloom-wish:hover { transform: scale(1.08); }
        .bloom-wish.active { color: #B5544A; }
        .bloom-wish.active svg { fill: #B5544A; }
        .bloom-card-body { padding: 16px 4px 0; text-align: center; }
        .bloom-card-cat { margin: 0 0 4px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--store-faint); }
        .bloom-card-name { margin: 0 0 8px; font-family: var(--store-display); font-size: 18px; font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
        .bloom-card-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .bloom-card-price { font-weight: 700; font-size: 14.5px; }
        .bloom-card-add { width: 32px; height: 32px; border-radius: 50%; border: 0; background: var(--store-button); color: var(--store-button-text); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bloom-card-add:hover:not(:disabled) { background: var(--store-accent); color: var(--store-accent-text); }
        .bloom-card-add:disabled { opacity: .5; cursor: not-allowed; }
        .store-empty { grid-column: 1 / -1; border: 1.5px dashed var(--store-line); border-radius: 24px; padding: 44px 18px; text-align: center; color: var(--store-muted); }

        .store-newsletter { padding: 20px 0 66px; }
        .store-newsletter-inner { background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); border-radius: 32px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; text-align: left; }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-style: italic; font-size: 26px; margin: 0 0 6px; font-weight: 600; }
        .store-newsletter-inner p { margin: 0; color: var(--store-muted); font-size: 14px; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 13px 18px; border-radius: 999px; border: 1.5px solid var(--store-line); background: var(--store-surface); min-width: 220px; font-size: 14px; outline: none; }
        .store-newsletter-form input:focus { border-color: var(--store-accent); }
        .store-newsletter-form button { border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); padding: 13px 22px; font-weight: 700; font-size: 14px; }

        @media (max-width: 980px) {
          .bloom-hero-grid { grid-template-columns: 1fr; }
          .bloom-hero-art { order: -1; max-width: 380px; margin: 0 auto; }
          .bloom-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .bloom-nav-links { display: none; }
          .bloom-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .bloom-card-media { border-radius: 22px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; text-align: left; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
          .bloom-hero-tag { display: none; }
        }
      `}</style>

      {copy.announcement && <div className="bloom-announce">{copy.announcement}</div>}

      <header className="bloom-header">
        <div className="store-wrap bloom-header-inner">
          <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <StoreIcon name="menu" size={20} />
          </button>
          <a className="bloom-brand" href="#top">
            <span className="bloom-logo">
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
            </span>
            <span>
              <strong>{store.businessName}</strong>
              <span>{[store.city, store.state].filter(Boolean).join(', ') || businessTypeLabel}</span>
            </span>
          </a>
          <nav className="bloom-nav-links only-desktop" aria-label="Store navigation">
            <a href="#shop">Shop</a>
            <a href="#footer">Contact</a>
          </nav>
          <div className="bloom-header-actions">
            <label className="bloom-search only-desktop">
              <StoreIcon name="search" size={15} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" />
            </label>
            <button className="icon-btn" type="button" aria-label="Wishlist">
              <StoreIcon name="heart" size={19} />
              {wishlist.length > 0 && <span className="icon-dot">{wishlist.length}</span>}
            </button>
            <button className="icon-btn" type="button" aria-label="Open cart" onClick={() => setCartOpen(true)}>
              <StoreIcon name="bag" size={19} />
              {cartCount > 0 && <span className="icon-dot">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
        <div className="mobile-menu-panel">
          <button className="icon-btn" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><StoreIcon name="close" size={20} /></button>
          <label className="bloom-search">
            <StoreIcon name="search" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" />
          </label>
          <nav>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>

      <section className="bloom-hero" id="top">
        <div className="store-wrap bloom-hero-grid">
          <div>
            <span className="bloom-eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline}</h1>
            <p>{heroSubtext}</p>
            <div className="bloom-hero-ctas">
              <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
              {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
          </div>
          <div className="bloom-hero-art">
            <div className="bloom-hero-frame">{featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}</div>
            <div className="bloom-hero-tag">
              <StoreIcon name="sparkles" size={17} />
              <div>
                <b>{products.length || 'New'} products</b>
                <span>Ready to order</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bloom-trust" aria-label="Store benefits">
        <ul>
          {trustRow.map((item) => (
            <li key={item.label}><StoreIcon name={item.icon} size={16} /> {item.label}</li>
          ))}
        </ul>
      </section>

      <section className="bloom-products" id="shop">
        <div className="store-wrap">
          <div className="bloom-section-head">
            <h2>{copy.productsHeading}</h2>
            <p>{productsSubheading}</p>
            <div className="bloom-filters" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`bloom-filter-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="bloom-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <BloomProductCard
                key={productKey(product)}
                product={product}
                categoryLabel={businessTypeLabel}
                isWished={isWished(product)}
                addLabel={copy.addToCartLabel}
                formatCurrency={formatCurrency}
                onSelect={() => setSelectedProduct(product)}
                onAddToCart={() => addToCart(product)}
                onToggleWish={() => toggleWishlist(product)}
              />
            )) : (
              <div className="store-empty">{products.length ? 'No products match this search yet.' : 'No products have been published yet.'}</div>
            )}
          </div>
        </div>
      </section>

      <section className="store-newsletter">
        <div className="store-wrap store-newsletter-inner">
          <div>
            <h2>Stay in bloom</h2>
            <p>Product drops, restocks, and small notes from {store.businessName}.</p>
          </div>
          <form className="store-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="you@example.com" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      <div id="footer">
        <StoreFooter store={store} footerText={footerText} visibleSocialLinks={visibleSocialLinks} businessTypeLabel={businessTypeLabel} />
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        cart={cart}
        cartCount={cartCount}
        cartSubtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        cartTotal={cartTotal}
        freeShippingThreshold={freeShippingThreshold}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        customer={customer}
        onCustomerChange={updateCustomer}
        onSubmit={handleCheckout}
        submitting={submittingOrder}
        orderPlaced={orderPlaced}
        digitalDelivery={digitalDelivery}
        onContinueShopping={closeCart}
        checkoutLabel={copy.checkoutLabel}
        formatCurrency={formatCurrency}
        whatsappEnabled={whatsappEnabled}
        onWhatsAppCheckout={handleWhatsAppCheckout}
        couponCode={couponCode}
        onCouponCodeChange={setCouponCode}
      />

      <ProductDetail
        product={selectedProduct}
        categoryLabel={businessTypeLabel}
        deliveryFee={deliveryFee}
        isWished={selectedProduct ? isWished(selectedProduct) : false}
        addLabel={copy.addToCartLabel}
        formatCurrency={formatCurrency}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(quantity) => addToCart(selectedProduct, quantity)}
        onToggleWish={() => toggleWishlist(selectedProduct)}
        storeSlug={store.storeSlug}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
