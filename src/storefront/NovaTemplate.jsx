import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import NovaProductCard from './NovaProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function NovaTemplate(props) {
  const {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    filteredProducts, productCategories, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
    featuredImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading, products,
    formatCurrency, wishlist, isWished, toggleWishlist, addToCart, selectedProduct, setSelectedProduct, productShareUrl,
    cart, cartCount, cartSubtotal, cartTotal, deliveryFee, freeShippingThreshold, updateQuantity, removeItem,
    cartOpen, setCartOpen, closeCart, mobileMenuOpen, setMobileMenuOpen,
    customer, updateCustomer, handleCheckout, submittingOrder, orderPlaced, digitalDelivery,
    whatsappEnabled, handleWhatsAppCheckout, couponCode, setCouponCode,
    newsletterEmail, setNewsletterEmail, handleNewsletterSubmit,
    toasts, dismiss,
  } = props;

  const specRow = [
    { label: 'Delivery', value: 'Same-week' },
    { label: 'Checkout', value: 'Secured' },
    { label: 'Catalog', value: `${products.length || 0} SKUs` },
  ];

  return (
    <main className="storefront nova">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .storefront.nova {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 58%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 36%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 12%, transparent);
          --store-display: 'Space Grotesk', 'Inter', sans-serif;
          --store-mono: 'JetBrains Mono', monospace;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        @media (prefers-reduced-motion: reduce) {
          .storefront.nova *, .storefront.nova *::before, .storefront.nova *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }

        .store-announce { background: var(--store-ink); color: var(--store-surface); text-align: center; font-size: 12px; font-weight: 600; letter-spacing: .02em; padding: 9px 16px; font-family: var(--store-mono); }

        .store-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--store-line); }
        .store-header-inner { display: flex; align-items: center; gap: 20px; padding: 14px 0; }
        .store-brand { display: flex; align-items: center; gap: 11px; margin-right: auto; min-width: 0; text-decoration: none; }
        .store-logo { width: 38px; height: 38px; border-radius: 8px; background: var(--store-ink); color: var(--store-surface); display: grid; place-items: center; font-weight: 700; overflow: hidden; flex: 0 0 auto; }
        .store-logo img { width: 100%; height: 100%; object-fit: cover; }
        .store-brand-text { min-width: 0; }
        .store-brand-text strong { display: block; font-family: var(--store-display); font-size: 17px; font-weight: 600; overflow-wrap: anywhere; }
        .store-brand-text span { display: block; color: var(--store-muted); font-size: 11.5px; margin-top: 1px; font-family: var(--store-mono); }
        .store-nav-links { display: flex; gap: 24px; font-size: 13.5px; font-weight: 600; color: var(--store-muted); }
        .store-nav-links a:hover { color: var(--store-ink); }
        .store-header-actions { display: flex; align-items: center; gap: 6px; }
        .store-search { display: flex; align-items: center; gap: 8px; background: var(--store-card); border: 1px solid var(--store-line); border-radius: 8px; padding: 9px 14px; width: 200px; transition: border-color .2s ease; }
        .store-search:focus-within { border-color: var(--store-accent); }
        .store-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13.5px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.36); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 600; }

        .store-hero { position: relative; padding: clamp(48px, 9vw, 96px) 0 clamp(36px, 6vw, 60px); overflow: hidden; }
        .store-hero-media { position: absolute; inset: 0; z-index: 0; }
        .store-hero-media img { width: 100%; height: 100%; object-fit: cover; }
        .store-hero-media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--store-surface) 30%, transparent) 0%, var(--store-surface) 92%); }
        .store-hero-body { position: relative; z-index: 1; max-width: 640px; }
        .store-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: var(--store-mono); font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 16px; }
        .store-eyebrow::before { content: '//'; color: var(--store-accent); }
        .store-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(32px, 5vw, 56px); line-height: 1.06; font-weight: 700; letter-spacing: -.01em; }
        .store-hero p { margin: 18px 0 0; color: var(--store-muted); font-size: 16px; line-height: 1.65; max-width: 480px; }
        .store-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid transparent; border-radius: 8px; background: var(--store-button); color: var(--store-button-text); padding: 13px 22px; font-weight: 700; font-size: 14px; text-decoration: none; transition: transform .15s ease, opacity .15s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); opacity: .92; }
        .store-cta.secondary { background: transparent; color: var(--store-ink); border-color: var(--store-line); }
        .store-cta.secondary:hover { border-color: var(--store-ink); }
        .store-cta.block { width: 100%; }
        .whatsapp-cta { background: #25D366; color: #fff; margin-top: 4px; }
        .store-cta:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .store-spec-row { position: relative; z-index: 1; display: flex; gap: 0; margin-top: 40px; border: 1px solid var(--store-line); border-radius: 10px; overflow: hidden; background: color-mix(in srgb, var(--store-card) 80%, transparent); backdrop-filter: blur(6px); max-width: 520px; }
        .store-spec-item { flex: 1; padding: 14px 16px; border-right: 1px solid var(--store-line); }
        .store-spec-item:last-child { border-right: 0; }
        .store-spec-item span { display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--store-faint); margin-bottom: 4px; }
        .store-spec-item b { display: block; font-family: var(--store-mono); font-size: 13px; font-weight: 600; }

        .store-products { padding: clamp(28px, 4vw, 48px) 0 60px; }
        .store-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; flex-wrap: wrap; }
        .store-section-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(24px, 3.4vw, 32px); font-weight: 700; }
        .store-section-head p { margin: 8px 0 0; color: var(--store-muted); }
        .store-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .store-filter-pill { padding: 8px 14px; border-radius: 7px; font-size: 12.5px; font-weight: 600; border: 1px solid var(--store-line); background: var(--store-card); color: var(--store-muted); transition: all .15s ease; font-family: var(--store-mono); }
        .store-filter-pill:hover, .store-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 10%, var(--store-card)); }

        .store-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
        .nova-card { min-width: 0; border: 1px solid var(--store-line); border-radius: 10px; overflow: hidden; background: var(--store-card); transition: border-color .2s ease, transform .2s ease; }
        .nova-card:hover { border-color: var(--store-accent); transform: translateY(-2px); }
        .nova-card-media { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: color-mix(in srgb, var(--store-ink) 4%, var(--store-card)); cursor: pointer; border-bottom: 1px solid var(--store-line); }
        .nova-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .nova-card-media:hover img { transform: scale(1.04); }
        .nova-badge { position: absolute; top: 10px; left: 10px; font-family: var(--store-mono); font-size: 10.5px; font-weight: 600; padding: 4px 9px; border-radius: 6px; background: var(--store-surface); border: 1px solid var(--store-line); color: var(--store-ink); z-index: 2; }
        .nova-badge.low { border-color: var(--store-accent); color: var(--store-accent); }
        .nova-badge.out { background: var(--store-ink); color: var(--store-surface); border-color: var(--store-ink); }
        .nova-wish { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 7px; background: var(--store-surface); border: 1px solid var(--store-line); display: flex; align-items: center; justify-content: center; color: var(--store-ink); transition: transform .15s ease; z-index: 2; }
        .nova-wish:hover { transform: scale(1.06); }
        .nova-wish.active { color: var(--store-accent); border-color: var(--store-accent); }
        .nova-wish.active svg { fill: var(--store-accent); }
        .nova-card-body { padding: 12px 14px 14px; cursor: pointer; }
        .nova-card-cat { margin: 0 0 4px; font-family: var(--store-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--store-faint); }
        .nova-card-name { margin: 0 0 10px; font-size: 14.5px; font-weight: 600; overflow-wrap: anywhere; }
        .nova-card-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .nova-card-price { font-family: var(--store-mono); font-weight: 700; font-size: 14px; }
        .nova-card-add { border: 1px solid var(--store-line); background: var(--store-surface); color: var(--store-ink); padding: 7px 12px; border-radius: 7px; font-size: 11.5px; font-weight: 700; transition: all .15s ease; }
        .nova-card-add:hover:not(:disabled) { background: var(--store-ink); color: var(--store-surface); border-color: var(--store-ink); }
        .nova-card-add:disabled { opacity: .5; cursor: not-allowed; }
        .store-empty { grid-column: 1 / -1; border: 1px dashed var(--store-line); border-radius: 10px; padding: 44px 18px; text-align: center; color: var(--store-muted); }

        .store-newsletter { padding: 10px 0 66px; }
        .store-newsletter-inner { background: var(--store-ink); color: var(--store-surface); border-radius: 14px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-size: 22px; margin: 0 0 6px; font-weight: 700; }
        .store-newsletter-inner p { margin: 0; color: color-mix(in srgb, var(--store-surface) 70%, transparent); font-size: 14px; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 12px 15px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--store-surface) 30%, transparent); min-width: 220px; font-size: 14px; outline: none; background: transparent; color: var(--store-surface); }
        .store-newsletter-form input::placeholder { color: color-mix(in srgb, var(--store-surface) 55%, transparent); }
        .store-newsletter-form input:focus { border-color: var(--store-accent); }
        .store-newsletter-form button { border: 0; border-radius: 8px; background: var(--store-accent); color: var(--store-accent-text); padding: 12px 18px; font-weight: 700; font-size: 14px; }

        @media (max-width: 980px) {
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
          .store-spec-row { max-width: 100%; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .store-nav-links { display: none; }
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
          .store-spec-row { flex-direction: column; }
          .store-spec-item { border-right: 0; border-bottom: 1px solid var(--store-line); }
          .store-spec-item:last-child { border-bottom: 0; }
        }
      `}</style>

      {copy.announcement && <div className="store-announce">{copy.announcement}</div>}

      <header className="store-header">
        <div className="store-wrap store-header-inner">
          <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <StoreIcon name="menu" size={20} />
          </button>
          <a className="store-brand" href="#top">
            <span className="store-logo">
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
            </span>
            <span className="store-brand-text">
              <strong>{store.businessName}</strong>
              <span>{[store.city, store.state].filter(Boolean).join(', ') || businessTypeLabel}</span>
            </span>
          </a>
          <nav className="store-nav-links only-desktop" aria-label="Store navigation">
            <a href="#shop">Shop</a>
            <a href="#footer">Contact</a>
          </nav>
          <div className="store-header-actions">
            <label className="store-search only-desktop">
              <StoreIcon name="search" size={16} />
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
          <label className="store-search">
            <StoreIcon name="search" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" />
          </label>
          <nav>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>

      <section className="store-hero" id="top">
        {featuredImage && (
          <div className="store-hero-media" aria-hidden="true">
            <img src={featuredImage} alt="" />
          </div>
        )}
        <div className="store-wrap store-hero-body">
          <span className="store-eyebrow">{heroEyebrow}</span>
          <h1>{heroHeadline}</h1>
          <p>{heroSubtext}</p>
          <div className="store-hero-ctas">
            <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
            {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
          </div>
          <div className="store-spec-row">
            {specRow.map((spec) => (
              <div className="store-spec-item" key={spec.label}>
                <span>{spec.label}</span>
                <b>{spec.value}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="store-products" id="shop">
        <div className="store-wrap">
          <div className="store-section-head">
            <div>
              <h2>{copy.productsHeading}</h2>
              <p>{productsSubheading}</p>
            </div>
            <div className="store-filters" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`store-filter-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="store-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <NovaProductCard
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
            <h2>Get restock alerts</h2>
            <p>New arrivals and drops from {store.businessName}, straight to your inbox.</p>
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
        shareUrl={productShareUrl}
        storeSlug={store.storeSlug}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
