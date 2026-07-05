import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import ProductCard from './ProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function SignatureTemplate(props) {
  const {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    filteredProducts, productCategories, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
    featuredImage, secondaryImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading, products,
    formatCurrency, wishlist, isWished, toggleWishlist, addToCart, selectedProduct, setSelectedProduct,
    cart, cartCount, cartSubtotal, cartTotal, deliveryFee, freeShippingThreshold, updateQuantity, removeItem,
    cartOpen, setCartOpen, closeCart, mobileMenuOpen, setMobileMenuOpen,
    customer, updateCustomer, handleCheckout, submittingOrder, orderPlaced,
    newsletterEmail, setNewsletterEmail, handleNewsletterSubmit,
    toasts, dismiss,
  } = props;

  return (
    <main className="storefront signature">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,560;9..144,650&family=Inter:wght@400;500;600;700;800&display=swap');

        .storefront.signature {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 60%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 38%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 11%, transparent);
          --store-display: 'Fraunces', Georgia, serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        .store-announce { background: var(--store-ink); color: var(--store-surface); text-align: center; font-size: 12.5px; font-weight: 700; letter-spacing: .03em; padding: 10px 16px; }

        .store-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 88%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--store-line); }
        .store-header-inner { display: flex; align-items: center; gap: 20px; padding: 14px 0; }
        .store-brand { display: flex; align-items: center; gap: 11px; margin-right: auto; min-width: 0; text-decoration: none; }
        .store-logo { width: 42px; height: 42px; border-radius: 11px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 800; overflow: hidden; flex: 0 0 auto; }
        .store-logo img { width: 100%; height: 100%; object-fit: cover; }
        .store-brand-text { min-width: 0; }
        .store-brand-text strong { display: block; font-family: var(--store-display); font-size: 19px; font-weight: 600; overflow-wrap: anywhere; }
        .store-brand-text span { display: block; color: var(--store-muted); font-size: 12px; margin-top: 1px; }
        .store-nav-links { display: flex; gap: 26px; font-size: 14px; font-weight: 600; color: var(--store-muted); }
        .store-nav-links a:hover { color: var(--store-ink); }
        .store-header-actions { display: flex; align-items: center; gap: 6px; }
        .store-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-ink) 5%, transparent); border: 1px solid transparent; border-radius: 999px; padding: 9px 14px; width: 200px; transition: border-color .2s ease, background .2s ease; }
        .store-search:focus-within { background: var(--store-card); border-color: var(--store-accent); }
        .store-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13.5px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.36); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 600; }

        .store-hero { padding: clamp(28px, 6vw, 60px) 0 clamp(30px, 5vw, 56px); }
        .store-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .82fr); gap: clamp(24px, 5vw, 56px); align-items: center; }
        .store-eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 16px; }
        .store-eyebrow::before { content: ''; width: 18px; height: 2px; background: var(--store-accent); display: inline-block; border-radius: 2px; }
        .store-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(38px, 5.6vw, 68px); line-height: 1.02; font-weight: 620; letter-spacing: -.01em; }
        .store-hero p { margin: 20px 0 0; color: var(--store-muted); font-size: 17px; line-height: 1.65; max-width: 500px; }
        .store-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); padding: 14px 24px; font-weight: 800; font-size: 14px; text-decoration: none; transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); box-shadow: 0 12px 26px -10px color-mix(in srgb, var(--store-button) 60%, transparent); }
        .store-cta.secondary { background: transparent; color: var(--store-ink); border: 1.5px solid var(--store-line); }
        .store-cta.secondary:hover { border-color: var(--store-ink); }
        .store-cta.block { width: 100%; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
        .store-trust-row { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 30px; }
        .store-trust-row .item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: var(--store-muted); }
        .store-trust-row svg { color: var(--store-accent); }

        .store-hero-art { position: relative; aspect-ratio: 1 / 1; }
        .hero-frame { position: absolute; overflow: hidden; border-radius: 24px; background: color-mix(in srgb, var(--store-accent) 12%, var(--store-card)); box-shadow: 0 30px 60px -24px rgba(0,0,0,.28); }
        .hero-frame.main { width: 78%; height: 84%; top: 0; left: 0; }
        .hero-frame.small { width: 46%; height: 50%; right: 0; bottom: 0; border: 6px solid var(--store-surface); }
        .hero-frame img { width: 100%; height: 100%; object-fit: cover; }
        .hero-float { position: absolute; top: 16px; right: -12px; display: flex; align-items: center; gap: 10px; background: var(--store-card); border-radius: 16px; padding: 13px 16px; box-shadow: 0 16px 34px -16px rgba(0,0,0,.3); }
        .hero-float b { display: block; font-size: 14px; }
        .hero-float span { display: block; color: var(--store-muted); font-size: 11px; }

        .store-products { padding: clamp(20px, 4vw, 40px) 0 60px; }
        .store-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; flex-wrap: wrap; }
        .store-section-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(26px, 4vw, 38px); font-weight: 600; }
        .store-section-head p { margin: 8px 0 0; color: var(--store-muted); }
        .store-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .store-filter-pill { padding: 9px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; border: 1.5px solid var(--store-line); background: var(--store-card); color: var(--store-muted); transition: all .15s ease; }
        .store-filter-pill:hover, .store-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 16%, var(--store-card)); }

        .store-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        .pcard { min-width: 0; }
        .pcard-media { position: relative; aspect-ratio: 4 / 5; border-radius: 18px; overflow: hidden; background: var(--store-card); cursor: pointer; }
        .pcard-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
        .pcard-media:hover img { transform: scale(1.05); }
        .pcard-badge { position: absolute; top: 10px; left: 10px; font-size: 10.5px; font-weight: 800; letter-spacing: .03em; padding: 5px 10px; border-radius: 999px; background: var(--store-card); color: var(--store-ink); text-transform: uppercase; z-index: 2; }
        .pcard-badge.low { background: var(--store-accent); color: var(--store-accent-text); }
        .pcard-badge.out { background: color-mix(in srgb, var(--store-ink) 82%, transparent); color: var(--store-surface); }
        .pcard-wish { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.92); border: 0; display: flex; align-items: center; justify-content: center; color: var(--store-ink); transition: transform .15s ease; z-index: 2; }
        .pcard-wish:hover { transform: scale(1.08); }
        .pcard-wish.active { color: #C4432B; }
        .pcard-wish.active svg { fill: #C4432B; }
        .pcard-add { position: absolute; left: 12px; right: 12px; bottom: 12px; border: 0; background: var(--store-ink); color: var(--store-surface); padding: 11px; border-radius: 999px; font-size: 12.5px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 7px; opacity: 0; transform: translateY(8px); transition: opacity .2s ease, transform .2s ease, background .2s ease; z-index: 2; }
        .pcard-add:hover { background: var(--store-accent); color: var(--store-accent-text); }
        .pcard-media:hover .pcard-add { opacity: 1; transform: translateY(0); }
        .pcard-add:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .pcard-body { padding: 13px 2px 0; cursor: pointer; }
        .pcard-cat { margin: 0 0 3px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: var(--store-faint); }
        .pcard-name { margin: 0 0 6px; font-family: var(--store-display); font-size: 16.5px; font-weight: 560; overflow-wrap: anywhere; }
        .pcard-price { font-weight: 800; font-size: 14.5px; color: var(--store-ink); }
        .store-grid.featured .pcard:first-child { grid-column: span 2; grid-row: span 2; }
        .store-grid.featured .pcard:first-child .pcard-name { font-size: 22px; }
        .store-empty { grid-column: 1 / -1; border: 1.5px dashed var(--store-line); border-radius: 18px; padding: 44px 18px; text-align: center; color: var(--store-muted); }

        .store-newsletter { padding: 10px 0 66px; }
        .store-newsletter-inner { background: var(--store-ink); color: var(--store-surface); border-radius: 26px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-size: 24px; margin: 0 0 6px; font-weight: 600; }
        .store-newsletter-inner p { margin: 0; color: color-mix(in srgb, var(--store-surface) 70%, transparent); font-size: 14px; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 13px 16px; border-radius: 999px; border: 0; min-width: 220px; font-size: 14px; outline: none; }
        .store-newsletter-form input:focus { outline: 2px solid var(--store-accent); }
        .store-newsletter-form button { border: 0; border-radius: 999px; background: var(--store-accent); color: var(--store-accent-text); padding: 13px 20px; font-weight: 800; font-size: 14px; }

        @media (max-width: 980px) {
          .store-hero-grid { grid-template-columns: 1fr; }
          .store-hero-art { order: -1; align-self: start; width: 100%; max-width: 420px; margin: 0 auto; }
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .store-grid.featured .pcard:first-child { grid-column: span 2; grid-row: span 1; }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .store-nav-links { display: none; }
          .store-hero { padding-top: 20px; }
          .store-trust-row { gap: 14px; }
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .store-grid.featured .pcard:first-child { grid-column: span 2; }
          .pcard-add { opacity: 1; transform: none; font-size: 11.5px; padding: 9px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
          .hero-float { display: none; }
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
        <div className="store-wrap store-hero-grid">
          <div className="store-hero-copy">
            <span className="store-eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline}</h1>
            <p>{heroSubtext}</p>
            <div className="store-hero-ctas">
              <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
              {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
            <div className="store-trust-row">
              <div className="item"><StoreIcon name="truck" size={16} /> Local delivery</div>
              <div className="item"><StoreIcon name="sparkles" size={16} /> Fresh arrivals</div>
              <div className="item"><StoreIcon name="shield" size={16} /> Secure checkout</div>
            </div>
          </div>
          <div className="store-hero-art">
            <div className="hero-frame main">{featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}</div>
            <div className="hero-frame small">{secondaryImage && <img src={secondaryImage} alt="" />}</div>
            <div className="hero-float">
              <StoreIcon name="bag" size={18} />
              <div>
                <b>{products.length || 'New'} products</b>
                <span>Ready to order</span>
              </div>
            </div>
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

          <div className={`store-grid ${filteredProducts.length >= 5 ? 'featured' : ''}`}>
            {filteredProducts.length ? filteredProducts.map((product) => (
              <ProductCard
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
            <h2>Join the list</h2>
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
        onContinueShopping={closeCart}
        checkoutLabel={copy.checkoutLabel}
        formatCurrency={formatCurrency}
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
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </main>
  );
}
