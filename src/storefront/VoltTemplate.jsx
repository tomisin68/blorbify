import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import VoltProductCard from './VoltProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function VoltTemplate(props) {
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

  const marqueeItems = ['NEW DROP', 'FREE LOCAL DELIVERY', 'LIMITED STOCK', 'SHOP THE VAULT'];

  return (
    <main className="storefront volt">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&display=swap');

        .storefront.volt {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 62%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 40%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 16%, transparent);
          --store-display: 'Archivo Black', 'Inter', sans-serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        @media (prefers-reduced-motion: reduce) {
          .storefront.volt *, .storefront.volt *::before, .storefront.volt *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }

        .store-announce { background: var(--store-accent); color: var(--store-accent-text); text-align: center; font-size: 12.5px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; padding: 10px 16px; }

        .store-header { position: sticky; top: 0; z-index: 60; background: var(--store-surface); border-bottom: 3px solid var(--store-ink); }
        .store-header-inner { display: flex; align-items: center; gap: 20px; padding: 16px 0; }
        .store-brand { display: flex; align-items: center; gap: 11px; margin-right: auto; min-width: 0; text-decoration: none; }
        .store-logo { width: 42px; height: 42px; border-radius: 4px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 900; overflow: hidden; flex: 0 0 auto; transform: rotate(-4deg); }
        .store-logo img { width: 100%; height: 100%; object-fit: cover; }
        .store-brand-text { min-width: 0; }
        .store-brand-text strong { display: block; font-family: var(--store-display); font-size: 17px; text-transform: uppercase; overflow-wrap: anywhere; }
        .store-brand-text span { display: block; color: var(--store-muted); font-size: 11.5px; margin-top: 1px; font-weight: 700; }
        .store-nav-links { display: flex; gap: 26px; font-size: 13.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; color: var(--store-ink); }
        .store-nav-links a:hover { color: var(--store-accent); }
        .store-header-actions { display: flex; align-items: center; gap: 6px; }
        .store-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-ink) 6%, transparent); border: 2px solid transparent; border-radius: 4px; padding: 9px 14px; width: 200px; transition: border-color .2s ease; }
        .store-search:focus-within { border-color: var(--store-ink); }
        .store-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13.5px; }

        .store-marquee { background: var(--store-ink); color: var(--store-surface); overflow: hidden; white-space: nowrap; border-bottom: 3px solid var(--store-ink); }
        .store-marquee-track { display: inline-flex; align-items: center; gap: 40px; padding: 9px 0; animation: voltMarquee 22s linear infinite; }
        .store-marquee-track span { display: inline-flex; align-items: center; gap: 40px; font-size: 12.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .store-marquee-track span::after { content: '\\2726'; margin-left: 40px; color: var(--store-accent); }
        @keyframes voltMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .store-marquee-track { animation: none; } }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.5); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; border-right: 3px solid var(--store-ink); }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 16px; font-weight: 800; text-transform: uppercase; }

        .store-hero { padding: clamp(36px, 7vw, 70px) 0 clamp(30px, 5vw, 56px); overflow: hidden; }
        .store-hero-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, .8fr); gap: clamp(24px, 5vw, 56px); align-items: center; }
        .store-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; background: var(--store-ink); color: var(--store-surface); padding: 7px 14px; border-radius: 999px; margin-bottom: 20px; }
        .store-hero h1 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(38px, 7vw, 80px); line-height: .96; letter-spacing: -.01em; text-transform: uppercase; transform: rotate(-1.5deg); transform-origin: left center; }
        .store-hero h1 em { font-style: normal; color: var(--store-accent); }
        .store-hero p { margin: 26px 0 0; color: var(--store-muted); font-size: 16.5px; line-height: 1.6; max-width: 460px; font-weight: 500; }
        .store-hero-ctas { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 30px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 3px solid var(--store-ink); border-radius: 4px; background: var(--store-button); color: var(--store-button-text); padding: 14px 26px; font-weight: 900; font-size: 13.5px; text-transform: uppercase; letter-spacing: .03em; text-decoration: none; box-shadow: 6px 6px 0 var(--store-ink); transition: transform .15s ease, box-shadow .15s ease; white-space: nowrap; }
        .store-cta:hover { transform: translate(3px, 3px); box-shadow: 3px 3px 0 var(--store-ink); }
        .store-cta.secondary { background: var(--store-surface); color: var(--store-ink); }
        .store-cta.block { width: 100%; }
        .whatsapp-cta { background: #25D366; color: #fff; border-color: var(--store-ink); margin-top: 4px; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: 6px 6px 0 var(--store-ink); }
        .store-trust-row { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 30px; }
        .store-trust-row .item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--store-muted); }
        .store-trust-row svg { color: var(--store-accent); }

        .store-hero-art { position: relative; aspect-ratio: 1 / 1.1; }
        .hero-frame { position: absolute; inset: 0; overflow: hidden; border-radius: 6px; border: 3px solid var(--store-ink); background: var(--store-card); box-shadow: 10px 10px 0 var(--store-accent); transform: rotate(2deg); }
        .hero-frame img { width: 100%; height: 100%; object-fit: cover; }
        .hero-float { position: absolute; bottom: -14px; left: -14px; display: flex; align-items: center; gap: 10px; background: var(--store-accent); color: var(--store-accent-text); border: 3px solid var(--store-ink); border-radius: 6px; padding: 12px 16px; transform: rotate(-3deg); box-shadow: 5px 5px 0 var(--store-ink); }
        .hero-float b { display: block; font-size: 14px; text-transform: uppercase; }
        .hero-float span { display: block; font-size: 10.5px; font-weight: 700; opacity: .85; }

        .store-products { padding: clamp(24px, 4vw, 44px) 0 60px; }
        .store-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .store-section-head h2 { color: inherit; margin: 0; font-family: var(--store-display); font-size: clamp(26px, 4vw, 40px); text-transform: uppercase; }
        .store-section-head p { margin: 8px 0 0; color: var(--store-muted); font-weight: 500; }
        .store-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .store-filter-pill { padding: 9px 16px; border-radius: 4px; font-size: 12px; font-weight: 800; text-transform: uppercase; border: 2px solid var(--store-ink); background: var(--store-card); color: var(--store-ink); transition: all .15s ease; }
        .store-filter-pill:hover, .store-filter-pill.active { background: var(--store-accent); color: var(--store-accent-text); }

        .store-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        .volt-card { min-width: 0; }
        .volt-card-media { position: relative; aspect-ratio: 4 / 5; border-radius: 6px; overflow: hidden; background: var(--store-card); cursor: pointer; border: 3px solid var(--store-ink); }
        .volt-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .volt-card-media:hover img { transform: scale(1.06); }
        .volt-tag { position: absolute; top: -3px; left: -3px; font-size: 10px; font-weight: 900; letter-spacing: .03em; padding: 6px 12px 6px 10px; background: var(--store-ink); color: var(--store-surface); z-index: 2; clip-path: polygon(0 0, 100% 0, 88% 100%, 0% 100%); }
        .volt-tag.low { background: var(--store-accent); color: var(--store-accent-text); }
        .volt-tag.out { background: color-mix(in srgb, var(--store-ink) 85%, transparent); }
        .volt-wish { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: var(--store-surface); border: 2px solid var(--store-ink); display: flex; align-items: center; justify-content: center; color: var(--store-ink); transition: transform .15s ease; z-index: 2; }
        .volt-wish:hover { transform: scale(1.08); }
        .volt-wish.active { color: var(--store-accent); }
        .volt-wish.active svg { fill: var(--store-accent); }
        .volt-card-body { padding: 13px 2px 0; }
        .volt-card-cat { margin: 0 0 4px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--store-faint); }
        .volt-card-name { margin: 0 0 8px; font-size: 15px; font-weight: 800; cursor: pointer; overflow-wrap: anywhere; }
        .volt-card-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .volt-card-price { font-weight: 900; font-size: 15px; }
        .volt-card-add { width: 36px; height: 36px; border-radius: 4px; border: 2px solid var(--store-ink); background: var(--store-ink); color: var(--store-surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .15s ease, color .15s ease; }
        .volt-card-add:hover:not(:disabled) { background: var(--store-accent); color: var(--store-accent-text); border-color: var(--store-accent); }
        .volt-card-add:disabled { opacity: .5; cursor: not-allowed; }
        .store-empty { grid-column: 1 / -1; border: 3px dashed var(--store-line); border-radius: 6px; padding: 44px 18px; text-align: center; color: var(--store-muted); font-weight: 700; }

        .store-newsletter { padding: 10px 0 66px; }
        .store-newsletter-inner { background: var(--store-ink); color: var(--store-surface); border-radius: 6px; padding: clamp(28px, 5vw, 48px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; border: 3px solid var(--store-ink); box-shadow: 8px 8px 0 var(--store-accent); }
        .store-newsletter-inner h2 { color: inherit; font-family: var(--store-display); font-size: 24px; margin: 0 0 6px; text-transform: uppercase; }
        .store-newsletter-inner p { margin: 0; color: color-mix(in srgb, var(--store-surface) 70%, transparent); font-size: 14px; font-weight: 600; }
        .store-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .store-newsletter-form input { padding: 13px 16px; border-radius: 4px; border: 2px solid var(--store-surface); min-width: 220px; font-size: 14px; outline: none; background: var(--store-ink); color: var(--store-surface); }
        .store-newsletter-form input::placeholder { color: color-mix(in srgb, var(--store-surface) 60%, transparent); }
        .store-newsletter-form input:focus { border-color: var(--store-accent); }
        .store-newsletter-form button { border: 2px solid var(--store-accent); border-radius: 4px; background: var(--store-accent); color: var(--store-accent-text); padding: 13px 20px; font-weight: 900; font-size: 13px; text-transform: uppercase; }

        @media (max-width: 980px) {
          .store-hero-grid { grid-template-columns: 1fr; }
          .store-hero-art { order: -1; align-self: start; width: 100%; max-width: 380px; margin: 0 auto 30px; }
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .store-nav-links { display: none; }
          .store-trust-row { gap: 14px; }
          .store-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .store-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .store-newsletter-form { width: 100%; }
          .store-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
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

      <div className="store-marquee" aria-hidden="true">
        <div className="store-marquee-track">
          <span>{marqueeItems.join(' ✦ ')}</span>
          <span>{marqueeItems.join(' ✦ ')}</span>
        </div>
      </div>

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
              <div className="item"><StoreIcon name="sparkles" size={16} /> Fresh drops</div>
              <div className="item"><StoreIcon name="shield" size={16} /> Secure checkout</div>
            </div>
          </div>
          <div className="store-hero-art">
            <div className="hero-frame">{featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}</div>
            <div className="hero-float">
              <StoreIcon name="bag" size={18} />
              <div>
                <b>{products.length || 'New'}</b>
                <span>Products live</span>
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

          <div className="store-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <VoltProductCard
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
            <p>Drops, restocks, and news from {store.businessName}.</p>
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
