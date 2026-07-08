import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import KitchenProductCard from './KitchenProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function KitchenTemplate(props) {
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
    <main className="storefront kitchen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap');

        .storefront.kitchen {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 60%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 38%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 12%, transparent);
          --store-display: 'DM Serif Display', Georgia, serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        .kitchen-announce { background: var(--store-accent); color: var(--store-accent-text); text-align: center; font-size: 12.5px; font-weight: 700; letter-spacing: .02em; padding: 10px 16px; }

        .kitchen-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 92%, transparent); backdrop-filter: blur(14px); border-bottom: 2px solid var(--store-line); }
        .kitchen-header-inner { display: flex; align-items: center; gap: 20px; padding: 15px 0; }
        .kitchen-brand { display: flex; align-items: center; gap: 12px; margin-right: auto; min-width: 0; text-decoration: none; }
        .kitchen-logo { width: 42px; height: 42px; border-radius: 12px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 700; font-family: var(--store-display); overflow: hidden; flex: 0 0 auto; }
        .kitchen-logo img { width: 100%; height: 100%; object-fit: cover; }
        .kitchen-brand strong { font-family: var(--store-display); font-size: 20px; font-weight: 400; overflow-wrap: anywhere; }
        .kitchen-brand span { display: block; color: var(--store-muted); font-size: 12px; margin-top: 1px; }
        .kitchen-nav-links { display: flex; gap: 26px; font-size: 14px; font-weight: 700; color: var(--store-muted); }
        .kitchen-nav-links a:hover { color: var(--store-ink); }
        .kitchen-header-actions { display: flex; align-items: center; gap: 6px; }
        .kitchen-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-ink) 6%, transparent); border-radius: 999px; padding: 9px 14px; width: 190px; }
        .kitchen-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(43,24,16,.36); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 700; }

        .kitchen-hero { padding: clamp(30px, 6vw, 60px) 0; }
        .kitchen-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .78fr); gap: clamp(24px, 5vw, 56px); align-items: center; }
        .kitchen-eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 16px; }
        .kitchen-eyebrow::before { content: ''; width: 20px; height: 3px; background: var(--store-accent); border-radius: 2px; display: inline-block; }
        .kitchen-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-weight: 400; font-size: clamp(38px, 5.6vw, 66px); line-height: 1.04; }
        .kitchen-hero p { margin: 20px 0 0; color: var(--store-muted); font-size: 16.5px; line-height: 1.7; max-width: 480px; }
        .kitchen-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 10px; background: var(--store-button); color: var(--store-button-text); padding: 15px 24px; font-weight: 800; font-size: 14px; text-decoration: none; transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--store-button) 55%, transparent); }
        .store-cta.secondary { background: transparent; color: var(--store-ink); border: 1.5px solid var(--store-line); }
        .store-cta.secondary:hover { border-color: var(--store-ink); }
        .store-cta.block { width: 100%; border-radius: 10px; }
        .whatsapp-cta { background: #25D366; color: #fff; margin-top: 4px; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
        .kitchen-hero-art { position: relative; aspect-ratio: 1 / 1; }
        .kitchen-hero-frame { position: absolute; inset: 0; border-radius: 20px; overflow: hidden; box-shadow: 0 30px 60px -22px rgba(43,24,16,.32); background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); }
        .kitchen-hero-frame img { width: 100%; height: 100%; object-fit: cover; }
        .kitchen-hero-ticket { position: absolute; top: 16px; left: -14px; background: var(--store-accent); color: var(--store-accent-text); border-radius: 12px; padding: 12px 16px; box-shadow: 0 14px 30px -14px rgba(43,24,16,.4); display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 13px; }

        .kitchen-strip { border-top: 1px solid var(--store-line); border-bottom: 1px solid var(--store-line); background: color-mix(in srgb, var(--store-accent) 6%, transparent); }
        .kitchen-strip ul { width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding: 18px 0; list-style: none; display: flex; justify-content: center; gap: 36px; flex-wrap: wrap; }
        .kitchen-strip li { display: flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 700; color: var(--store-muted); }
        .kitchen-strip svg { color: var(--store-accent); }

        .kitchen-menu { padding: clamp(40px, 6vw, 68px) 0 60px; }
        .kitchen-menu-head { text-align: center; margin-bottom: 30px; }
        .kitchen-menu-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(28px, 4vw, 42px); font-weight: 400; }
        .kitchen-menu-head p { margin: 10px auto 0; color: var(--store-muted); max-width: 460px; }
        .kitchen-filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 22px; }
        .kitchen-filter-pill { padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 700; border: 1.5px solid var(--store-line); background: var(--store-card); color: var(--store-muted); transition: all .15s ease; }
        .kitchen-filter-pill:hover, .kitchen-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); }

        .kitchen-list { display: grid; gap: 6px; max-width: 860px; margin: 0 auto; }
        .kitchen-row { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 18px; padding: 20px 4px; border-bottom: 1px dashed var(--store-line); }
        .kitchen-row.out { opacity: .55; }
        .kitchen-row-media { position: relative; width: 88px; height: 88px; border-radius: 14px; overflow: hidden; background: var(--store-card); cursor: pointer; flex-shrink: 0; }
        .kitchen-row-media img { width: 100%; height: 100%; object-fit: cover; }
        .kitchen-badge { position: absolute; bottom: 4px; left: 4px; right: 4px; font-size: 8.5px; font-weight: 800; text-align: center; padding: 3px 4px; border-radius: 6px; background: var(--store-card); color: var(--store-ink); text-transform: uppercase; }
        .kitchen-badge.low { background: var(--store-accent); color: var(--store-accent-text); }
        .kitchen-badge.out { background: color-mix(in srgb, var(--store-ink) 80%, transparent); color: var(--store-surface); }
        .kitchen-row-body { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .kitchen-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; cursor: pointer; }
        .kitchen-row-heading h3 { margin: 4px 0 0; font-family: var(--store-display); font-size: 19px; font-weight: 400; overflow-wrap: anywhere; }
        .kitchen-row-cat { margin: 0; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: var(--store-faint); }
        .kitchen-row-price { font-weight: 800; font-size: 16px; white-space: nowrap; flex-shrink: 0; }
        .kitchen-row-desc { margin: 0; color: var(--store-muted); font-size: 13.5px; line-height: 1.55; max-width: 520px; }
        .kitchen-row-actions { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
        .kitchen-wish { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--store-line); background: var(--store-card); display: flex; align-items: center; justify-content: center; color: var(--store-ink); flex-shrink: 0; }
        .kitchen-wish.active { color: #B5432D; border-color: #B5432D; }
        .kitchen-wish.active svg { fill: #B5432D; }
        .kitchen-row-add { border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); padding: 9px 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px; }
        .kitchen-row-add:hover:not(:disabled) { background: var(--store-accent); color: var(--store-accent-text); }
        .kitchen-row-add:disabled { opacity: .5; cursor: not-allowed; }
        .store-empty { border: 1.5px dashed var(--store-line); border-radius: 16px; padding: 44px 18px; text-align: center; color: var(--store-muted); max-width: 860px; margin: 0 auto; }

        .store-newsletter { padding: 10px 0 66px; }
        .store-newsletter-inner { background: var(--store-ink); color: var(--store-surface); border-radius: 20px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-size: 26px; margin: 0 0 6px; font-weight: 400; }
        .store-newsletter-inner p { margin: 0; color: color-mix(in srgb, var(--store-surface) 72%, transparent); font-size: 14px; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 13px 16px; border-radius: 10px; border: 0; min-width: 220px; font-size: 14px; outline: none; }
        .store-newsletter-form input:focus { outline: 2px solid var(--store-accent); }
        .store-newsletter-form button { border: 0; border-radius: 10px; background: var(--store-accent); color: var(--store-accent-text); padding: 13px 20px; font-weight: 800; font-size: 14px; }

        @media (max-width: 980px) {
          .kitchen-hero-grid { grid-template-columns: 1fr; }
          .kitchen-hero-art { order: -1; max-width: 380px; margin: 0 auto; }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .kitchen-nav-links { display: none; }
          .kitchen-row { grid-template-columns: 68px minmax(0,1fr); gap: 12px; padding: 16px 0; }
          .kitchen-row-media { width: 68px; height: 68px; }
          .kitchen-row-top { flex-direction: column; align-items: flex-start; gap: 2px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
          .kitchen-hero-ticket { display: none; }
        }
      `}</style>

      {copy.announcement && <div className="kitchen-announce">{copy.announcement}</div>}

      <header className="kitchen-header">
        <div className="store-wrap kitchen-header-inner">
          <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <StoreIcon name="menu" size={20} />
          </button>
          <a className="kitchen-brand" href="#top">
            <span className="kitchen-logo">
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
            </span>
            <span>
              <strong>{store.businessName}</strong>
              <span>{[store.city, store.state].filter(Boolean).join(', ') || businessTypeLabel}</span>
            </span>
          </a>
          <nav className="kitchen-nav-links only-desktop" aria-label="Store navigation">
            <a href="#shop">Menu</a>
            <a href="#footer">Contact</a>
          </nav>
          <div className="kitchen-header-actions">
            <label className="kitchen-search only-desktop">
              <StoreIcon name="search" size={15} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search menu" />
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
          <label className="kitchen-search">
            <StoreIcon name="search" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search menu" />
          </label>
          <nav>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Menu</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>

      <section className="kitchen-hero" id="top">
        <div className="store-wrap kitchen-hero-grid">
          <div>
            <span className="kitchen-eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline}</h1>
            <p>{heroSubtext}</p>
            <div className="kitchen-hero-ctas">
              <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
              {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
          </div>
          <div className="kitchen-hero-art">
            <div className="kitchen-hero-frame">{featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}</div>
            <div className="kitchen-hero-ticket">
              <StoreIcon name="bag" size={16} />
              {products.length || 'New'} on the menu
            </div>
          </div>
        </div>
      </section>

      <section className="kitchen-strip" aria-label="Store benefits">
        <ul>
          <li><StoreIcon name="truck" size={16} /> Local delivery</li>
          <li><StoreIcon name="sparkles" size={16} /> Made fresh to order</li>
          <li><StoreIcon name="shield" size={16} /> Secure checkout</li>
        </ul>
      </section>

      <section className="kitchen-menu" id="shop">
        <div className="store-wrap">
          <div className="kitchen-menu-head">
            <h2>{copy.productsHeading}</h2>
            <p>{productsSubheading}</p>
            <div className="kitchen-filters" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`kitchen-filter-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length ? (
            <div className="kitchen-list">
              {filteredProducts.map((product) => (
                <KitchenProductCard
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
              ))}
            </div>
          ) : (
            <div className="store-empty">{products.length ? 'No products match this search yet.' : 'No products have been published yet.'}</div>
          )}
        </div>
      </section>

      <section className="store-newsletter">
        <div className="store-wrap store-newsletter-inner">
          <div>
            <h2>Never miss a drop</h2>
            <p>New menu items, restocks, and small notes from {store.businessName}.</p>
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
