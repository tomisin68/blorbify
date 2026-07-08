import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import AtelierProductCard from './AtelierProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function AtelierTemplate(props) {
  const {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    filteredProducts, productCategories, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
    featuredImage, secondaryImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading, products,
    formatCurrency, wishlist, isWished, toggleWishlist, addToCart, selectedProduct, setSelectedProduct,
    cart, cartCount, cartSubtotal, cartTotal, deliveryFee, freeShippingThreshold, updateQuantity, removeItem,
    cartOpen, setCartOpen, closeCart, mobileMenuOpen, setMobileMenuOpen,
    customer, updateCustomer, handleCheckout, submittingOrder, orderPlaced, digitalDelivery,
    whatsappEnabled, handleWhatsAppCheckout, couponCode, setCouponCode,
    newsletterEmail, setNewsletterEmail, handleNewsletterSubmit,
    toasts, dismiss,
  } = props;

  return (
    <main className="storefront atelier">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700;800&display=swap');

        .storefront.atelier {
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
          --store-display: 'Spectral', Georgia, serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        .atelier-announce { background: var(--store-ink); color: var(--store-surface); text-align: center; font-size: 12.5px; font-weight: 600; letter-spacing: .03em; padding: 10px 16px; }

        .atelier-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 90%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--store-line); }
        .atelier-header-inner { display: flex; align-items: center; gap: 20px; padding: 16px 0; }
        .atelier-brand { display: flex; align-items: center; gap: 12px; margin-right: auto; min-width: 0; text-decoration: none; }
        .atelier-logo { width: 42px; height: 42px; border-radius: 4px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 600; font-family: var(--store-display); font-style: italic; overflow: hidden; flex: 0 0 auto; }
        .atelier-logo img { width: 100%; height: 100%; object-fit: cover; }
        .atelier-brand strong { font-family: var(--store-display); font-size: 20px; font-weight: 600; overflow-wrap: anywhere; }
        .atelier-brand span { display: block; color: var(--store-muted); font-size: 12px; margin-top: 1px; }
        .atelier-nav-links { display: flex; gap: 26px; font-size: 14px; font-weight: 600; color: var(--store-muted); }
        .atelier-nav-links a:hover { color: var(--store-ink); }
        .atelier-header-actions { display: flex; align-items: center; gap: 6px; }
        .atelier-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-ink) 6%, transparent); border-radius: 4px; padding: 9px 14px; width: 190px; }
        .atelier-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(62,47,37,.34); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 600; }

        .atelier-hero { padding: clamp(36px, 6vw, 64px) 0; }
        .atelier-hero-grid { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 60px); align-items: center; }
        .atelier-eyebrow { display: inline-flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 16px; }
        .atelier-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-weight: 500; font-size: clamp(34px, 5vw, 56px); line-height: 1.12; }
        .atelier-hero p { margin: 20px 0 0; color: var(--store-muted); font-size: 16px; line-height: 1.75; max-width: 480px; }
        .atelier-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 4px; background: var(--store-button); color: var(--store-button-text); padding: 14px 24px; font-weight: 700; font-size: 13.5px; text-decoration: none; transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); box-shadow: 0 14px 28px -10px color-mix(in srgb, var(--store-button) 55%, transparent); }
        .store-cta.secondary { background: transparent; color: var(--store-ink); border: 1.5px solid var(--store-line); }
        .store-cta.secondary:hover { border-color: var(--store-ink); }
        .store-cta.block { width: 100%; border-radius: 4px; }
        .whatsapp-cta { background: #25D366; color: #fff; margin-top: 4px; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
        .atelier-hero-art { position: relative; aspect-ratio: 4 / 5; }
        .atelier-hero-frame { position: absolute; overflow: hidden; background: var(--store-card); box-shadow: 0 26px 54px -20px rgba(62,47,37,.3); padding: 14px 14px 42px; }
        .atelier-hero-frame.main { width: 78%; height: 84%; top: 0; left: 0; transform: rotate(-2deg); z-index: 2; }
        .atelier-hero-frame.small { width: 48%; height: 46%; right: 0; bottom: 0; transform: rotate(3deg); z-index: 1; }
        .atelier-hero-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .atelier-strip { border-top: 1px solid var(--store-line); border-bottom: 1px solid var(--store-line); }
        .atelier-strip ul { width: min(1180px, calc(100% - 40px)); margin: 0 auto; padding: 18px 0; list-style: none; display: flex; justify-content: center; gap: 36px; flex-wrap: wrap; }
        .atelier-strip li { display: flex; align-items: center; gap: 9px; font-size: 12.5px; font-weight: 600; color: var(--store-muted); }
        .atelier-strip svg { color: var(--store-accent); }

        .atelier-products { padding: clamp(40px, 6vw, 68px) 0 60px; }
        .atelier-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 26px; flex-wrap: wrap; }
        .atelier-section-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(26px, 4vw, 38px); font-weight: 500; }
        .atelier-section-head p { margin: 8px 0 0; color: var(--store-muted); }
        .atelier-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .atelier-filter-pill { padding: 9px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; border: 1.5px solid var(--store-line); background: var(--store-card); color: var(--store-muted); transition: all .15s ease; }
        .atelier-filter-pill:hover, .atelier-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 14%, var(--store-card)); }

        .atelier-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
        .atelier-card { min-width: 0; }
        .atelier-card-frame { background: var(--store-card); padding: 10px 10px 0; box-shadow: 0 14px 30px -18px rgba(62,47,37,.28); cursor: pointer; transition: transform .25s ease; }
        .atelier-card-frame:hover { transform: translateY(-3px) rotate(-.6deg); }
        .atelier-card-media { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: color-mix(in srgb, var(--store-accent) 12%, var(--store-card)); }
        .atelier-card-media img { width: 100%; height: 100%; object-fit: cover; }
        .atelier-badge { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; padding: 4px 9px; border-radius: 3px; background: var(--store-card); color: var(--store-ink); z-index: 2; }
        .atelier-badge.low { background: var(--store-accent); color: var(--store-accent-text); }
        .atelier-badge.out { background: color-mix(in srgb, var(--store-ink) 80%, transparent); color: var(--store-surface); }
        .atelier-wish { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.9); border: 0; display: flex; align-items: center; justify-content: center; color: var(--store-ink); z-index: 2; }
        .atelier-wish.active { color: #A8563D; }
        .atelier-wish.active svg { fill: #A8563D; }
        .atelier-card-caption { text-align: center; margin: 10px 0 12px; font-family: var(--store-display); font-style: italic; font-size: 12.5px; color: var(--store-faint); }
        .atelier-card-body { padding: 12px 2px 0; }
        .atelier-card-name { margin: 0 0 8px; font-family: var(--store-display); font-size: 17px; font-weight: 500; cursor: pointer; overflow-wrap: anywhere; }
        .atelier-card-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .atelier-card-price { font-weight: 700; font-size: 14.5px; }
        .atelier-card-add { border: 1.5px solid var(--store-line); border-radius: 4px; background: transparent; color: var(--store-ink); padding: 8px 14px; font-weight: 700; font-size: 12px; }
        .atelier-card-add:hover:not(:disabled) { border-color: var(--store-ink); background: var(--store-ink); color: var(--store-surface); }
        .atelier-card-add:disabled { opacity: .5; cursor: not-allowed; }
        .store-empty { grid-column: 1 / -1; border: 1.5px dashed var(--store-line); border-radius: 4px; padding: 44px 18px; text-align: center; color: var(--store-muted); }

        .store-newsletter { padding: 20px 0 66px; }
        .store-newsletter-inner { background: var(--store-card); border: 1px solid var(--store-line); border-radius: 4px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-style: italic; font-size: 25px; margin: 0 0 6px; font-weight: 500; }
        .store-newsletter-inner p { margin: 0; color: var(--store-muted); font-size: 14px; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 13px 16px; border-radius: 4px; border: 1.5px solid var(--store-line); background: var(--store-surface); min-width: 220px; font-size: 14px; outline: none; }
        .store-newsletter-form input:focus { border-color: var(--store-accent); }
        .store-newsletter-form button { border: 0; border-radius: 4px; background: var(--store-button); color: var(--store-button-text); padding: 13px 20px; font-weight: 700; font-size: 14px; }

        @media (max-width: 980px) {
          .atelier-hero-grid { grid-template-columns: 1fr; }
          .atelier-hero-art { order: -1; max-width: 340px; margin: 0 auto; }
          .atelier-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .atelier-nav-links { display: none; }
          .atelier-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>

      {copy.announcement && <div className="atelier-announce">{copy.announcement}</div>}

      <header className="atelier-header">
        <div className="store-wrap atelier-header-inner">
          <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <StoreIcon name="menu" size={20} />
          </button>
          <a className="atelier-brand" href="#top">
            <span className="atelier-logo">
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
            </span>
            <span>
              <strong>{store.businessName}</strong>
              <span>{[store.city, store.state].filter(Boolean).join(', ') || businessTypeLabel}</span>
            </span>
          </a>
          <nav className="atelier-nav-links only-desktop" aria-label="Store navigation">
            <a href="#shop">Shop</a>
            <a href="#footer">Contact</a>
          </nav>
          <div className="atelier-header-actions">
            <label className="atelier-search only-desktop">
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
          <label className="atelier-search">
            <StoreIcon name="search" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" />
          </label>
          <nav>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>

      <section className="atelier-hero" id="top">
        <div className="store-wrap atelier-hero-grid">
          <div className="atelier-hero-art">
            <div className="atelier-hero-frame main">{featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}</div>
            <div className="atelier-hero-frame small">{secondaryImage && <img src={secondaryImage} alt="" />}</div>
          </div>
          <div>
            <span className="atelier-eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline}</h1>
            <p>{heroSubtext}</p>
            <div className="atelier-hero-ctas">
              <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
              {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
          </div>
        </div>
      </section>

      <section className="atelier-strip" aria-label="Store benefits">
        <ul>
          <li><StoreIcon name="sparkles" size={16} /> Made by hand</li>
          <li><StoreIcon name="truck" size={16} /> Local delivery</li>
          <li><StoreIcon name="heart" size={16} /> Save your favorites</li>
        </ul>
      </section>

      <section className="atelier-products" id="shop">
        <div className="store-wrap">
          <div className="atelier-section-head">
            <div>
              <h2>{copy.productsHeading}</h2>
              <p>{productsSubheading}</p>
            </div>
            <div className="atelier-filters" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`atelier-filter-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="atelier-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <AtelierProductCard
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
            <h2>Join the studio list</h2>
            <p>New pieces, restocks, and small notes from {store.businessName}.</p>
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
