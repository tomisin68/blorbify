import { productKey } from './useCart';
import { StoreIcon } from './icons';
import { sharedStorefrontStyles } from './sharedStorefrontStyles';
import NoirProductCard from './NoirProductCard';
import ProductDetail from './ProductDetail';
import CartDrawer from './CartDrawer';
import StoreFooter from './StoreFooter';
import { ToastStack } from './Toast';

export default function NoirTemplate(props) {
  const {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    filteredProducts, productCategories, activeCategory, setActiveCategory, searchTerm, setSearchTerm,
    featuredImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading, products,
    formatCurrency, wishlist, isWished, toggleWishlist, addToCart, selectedProduct, setSelectedProduct,
    cart, cartCount, cartSubtotal, cartTotal, deliveryFee, freeShippingThreshold, updateQuantity, removeItem,
    cartOpen, setCartOpen, closeCart, mobileMenuOpen, setMobileMenuOpen,
    customer, updateCustomer, handleCheckout, submittingOrder, orderPlaced,
    newsletterEmail, setNewsletterEmail, handleNewsletterSubmit,
    toasts, dismiss,
  } = props;

  return (
    <main className="storefront noir">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');

        .storefront.noir {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${accentTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 62%, transparent);
          --store-faint: color-mix(in srgb, var(--store-ink) 40%, transparent);
          --store-line: color-mix(in srgb, var(--store-ink) 14%, transparent);
          --store-display: 'Bebas Neue', 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: 'Inter', system-ui, sans-serif;
        }
        ${sharedStorefrontStyles}

        .noir .store-footer-col h4,
        .noir .cart-drawer-head h3,
        .noir .store-footer-brand strong { text-transform: uppercase; letter-spacing: .08em; }
        .noir .cart-success h4 { text-transform: uppercase; letter-spacing: .04em; }

        .noir-announce { background: var(--store-accent); color: var(--store-accent-text); text-align: center; font-size: 11.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; padding: 9px 16px; }

        .noir-header { position: sticky; top: 0; z-index: 60; background: color-mix(in srgb, var(--store-surface) 90%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--store-line); }
        .noir-header-inner { display: flex; align-items: center; gap: 22px; padding: 16px 0; }
        .noir-brand { display: flex; align-items: center; gap: 12px; margin-right: auto; min-width: 0; text-decoration: none; }
        .noir-logo { width: 38px; height: 38px; border-radius: 4px; background: var(--store-accent); color: var(--store-accent-text); display: grid; place-items: center; font-weight: 800; overflow: hidden; flex: 0 0 auto; }
        .noir-logo img { width: 100%; height: 100%; object-fit: cover; }
        .noir-brand strong { font-family: var(--store-display); font-size: 22px; letter-spacing: .05em; text-transform: uppercase; overflow-wrap: anywhere; }
        .noir-nav-links { display: flex; gap: 30px; font-size: 12.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--store-muted); }
        .noir-nav-links a:hover { color: var(--store-ink); }
        .noir-header-actions { display: flex; align-items: center; gap: 4px; }
        .noir-search { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--store-ink) 7%, transparent); border-radius: 4px; padding: 9px 14px; width: 190px; }
        .noir-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: 13px; }

        .mobile-menu { position: fixed; inset: 0; z-index: 90; pointer-events: none; }
        .mobile-menu-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.5); opacity: 0; transition: opacity .25s ease; }
        .mobile-menu-panel { position: absolute; top: 0; left: 0; bottom: 0; width: 82%; max-width: 320px; background: var(--store-surface); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 24px; }
        .mobile-menu.open { pointer-events: auto; }
        .mobile-menu.open .mobile-menu-overlay { opacity: 1; }
        .mobile-menu.open .mobile-menu-panel { transform: translateX(0); }
        .mobile-menu-panel nav { display: flex; flex-direction: column; gap: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }

        .noir-hero { position: relative; min-height: 78vh; display: flex; align-items: flex-end; background: linear-gradient(150deg, color-mix(in srgb, var(--store-accent) 24%, var(--store-ink)), var(--store-ink)); background-size: cover; background-position: center; overflow: hidden; }
        .noir-hero.has-image { background-image: linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.15) 55%, rgba(0,0,0,.55)), var(--noir-hero-image); }
        .noir-hero-inner { position: relative; z-index: 1; padding: clamp(28px, 6vw, 64px) 0 clamp(36px, 6vw, 72px); width: 100%; }
        .noir-hero-inner .store-wrap { color: #F5F5F2; }
        .noir-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--store-accent); margin-bottom: 18px; }
        .noir-eyebrow::before { content: ''; width: 26px; height: 2px; background: var(--store-accent); display: inline-block; }
        .noir-hero h1 { margin: 0; font-family: var(--store-display); font-size: clamp(48px, 9vw, 118px); line-height: .88; text-transform: uppercase; letter-spacing: .01em; max-width: 900px; }
        .noir-hero p { margin: 22px 0 0; color: rgba(245,245,242,.78); font-size: 16.5px; line-height: 1.65; max-width: 480px; }
        .noir-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
        .store-cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 4px; background: var(--store-button); color: var(--store-button-text); padding: 14px 26px; font-weight: 800; font-size: 12.5px; text-transform: uppercase; letter-spacing: .08em; text-decoration: none; transition: transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s ease; white-space: nowrap; }
        .store-cta:hover { transform: translateY(-1px); box-shadow: 0 12px 26px -10px color-mix(in srgb, var(--store-button) 60%, transparent); }
        .store-cta.secondary { background: transparent; color: #F5F5F2; border: 1.5px solid rgba(245,245,242,.32); }
        .store-cta.secondary:hover { border-color: #F5F5F2; }
        .store-cta.block { width: 100%; }
        .store-cta:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

        .noir-strip { border-bottom: 1px solid var(--store-line); background: var(--store-card); }
        .noir-strip ul { list-style: none; margin: 0; padding: 14px 0; display: flex; justify-content: center; gap: 34px; flex-wrap: wrap; }
        .noir-strip li { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--store-muted); }
        .noir-strip svg { color: var(--store-accent); }

        .noir-products { padding: clamp(40px, 6vw, 72px) 0 64px; }
        .noir-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
        .noir-section-head h2 { margin: 0; font-family: var(--store-display); font-size: clamp(32px, 5vw, 52px); text-transform: uppercase; letter-spacing: .02em; line-height: 1; }
        .noir-section-head p { margin: 10px 0 0; color: var(--store-muted); }
        .noir-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .noir-filter-pill { padding: 9px 16px; border-radius: 4px; font-size: 11.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; border: 1.5px solid var(--store-line); background: transparent; color: var(--store-muted); transition: all .15s ease; }
        .noir-filter-pill:hover, .noir-filter-pill.active { border-color: var(--store-accent); color: var(--store-ink); background: color-mix(in srgb, var(--store-accent) 14%, transparent); }

        .noir-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .noir-tile { position: relative; aspect-ratio: 3 / 4; border-radius: 4px; overflow: hidden; background: var(--store-card); cursor: pointer; }
        .noir-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.22,1,.36,1); }
        .noir-tile:hover img { transform: scale(1.06); }
        .noir-tile-scrim { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,.86), rgba(0,0,0,.05) 45%, transparent 65%); }
        .noir-badge { position: absolute; top: 12px; left: 12px; font-size: 10px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; padding: 5px 10px; border-radius: 3px; background: rgba(0,0,0,.55); color: #F5F5F2; z-index: 2; }
        .noir-badge.low { background: var(--store-accent); color: var(--store-accent-text); }
        .noir-wish { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,.4); border: 0; display: flex; align-items: center; justify-content: center; color: #F5F5F2; transition: transform .15s ease, background .15s ease; z-index: 2; }
        .noir-wish:hover { transform: scale(1.08); background: rgba(0,0,0,.6); }
        .noir-wish.active { color: #FF6B6B; }
        .noir-wish.active svg { fill: #FF6B6B; }
        .noir-tile-info { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; padding: 14px; }
        .noir-tile-cat { margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: rgba(245,245,242,.62); }
        .noir-tile-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; color: #F5F5F2; }
        .noir-tile-row h3 { margin: 0; font-family: var(--store-display); font-size: 19px; letter-spacing: .01em; text-transform: uppercase; overflow-wrap: anywhere; }
        .noir-tile-row span { font-weight: 800; font-size: 13px; white-space: nowrap; }
        .noir-tile-add { width: 100%; margin-top: 10px; border: 0; background: #F5F5F2; color: #0B0B0C; padding: 10px; border-radius: 3px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; display: flex; align-items: center; justify-content: center; gap: 7px; opacity: 0; transform: translateY(8px); transition: opacity .2s ease, transform .2s ease, background .2s ease; }
        .noir-tile-add:hover { background: var(--store-accent); color: var(--store-accent-text); }
        .noir-tile:hover .noir-tile-add { opacity: 1; transform: translateY(0); }
        .noir-tile-add:disabled { opacity: .5 !important; cursor: not-allowed; transform: none; }
        .noir-empty { grid-column: 1 / -1; border: 1.5px dashed var(--store-line); border-radius: 4px; padding: 44px 18px; text-align: center; color: var(--store-muted); }

        .noir-newsletter { padding: 0 0 70px; }
        .noir-newsletter-inner { background: var(--store-card); border: 1px solid var(--store-line); border-radius: 4px; padding: clamp(30px, 5vw, 52px); display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
        .noir-newsletter-inner h2 { margin: 0 0 6px; font-family: var(--store-display); font-size: 28px; text-transform: uppercase; letter-spacing: .03em; }
        .noir-newsletter-inner p { margin: 0; color: var(--store-muted); font-size: 14px; }
        .noir-newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .noir-newsletter-form input { padding: 13px 16px; border-radius: 4px; border: 1.5px solid var(--store-line); background: var(--store-surface); min-width: 220px; font-size: 14px; outline: none; }
        .noir-newsletter-form input:focus { border-color: var(--store-accent); }
        .noir-newsletter-form button { border: 0; border-radius: 4px; background: var(--store-accent); color: var(--store-accent-text); padding: 13px 20px; font-weight: 800; font-size: 12.5px; text-transform: uppercase; letter-spacing: .06em; }

        @media (max-width: 980px) {
          .noir-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .pdetail-panel { grid-template-columns: 1fr; }
          .pdetail-media { min-height: 280px; }
          .store-footer-grid { grid-template-columns: 1fr 1fr; gap: 26px; }
        }
        @media (max-width: 680px) {
          .only-desktop { display: none !important; }
          .only-mobile { display: inline-flex; }
          .noir-nav-links { display: none; }
          .noir-hero { min-height: 64vh; }
          .noir-strip ul { gap: 18px; padding: 12px 0; }
          .noir-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .noir-tile-add { opacity: 1; transform: none; font-size: 10.5px; padding: 9px; }
          .noir-newsletter-inner { flex-direction: column; align-items: flex-start; }
          .noir-newsletter-form { width: 100%; }
          .noir-newsletter-form input { flex: 1; min-width: 0; }
          .store-footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }
      `}</style>

      <div className="noir-announce">{copy.announcement || 'New drop just landed'}</div>

      <header className="noir-header">
        <div className="store-wrap noir-header-inner">
          <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <StoreIcon name="menu" size={20} />
          </button>
          <a className="noir-brand" href="#top">
            <span className="noir-logo">
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
            </span>
            <strong>{store.businessName}</strong>
          </a>
          <nav className="noir-nav-links only-desktop" aria-label="Store navigation">
            <a href="#shop">Shop</a>
            <a href="#footer">Contact</a>
          </nav>
          <div className="noir-header-actions">
            <label className="noir-search only-desktop">
              <StoreIcon name="search" size={15} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" />
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
          <label className="noir-search">
            <StoreIcon name="search" size={15} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" />
          </label>
          <nav>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </div>

      <section
        className={`noir-hero ${featuredImage ? 'has-image' : ''}`}
        id="top"
        style={featuredImage ? { '--noir-hero-image': `url("${featuredImage}")` } : undefined}
      >
        <div className="noir-hero-inner">
          <div className="store-wrap">
            <span className="noir-eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline}</h1>
            <p>{heroSubtext}</p>
            <div className="noir-hero-ctas">
              <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
              {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
          </div>
        </div>
      </section>

      <section className="noir-strip" aria-label="Store benefits">
        <ul>
          <li><StoreIcon name="truck" size={16} /> Local delivery</li>
          <li><StoreIcon name="shield" size={16} /> Secure checkout</li>
          <li><StoreIcon name="bag" size={16} /> {products.length || 'New'} products</li>
        </ul>
      </section>

      <section className="noir-products" id="shop">
        <div className="store-wrap">
          <div className="noir-section-head">
            <div>
              <h2>{copy.productsHeading}</h2>
              <p>{productsSubheading}</p>
            </div>
            <div className="noir-filters" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`noir-filter-pill ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="noir-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <NoirProductCard
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
              <div className="noir-empty">{products.length ? 'No products match this search yet.' : 'No products have been published yet.'}</div>
            )}
          </div>
        </div>
      </section>

      <section className="noir-newsletter">
        <div className="store-wrap noir-newsletter-inner">
          <div>
            <h2>Join the list</h2>
            <p>Product drops, restocks, and small notes from {store.businessName}.</p>
          </div>
          <form className="noir-newsletter-form" onSubmit={handleNewsletterSubmit}>
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
