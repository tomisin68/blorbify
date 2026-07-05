import { useEffect, useRef, useState } from 'react';
import { getReadableTextColor, getStoreCopy, getStoreSocialLinks, getStoreTemplate, getTemplateTheme } from '../storeTemplates';
import { formatCurrency, getSocialHref, getBusinessTypeLabel } from './storefrontUtils';
import SignatureTemplate from './SignatureTemplate';
import NoirTemplate from './NoirTemplate';

const templateComponents = {
  signature: SignatureTemplate,
  noir: NoirTemplate,
};

const noop = () => {};
const noopSubmit = (event) => event.preventDefault();

const DESIGN_WIDTH = 1280;

export default function LivePreviewFrame({ store, visibleHeight = 620 }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(width / DESIGN_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const template = getStoreTemplate(store.template);
  const theme = getTemplateTheme(store.template, store);
  const accentTextColor = getReadableTextColor(theme.primaryColor, theme.textColor);
  const copy = getStoreCopy(store);
  const socialLinks = getStoreSocialLinks(store);
  const visibleSocialLinks = Object.entries(socialLinks)
    .map(([type, value]) => ({ type, value, href: getSocialHref(type, value) }))
    .filter((link) => link.href);
  const products = Array.isArray(store.products)
    ? store.products.filter((product) => product?.name && product?.imageUrl)
    : [];
  const businessTypeLabel = getBusinessTypeLabel(store.businessType) || 'Shop';
  const footerText = copy.footerText || `${store.businessName || 'Your store'} sources considered products one order at a time.`;
  const heroHeadline = copy.heroHeadline || store.businessName || 'Your store';
  const heroSubtext = copy.heroSubtext || store.description || 'Browse our products and contact us to place your order.';
  const heroEyebrow = copy.heroEyebrow || businessTypeLabel || 'Open online';
  const productsSubheading = copy.productsSubheading || (products.length ? 'Fresh picks from this seller.' : 'This seller is preparing their catalog.');
  const featuredImage = store.bannerUrl || products[0]?.imageUrl || '';
  const secondaryImage = products[1]?.imageUrl || products[2]?.imageUrl || featuredImage;
  const productCategories = ['All', ...Array.from(new Set(
    products.map((product) => product.category || businessTypeLabel).filter(Boolean)
  )).slice(0, 6)];

  const TemplateComponent = templateComponents[template.id] || SignatureTemplate;

  const templateProps = {
    store, theme, accentTextColor, copy, businessTypeLabel, visibleSocialLinks, footerText,
    products, filteredProducts: products, productCategories,
    activeCategory: 'All', setActiveCategory: noop, searchTerm: '', setSearchTerm: noop,
    featuredImage, secondaryImage, heroHeadline, heroSubtext, heroEyebrow, productsSubheading,
    formatCurrency, wishlist: [], isWished: () => false, toggleWishlist: noop, addToCart: noop,
    selectedProduct: null, setSelectedProduct: noop,
    cart: [], cartCount: 0, cartSubtotal: 0, cartTotal: 0,
    deliveryFee: Number(store.deliveryFee || 0), freeShippingThreshold: Number(store.freeShippingThreshold || 75000),
    updateQuantity: noop, removeItem: noop,
    cartOpen: false, setCartOpen: noop, closeCart: noop,
    mobileMenuOpen: false, setMobileMenuOpen: noop,
    customer: { name: '', phone: '', address: '', note: '' }, updateCustomer: noop,
    handleCheckout: noopSubmit, submittingOrder: false, orderPlaced: false,
    newsletterEmail: '', setNewsletterEmail: noop, handleNewsletterSubmit: noopSubmit,
    toasts: [], dismiss: noop,
  };

  return (
    <div ref={containerRef} className="live-preview-frame" style={{ height: visibleHeight }}>
      <style>{`
        .live-preview-frame {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid rgba(25,35,40,0.1);
          box-shadow: 0 26px 60px rgba(15,21,24,0.16);
          background: #fff;
        }
        .live-preview-scale {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          user-select: none;
        }
        .live-preview-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(15,21,24,0.82);
          color: #F6F8F1;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 7px 12px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }
        .live-preview-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #AFFF00;
          box-shadow: 0 0 0 3px rgba(175,255,0,0.28);
        }
        .live-preview-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 90px;
          background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.96));
          pointer-events: none;
        }
      `}</style>
      <div className="live-preview-badge"><span /> Live preview</div>
      <div className="live-preview-scale" style={{ width: DESIGN_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <TemplateComponent {...templateProps} />
      </div>
      <div className="live-preview-fade" />
    </div>
  );
}
