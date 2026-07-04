import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getStoreCopy, getStoreSocialLinks, getTemplateTheme, getStoreTemplate } from './storeTemplates';
import { createStoreSlug } from './storeLinks';

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString()}`;
}

function getSocialHref(type, value) {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return '';
  if (/^https?:\/\//i.test(cleanValue) || /^mailto:/i.test(cleanValue)) return cleanValue;

  const withoutAt = cleanValue.replace(/^@/, '');
  if (type === 'instagram') return `https://instagram.com/${withoutAt}`;
  if (type === 'twitter') return `https://x.com/${withoutAt}`;
  if (type === 'tiktok') return `https://tiktok.com/@${withoutAt}`;
  if (type === 'whatsapp') {
    const digits = cleanValue.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits.startsWith('234') ? digits : `234${digits.replace(/^0/, '')}`}` : '';
  }
  if (type === 'email') return `mailto:${cleanValue}`;
  return cleanValue;
}

function getBusinessTypeLabel(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StoreIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'bag') {
    return <svg {...common}><path d="M6.5 8.5h11l-.9 11h-9.2l-.9-11Z" /><path d="M9 8.5a3 3 0 0 1 6 0" /></svg>;
  }
  if (name === 'heart') {
    return <svg {...common}><path d="M20.5 8.8c0 5-8.5 10.2-8.5 10.2S3.5 13.8 3.5 8.8A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 8.5 1.5Z" /></svg>;
  }
  if (name === 'search') {
    return <svg {...common}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
  }
  if (name === 'menu') {
    return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
  if (name === 'close') {
    return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  }
  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (name === 'minus') {
    return <svg {...common}><path d="M5 12h14" /></svg>;
  }
  if (name === 'truck') {
    return <svg {...common}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></svg>;
  }
  if (name === 'arrow') {
    return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  }
  if (name === 'star') {
    return <svg {...common} fill="currentColor" strokeWidth={1.2}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
  }
  if (name === 'instagram') {
    return <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === 'facebook') {
    return <svg {...common}><path d="M14 8h2V4h-2.4C10.8 4 9 5.8 9 8.6V11H6v4h3v5h4v-5h3l.6-4H13V8.7c0-.5.4-.7 1-.7Z" /></svg>;
  }
  if (name === 'twitter') {
    return <svg {...common}><path d="M4 4l16 16M20 4 4 20" /></svg>;
  }
  if (name === 'tiktok') {
    return <svg {...common}><path d="M14 4v10.2a4.2 4.2 0 1 1-4.2-4.2" /><path d="M14 4c.6 3 2.4 4.8 5 5" /></svg>;
  }
  if (name === 'mail') {
    return <svg {...common}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>;
  }
  if (name === 'sparkles') {
    return <svg {...common}><path d="M12 3 10.4 8.4 5 10l5.4 1.6L12 17l1.6-5.4L19 10l-5.4-1.6L12 3Z" /><path d="M5 16.5 4.3 19 2 19.7 4.3 20.4 5 23l.7-2.6L8 19.7 5.7 19 5 16.5ZM19 14l-.8 2.8-2.7.7 2.7.8L19 21l.8-2.7 2.7-.8-2.7-.7L19 14Z" /></svg>;
  }
  if (name === 'party') {
    return <svg {...common}><path d="m4 20 5.2-15.2L19.5 15 4 20Z" /><path d="M8.8 12.4 12 15.6M12 5c.6-1.3 1.6-2 3-2M16 9c1.1-.1 2.1-.6 3-1.5M18 12c1.3.3 2.3 1 3 2" /></svg>;
  }
  return null;
}

export default function Storefront({ slug }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', note: '' });
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStore() {
      setLoading(true);
      setNotFound(false);
      try {
        const storeSnap = await getDoc(doc(db, 'publicStores', createStoreSlug(slug)));
        if (!active) return;

        if (storeSnap.exists()) {
          setStore(storeSnap.data());
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Public storefront load failed:', error);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStore();
    return () => {
      active = false;
    };
  }, [slug]);

  const template = useMemo(() => getStoreTemplate(store?.template), [store?.template]);
  const theme = useMemo(() => getTemplateTheme(store?.template, store || {}), [store]);
  const copy = useMemo(() => getStoreCopy(store || {}), [store]);
  const socialLinks = useMemo(() => getStoreSocialLinks(store || {}), [store]);
  const visibleSocialLinks = Object.entries(socialLinks)
    .map(([type, value]) => ({ type, value, href: getSocialHref(type, value) }))
    .filter((link) => link.href);
  const products = useMemo(() => (
    Array.isArray(store?.products)
      ? store.products.filter((product) => product?.name && product?.imageUrl)
      : []
  ), [store]);
  const deliveryFee = Number(store?.deliveryFee || 0);
  const cartSubtotal = cart.reduce((total, item) => total + Number(item.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartSubtotal + (cart.length ? deliveryFee : 0);
  const heroHeadline = copy.heroHeadline || store?.businessName || 'Your store';
  const heroSubtext = copy.heroSubtext || store?.description || 'Browse our products and contact us to place your order.';
  const heroEyebrow = copy.heroEyebrow || getBusinessTypeLabel(store?.businessType) || 'Open online';
  const productsSubheading = copy.productsSubheading || (products.length ? 'Fresh picks from this seller.' : 'This seller is preparing their catalog.');
  const featuredImage = store?.bannerUrl || products[0]?.imageUrl || '';
  const businessTypeLabel = getBusinessTypeLabel(store?.businessType) || 'Shop';
  const announcementText = copy.announcement || 'Free shipping on selected orders - handmade in small batches';
  const footerText = copy.footerText || `${store?.businessName || 'Your store'} sources considered products one order at a time.`;
  const freeShippingThreshold = Number(store?.freeShippingThreshold || 75000);
  const remainingForFreeDelivery = Math.max(0, freeShippingThreshold - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, freeShippingThreshold ? (cartSubtotal / freeShippingThreshold) * 100 : 0);
  const productCategories = useMemo(() => {
    const categories = products
      .map((product) => product.category || businessTypeLabel)
      .filter(Boolean);
    return ['All', ...Array.from(new Set(categories)).slice(0, 5)];
  }, [businessTypeLabel, products]);
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const category = product.category || businessTypeLabel;
      const matchesCategory = activeCategory === 'All' || category === activeCategory;
      const matchesSearch = !query || [product.name, product.description, category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, businessTypeLabel, products, searchTerm]);
  const heroSecondaryImage = products[1]?.imageUrl || featuredImage;
  const categoryCards = productCategories
    .filter((category) => category !== 'All')
    .slice(0, 4)
    .map((category) => {
      const categoryProduct = products.find((product) => (product.category || businessTypeLabel) === category) || products[0];
      return {
        name: category,
        count: products.filter((product) => (product.category || businessTypeLabel) === category).length,
        imageUrl: categoryProduct?.imageUrl || featuredImage,
      };
    });
  const productKey = (product) => product?.id || product?.imageUrl || product?.name;
  const toggleWishlist = (product) => {
    const id = productKey(product);
    if (!id) return;
    setWishlist((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const addToCart = (product) => {
    setCheckoutError('');
    setCheckoutSuccess('');
    setCart((current) => {
      const stock = Number(product.stock || 0);
      const id = productKey(product);
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) => (
          item.id === id
            ? { ...item, quantity: stock ? Math.min(item.quantity + 1, stock) : item.quantity + 1 }
            : item
        ));
      }

      return [
        ...current,
        {
          id,
          name: product.name,
          price: Number(product.price || 0),
          imageUrl: product.imageUrl,
          stock,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    setCheckoutError('');
    setCheckoutSuccess('');
    setCart((current) => current
      .map((item) => {
        if (item.id !== productId) return item;
        const max = Number(item.stock || 0);
        const nextQuantity = Math.max(0, max ? Math.min(quantity, max) : quantity);
        return { ...item, quantity: nextQuantity };
      })
      .filter((item) => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    setCheckoutError('');
    setCheckoutSuccess('');
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (!cart.length) {
      setCheckoutError('Add at least one product to your cart.');
      return;
    }

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const address = customer.address.trim();

    if (!name || !phone || !address) {
      setCheckoutError('Enter your name, phone number, and delivery address.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderItems = cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price || 0),
        quantity: item.quantity,
        imageUrl: item.imageUrl || '',
        subtotal: Number(item.price || 0) * item.quantity,
      }));

      await addDoc(collection(db, 'orders'), {
        storeId: store.ownerId,
        storeSlug: store.storeSlug,
        storeName: store.businessName,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerNote: customer.note.trim(),
        items: orderItems,
        subtotal: cartSubtotal,
        deliveryFee,
        total: cartTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setCart([]);
      setCartOpen(false);
      setCustomer({ name: '', phone: '', address: '', note: '' });
      setCheckoutSuccess('Order placed. The seller will contact you shortly.');
    } catch (error) {
      console.error('Order creation failed:', error);
      setCheckoutError('Order could not be placed. Please try again or call the store.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="storefront-loading">
        <style>{`
          .storefront-loading { min-height: 100vh; display: grid; place-items: center; background: #f6f8f1; color: #192328; font-family: Raleway, system-ui, sans-serif; }
          .storefront-loader { width: 42px; height: 42px; border: 3px solid #e3e8d9; border-top-color: #192328; border-radius: 999px; animation: spin .8s linear infinite; margin: 0 auto 12px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div>
          <div className="storefront-loader" />
          <p>Loading store...</p>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="storefront-empty">
        <style>{`
          .storefront-empty { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0f1518; color: #f6f8f1; font-family: Raleway, system-ui, sans-serif; text-align: center; }
          .storefront-empty h1 { margin: 0 0 8px; font-size: clamp(28px, 5vw, 44px); }
          .storefront-empty p { margin: 0; color: #93a2a6; }
        `}</style>
        <div>
          <h1>Store not found</h1>
          <p>This Blorbify store is not published yet.</p>
        </div>
      </div>
    );
  }

  if (template.id === 'oakmoss') {
    const navItems = [
      { label: 'Featured', href: '#featured' },
      { label: 'Categories', href: '#categories' },
      { label: 'Just In', href: '#shop' },
      { label: 'Contact', href: '#footer' },
    ];
    const footerColumns = [
      { title: 'Shop', links: ['New Arrivals', 'Best Sellers', 'Gift Cards'] },
      { title: 'Help', links: ['Shipping & Returns', 'FAQ', 'Contact Us'] },
      { title: 'Studio', links: ['Our Story', 'Journal', 'Wholesale'] },
    ];

    return (
      <main className="oak-store">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340;0,9..144,440;0,9..144,560;0,9..144,650;1,9..144,440;1,9..144,560&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

          .oak-store {
            --paper: ${theme.backgroundColor || '#FAF7F1'};
            --ink: ${theme.textColor || '#16150F'};
            --primary: ${theme.primaryColor || '#1F3D2B'};
            --primary-dark: color-mix(in srgb, ${theme.primaryColor || '#1F3D2B'} 78%, #000);
            --primary-soft: color-mix(in srgb, ${theme.primaryColor || '#1F3D2B'} 14%, #ffffff);
            --secondary: #4C6B8A;
            --accent: #C6952F;
            --accent-soft: #F6ECD6;
            --danger: #B5432D;
            --muted: color-mix(in srgb, ${theme.textColor || '#16150F'} 58%, #ffffff);
            --faint: color-mix(in srgb, ${theme.textColor || '#16150F'} 35%, #ffffff);
            --line: #E7E0D2;
            --surface: ${theme.cardColor || '#FFFFFF'};
            --surface-alt: #F1ECE1;
            --display: Fraunces, Georgia, serif;
            --label: 'Space Grotesk', Inter, system-ui, sans-serif;
            min-height: 100vh;
            background: var(--paper);
            color: var(--ink);
            font-family: Inter, system-ui, sans-serif;
          }
          .oak-store * { box-sizing: border-box; }
          .oak-store button, .oak-store a, .oak-store input, .oak-store textarea { font: inherit; }
          .oak-store button { border: 0; background: none; color: inherit; cursor: pointer; }
          .oak-store a { color: inherit; text-decoration: none; }
          .oak-store img { max-width: 100%; display: block; }
          .announce { background: var(--primary); color: #fff; text-align: center; font-family: var(--label); font-size: 12.5px; padding: 10px 16px; letter-spacing: 0.05em; }
          .site-header { position: sticky; top: 0; z-index: 40; background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
          .site-header__inner { max-width: 1280px; margin: 0 auto; padding: 16px 32px; display: flex; align-items: center; gap: 24px; }
          .brand { display: flex; align-items: center; gap: 9px; margin-right: auto; min-width: 0; }
          .brand__mark { width: 32px; height: 32px; border-radius: 9px; background: var(--accent); color: #231a02; display: flex; align-items: center; justify-content: center; font-family: var(--display); font-weight: 700; overflow: hidden; flex: 0 0 auto; }
          .brand__mark img { width: 100%; height: 100%; object-fit: cover; }
          .brand__name { font-family: var(--display); font-weight: 650; font-size: 24px; letter-spacing: 0; overflow-wrap: anywhere; }
          .site-nav { display: flex; gap: 34px; font-family: var(--label); font-size: 14px; font-weight: 600; color: var(--muted); }
          .site-nav a { position: relative; padding: 4px 0; }
          .site-nav a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -3px; height: 1.5px; background: var(--primary); transform: scaleX(0); transform-origin: right; transition: transform .35s cubic-bezier(.22,1,.36,1); }
          .site-nav a:hover { color: var(--ink); }
          .site-nav a:hover::after { transform: scaleX(1); transform-origin: left; }
          .site-header__actions { display: flex; align-items: center; gap: 4px; }
          .nav-search { display: flex; align-items: center; gap: 9px; background: var(--surface-alt); border: 1px solid transparent; border-radius: 999px; padding: 9px 16px; width: 230px; transition: border-color .2s, background .2s; }
          .nav-search:focus-within { background: var(--surface); border-color: var(--primary); }
          .nav-search input { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--ink); background: transparent; font-size: 13.5px; }
          .icon-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; border: 1.5px solid transparent; transition: background .15s ease, border-color .15s ease; }
          .icon-btn:hover { background: var(--surface-alt); border-color: var(--line); }
          .icon-dot { position: absolute; top: -2px; right: -2px; background: var(--accent); color: #231a02; font-size: 10px; font-weight: 800; min-width: 18px; height: 18px; border: 2px solid var(--paper); border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }
          .only-mobile { display: none; }
          .mobile-menu { position: fixed; inset: 0; z-index: 60; pointer-events: none; }
          .mobile-menu__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); opacity: 0; transition: opacity .25s ease; }
          .mobile-menu__panel { position: absolute; top: 0; left: 0; bottom: 0; width: 78%; max-width: 320px; background: var(--paper); padding: 20px; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; gap: 28px; }
          .mobile-menu--open { pointer-events: auto; }
          .mobile-menu--open .mobile-menu__overlay { opacity: 1; }
          .mobile-menu--open .mobile-menu__panel { transform: translateX(0); }
          .mobile-menu__panel nav { display: flex; flex-direction: column; gap: 20px; font-size: 17px; font-weight: 600; }
          .hero { max-width: 1280px; margin: 0 auto; padding: 64px 32px 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
          .eyebrow { display: inline-flex; align-items: center; gap: 10px; font-family: var(--label); font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); margin-bottom: 18px; }
          .eyebrow::before { content: ""; width: 20px; height: 1px; background: var(--accent); display: inline-block; }
          .hero__line { display: block; }
          .hero h1 { margin: 0; font-family: var(--display); font-size: clamp(40px, 5.4vw, 68px); font-weight: 560; line-height: 1.03; letter-spacing: 0; }
          .hero__sub { margin: 22px 0 32px; font-size: 17.5px; color: var(--muted); max-width: 470px; line-height: 1.65; }
          .hero__ctas { display: flex; gap: 14px; flex-wrap: wrap; }
          .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 26px; border-radius: 999px; font-family: var(--label); font-weight: 700; font-size: 14px; transition: transform .25s cubic-bezier(.22,1,.36,1), background .18s ease, box-shadow .18s ease, border-color .18s ease; white-space: nowrap; border: 1.5px solid transparent; }
          .btn--primary { background: ${theme.buttonColor}; color: ${theme.buttonTextColor}; }
          .btn--primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 8px 20px -8px var(--primary); }
          .btn--ghost { background: transparent; color: var(--ink); border: 1.5px solid var(--line); }
          .btn--ghost:hover { border-color: var(--ink); background: var(--ink); color: var(--paper); }
          .btn--block { width: 100%; }
          .hero-trust { display: flex; gap: 22px; margin-top: 34px; flex-wrap: wrap; }
          .hero-trust .item { display: flex; align-items: center; gap: 9px; font-family: var(--label); font-size: 12.5px; color: var(--muted); }
          .hero-trust svg { color: var(--primary); }
          .hero__art { position: relative; aspect-ratio: 1 / 1; background: transparent; }
          .hero-frame { position: absolute; overflow: hidden; border-radius: 26px; box-shadow: 0 30px 60px -20px rgba(22,21,15,.28); background: var(--surface-alt); }
          .hero-frame--main { width: 76%; height: 82%; top: 0; left: 0; }
          .hero-frame--small { width: 46%; height: 52%; right: 0; bottom: 0; border: 6px solid var(--paper); }
          .hero-frame img { width: 100%; height: 100%; object-fit: cover; }
          .float-card { position: absolute; top: 14px; right: -14px; z-index: 3; display: flex; align-items: center; gap: 10px; border-radius: 14px; background: var(--surface); box-shadow: 0 12px 28px -12px rgba(22,21,15,.24); padding: 14px 18px; font-family: var(--label); }
          .float-card b { display: block; font-size: 14px; }
          .float-card span { display: block; color: var(--muted); font-size: 11.5px; }
          .float-tag { position: absolute; left: -16px; bottom: 22%; z-index: 3; display: flex; align-items: center; gap: 7px; border-radius: 999px; background: var(--primary); color: #fff; padding: 10px 16px; font-family: var(--label); font-size: 12.5px; font-weight: 700; box-shadow: 0 12px 28px -12px rgba(22,21,15,.24); }
          .float-tag .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--accent); }
          .trust-strip { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--surface-alt); }
          .trust-strip ul { max-width: 1280px; margin: 0 auto; padding: 20px 32px; list-style: none; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 18px; }
          .trust-strip li { display: flex; align-items: center; gap: 11px; font-family: var(--label); font-size: 12.5px; color: var(--muted); }
          .categories, .shop, .promo-section { max-width: 1280px; margin: 0 auto; padding: 76px 32px; }
          .section-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 38px; }
          .section-head h2 { margin: 10px 0 0; font-family: var(--display); font-weight: 560; font-size: clamp(30px, 3.6vw, 44px); letter-spacing: 0; }
          .section-head p { margin: 12px 0 0; color: var(--muted); max-width: 430px; line-height: 1.6; }
          .tabs { display: flex; gap: 8px; flex-wrap: wrap; }
          .tab { padding: 9px 18px; border-radius: 999px; font-family: var(--label); font-size: 13px; font-weight: 700; border: 1.5px solid var(--line); background: var(--surface); color: var(--muted); transition: all .15s ease; }
          .tab:hover, .tab--on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary); }
          .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .cat-card { position: relative; min-height: 320px; border-radius: 26px; overflow: hidden; background: var(--surface-alt); }
          .cat-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s cubic-bezier(.22,1,.36,1); }
          .cat-card:hover img { transform: scale(1.06); }
          .cat-card::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(16,15,10,.72), rgba(16,15,10,0) 58%); }
          .cat-card__label { position: absolute; left: 20px; bottom: 18px; z-index: 2; color: #fff; }
          .cat-card__label b { display: block; font-family: var(--display); font-size: 22px; font-weight: 560; }
          .cat-card__label span { font-family: var(--label); font-size: 12px; opacity: .86; }
          .product-grid { display: grid; grid-template-columns: repeat(6, 1fr); grid-auto-rows: 120px; gap: 20px; }
          .product-grid .product-card:nth-child(1) { grid-column: span 3; grid-row: span 4; }
          .product-grid .product-card:nth-child(2), .product-grid .product-card:nth-child(3) { grid-column: span 3; grid-row: span 2; }
          .product-grid .product-card:nth-child(n+4) { grid-column: span 2; grid-row: span 3; }
          .product-card { cursor: pointer; min-width: 0; }
          .product-card__media { position: relative; height: calc(100% - 96px); min-height: 0; border-radius: 26px; overflow: hidden; background: var(--surface-alt); }
          .product-card__media img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
          .product-card:hover .product-card__media img { transform: scale(1.04); }
          .badge { position: absolute; top: 12px; left: 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; padding: 5px 10px; border-radius: 999px; background: var(--surface); color: var(--ink); text-transform: uppercase; z-index: 2; }
          .badge--sale { background: var(--accent); color: #fff; }
          .badge--new { background: var(--secondary); color: #fff; }
          .badge--bestseller { background: var(--primary); color: ${theme.buttonTextColor}; }
          .wish-btn { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.92); display: flex; align-items: center; justify-content: center; color: var(--ink); transition: transform .15s ease; z-index: 2; }
          .wish-btn:hover { transform: scale(1.08); }
          .wish-btn--active { color: var(--danger); }
          .wish-btn--active svg { fill: var(--danger); }
          .quick-add { position: absolute; left: 14px; right: 14px; bottom: 14px; background: var(--ink); color: var(--paper); padding: 12px; border-radius: 999px; font-family: var(--label); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; opacity: 0; transform: translateY(8px); transition: opacity .2s ease, transform .2s ease, background .2s ease; z-index: 2; }
          .quick-add:hover { background: var(--primary); }
          .product-card:hover .quick-add { opacity: 1; transform: translateY(0); }
          .quick-add:disabled { opacity: .55; cursor: not-allowed; transform: none; }
          .product-card__body { height: 96px; padding: 14px 4px 4px; }
          .product-card__cat { font-family: var(--label); font-size: 10.5px; color: var(--faint); font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; margin: 0 0 4px; }
          .product-card__name { font-family: var(--display); font-size: 18px; font-weight: 500; margin: 0 0 6px; overflow-wrap: anywhere; }
          .product-grid .product-card:nth-child(1) .product-card__name { font-size: 26px; }
          .product-card__price { margin-top: 6px; font-family: var(--label); color: var(--primary); font-weight: 800; font-size: 15px; display: flex; gap: 8px; align-items: baseline; }
          .stars-row { display: flex; align-items: center; gap: 6px; }
          .stars { display: flex; gap: 1px; color: var(--accent); }
          .stars-count { font-size: 12px; color: var(--muted); }
          .drawer { position: fixed; inset: 0; z-index: 70; pointer-events: none; }
          .drawer__overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); opacity: 0; transition: opacity .3s ease; }
          .drawer__panel { position: absolute; top: 0; right: 0; bottom: 0; width: 420px; max-width: 92vw; background: var(--paper); display: flex; flex-direction: column; transform: translateX(100%); transition: transform .35s cubic-bezier(.4,0,.2,1); }
          .drawer--open { pointer-events: auto; }
          .drawer--open .drawer__overlay { opacity: 1; }
          .drawer--open .drawer__panel { transform: translateX(0); }
          .drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px; border-bottom: 1px solid var(--line); }
          .drawer__head h3 { display: flex; align-items: center; gap: 9px; font-size: 18px; margin: 0; }
          .drawer__empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--muted); padding: 40px; text-align: center; }
          .drawer__items { flex: 1; overflow-y: auto; padding: 6px 22px; }
          .cart-item { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--line); }
          .cart-item__img { width: 72px; height: 72px; border-radius: 12px; overflow: hidden; background: var(--surface-alt); flex-shrink: 0; }
          .cart-item__img img { width: 100%; height: 100%; object-fit: cover; }
          .cart-item__info { flex: 1; min-width: 0; }
          .cart-item__name { font-weight: 600; font-size: 14px; margin: 0 0 3px; overflow-wrap: anywhere; }
          .cart-item__variant { font-size: 12px; color: var(--muted); margin: 0 0 8px; text-transform: capitalize; }
          .cart-item__row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 10px; }
          .cart-item__price { font-weight: 700; font-size: 13.5px; }
          .cart-item__remove { align-self: flex-start; color: var(--muted); padding: 4px; }
          .cart-item__remove:hover { color: var(--accent); }
          .qty-stepper { display: inline-flex; align-items: center; border: 1.5px solid var(--line); border-radius: 999px; overflow: hidden; }
          .qty-stepper button { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; }
          .qty-stepper button:hover { background: var(--surface-alt); }
          .qty-stepper span { width: 22px; text-align: center; font-weight: 700; font-size: 12.5px; }
          .drawer__foot { padding: 18px 22px 22px; border-top: 1px solid var(--line); }
          .ship-bar { padding: 14px 0; }
          .ship-bar__msg { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 9px; }
          .ship-bar__track { height: 6px; border-radius: 999px; background: var(--line); overflow: hidden; }
          .ship-bar__fill { height: 100%; background: var(--primary); border-radius: 999px; transition: width .4s ease; }
          .drawer__subtotal { display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
          .drawer__note { font-size: 12px; color: var(--muted); margin: 0 0 14px; }
          .drawer-form { display: grid; gap: 9px; margin-top: 12px; }
          .drawer-form input, .drawer-form textarea { width: 100%; padding: 11px 13px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--ink); outline: none; }
          .drawer-form textarea { min-height: 70px; resize: vertical; }
          .drawer-form input:focus, .drawer-form textarea:focus { border-color: var(--primary); }
          .store-alert { border-radius: 12px; padding: 10px 11px; font-size: 12px; font-weight: 800; line-height: 1.45; }
          .store-alert.error { color: #9d2525; background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.24); }
          .store-alert.success { color: #3d5900; background: rgba(175,255,0,.18); border: 1px solid rgba(175,255,0,.32); }
          .newsletter { padding: 70px 28px; }
          .newsletter__inner { max-width: 1000px; margin: 0 auto; background: var(--ink); color: var(--paper); border-radius: 24px; padding: 48px; display: flex; align-items: center; justify-content: space-between; gap: 30px; flex-wrap: wrap; }
          .newsletter__inner h2 { font-family: Fraunces, serif; font-size: 26px; margin: 0 0 8px; letter-spacing: 0; }
          .newsletter__inner p { color: color-mix(in srgb, var(--paper) 70%, transparent); margin: 0; }
          .newsletter__form { display: flex; gap: 10px; flex-wrap: wrap; }
          .newsletter__form input { padding: 13px 16px; border-radius: 999px; border: none; min-width: 220px; font-size: 14px; outline: none; }
          .newsletter__form input:focus { outline: 2px solid var(--primary); }
          .site-footer { max-width: 1280px; margin: 0 auto; padding: 60px 28px 28px; }
          .site-footer__grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid var(--line); }
          .site-footer__brand p { color: var(--muted); font-size: 13.5px; margin: 14px 0 18px; max-width: 280px; line-height: 1.6; }
          .social-row { display: flex; gap: 10px; flex-wrap: wrap; }
          .social-row a { min-width: 34px; height: 34px; padding: 0 10px; border-radius: 999px; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .social-row a:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
          .site-footer__col h4 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px; }
          .site-footer__col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
          .site-footer__col a { font-size: 13.5px; color: var(--muted); }
          .site-footer__col a:hover { color: var(--ink); }
          .site-footer__bottom { display: flex; justify-content: space-between; padding-top: 22px; font-size: 12px; color: var(--muted); flex-wrap: wrap; gap: 8px; }
          .empty-shop { border: 1.5px dashed var(--line); border-radius: 16px; padding: 42px 18px; text-align: center; color: var(--muted); grid-column: 1 / -1; }
          .promo { position: relative; min-height: 380px; display: flex; align-items: center; overflow: hidden; border-radius: 26px; background: var(--primary); color: #fff; }
          .promo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .48; mix-blend-mode: multiply; }
          .promo__copy { position: relative; z-index: 1; max-width: 560px; padding: clamp(34px, 6vw, 70px); }
          .promo__copy h2 { font-family: var(--display); font-weight: 560; font-size: clamp(32px, 5vw, 56px); line-height: 1.03; margin: 0 0 16px; }
          .promo__copy p { color: rgba(255,255,255,.82); line-height: 1.65; margin: 0 0 24px; }
          .product-modal { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; pointer-events: none; }
          .product-modal__overlay { position: absolute; inset: 0; background: rgba(22,21,15,.48); opacity: 0; transition: opacity .25s ease; }
          .product-modal__panel { position: relative; z-index: 1; width: min(980px, 100%); max-height: min(760px, calc(100vh - 48px)); overflow: auto; background: var(--paper); border-radius: 26px; box-shadow: 0 30px 80px -20px rgba(22,21,15,.46); transform: translateY(18px) scale(.98); opacity: 0; transition: transform .25s cubic-bezier(.22,1,.36,1), opacity .25s ease; }
          .product-modal--open { pointer-events: auto; }
          .product-modal--open .product-modal__overlay, .product-modal--open .product-modal__panel { opacity: 1; }
          .product-modal--open .product-modal__panel { transform: translateY(0) scale(1); }
          .product-detail { display: grid; grid-template-columns: minmax(280px, .95fr) minmax(0, 1fr); gap: 34px; padding: 24px; }
          .product-detail__media { border-radius: 20px; overflow: hidden; background: var(--surface-alt); min-height: 420px; }
          .product-detail__media img { width: 100%; height: 100%; object-fit: cover; }
          .product-detail__copy { padding: 14px 10px 10px 0; }
          .product-detail__top { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
          .product-detail h3 { font-family: var(--display); font-weight: 560; font-size: clamp(30px, 4vw, 46px); line-height: 1.04; margin: 8px 0 12px; }
          .product-detail__desc { color: var(--muted); line-height: 1.7; margin: 0 0 18px; }
          .detail-price { color: var(--primary); font-family: var(--label); font-size: 20px; font-weight: 800; margin-bottom: 18px; }
          .detail-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 20px 0; }
          .detail-meta div { border: 1px solid var(--line); border-radius: 14px; background: var(--surface); padding: 12px; }
          .detail-meta span { display: block; color: var(--faint); font-family: var(--label); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
          .detail-meta b { display: block; margin-top: 4px; font-size: 13.5px; }
          .detail-actions { display: flex; gap: 10px; flex-wrap: wrap; }
          @media (max-width: 980px) {
            .hero { grid-template-columns: 1fr; padding-top: 32px; }
            .hero h1 { font-size: 36px; }
            .product-grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: auto; }
            .product-grid .product-card, .product-grid .product-card:nth-child(n) { grid-column: span 1; grid-row: auto; }
            .product-card__media { height: auto; aspect-ratio: 4 / 5; }
            .cat-grid { grid-template-columns: repeat(2, 1fr); }
            .site-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          }
          @media (max-width: 680px) {
            .only-desktop { display: none; }
            .only-mobile { display: inline-flex; }
            .site-header__inner { padding: 12px 16px; }
            .hero { padding: 24px 18px 56px; gap: 32px; }
            .hero h1 { font-size: 30px; }
            .hero-trust { gap: 14px; }
            .categories, .shop, .promo-section { padding: 46px 18px; }
            .section-head { align-items: flex-start; }
            .product-grid { grid-template-columns: repeat(2, 1fr); gap: 18px 14px; }
            .cat-grid { grid-template-columns: 1fr; }
            .quick-add { font-size: 11.5px; padding: 9px; opacity: 1; transform: none; }
            .newsletter__inner { padding: 32px 24px; flex-direction: column; align-items: flex-start; }
            .newsletter__form { width: 100%; }
            .newsletter__form input { flex: 1; min-width: 0; }
            .site-footer__grid { grid-template-columns: 1fr; gap: 28px; }
            .drawer__panel { width: 100%; max-width: 100%; }
            .product-detail { grid-template-columns: 1fr; padding: 16px; }
            .product-detail__media { min-height: 280px; }
            .product-detail__copy { padding: 0; }
            .float-card, .float-tag { display: none; }
          }
        `}</style>

        <div className="announce">{announcementText}</div>
        <header className="site-header">
          <div className="site-header__inner">
            <button className="icon-btn only-mobile" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <StoreIcon name="menu" size={20} />
            </button>
            <a className="brand" href="#top" aria-label={store.businessName}>
              <span className="brand__mark">
                {store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}
              </span>
              <span className="brand__name">{store.businessName}</span>
            </a>
            <nav className="site-nav only-desktop" aria-label="Store navigation">
              {navItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
            </nav>
            <div className="site-header__actions">
              <label className="nav-search only-desktop" htmlFor="store-search">
                <StoreIcon name="search" size={17} />
                <input
                  id="store-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products"
                />
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

        <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`}>
          <div className="mobile-menu__overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-menu__panel">
            <button className="icon-btn" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><StoreIcon name="close" size={20} /></button>
            <label className="nav-search" htmlFor="mobile-store-search">
              <StoreIcon name="search" size={17} />
              <input
                id="mobile-store-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products"
              />
            </label>
            <nav>
              {navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>)}
            </nav>
          </div>
        </div>

        <section className="hero" id="top">
          <div className="hero__text">
            <span className="eyebrow">{heroEyebrow}</span>
            <h1>{heroHeadline.split('\n').map((line, index) => <span key={`${line}-${index}`} className="hero__line">{line}</span>)}</h1>
            <p className="hero__sub">{heroSubtext}</p>
            <div className="hero__ctas">
              <a className="btn btn--primary" href="#shop">{copy.primaryButtonLabel}<StoreIcon name="arrow" size={16} /></a>
              {store.phone && <a className="btn btn--ghost" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
            <div className="hero-trust" aria-label="Store highlights">
              <div className="item"><StoreIcon name="truck" size={17} /> Local delivery</div>
              <div className="item"><StoreIcon name="sparkles" size={17} /> Fresh arrivals</div>
              <div className="item"><StoreIcon name="heart" size={17} /> Carefully selected</div>
            </div>
          </div>
          <div className="hero__art">
            <div className="hero-frame hero-frame--main">
              {featuredImage && <img src={featuredImage} alt={`${store.businessName} featured`} />}
            </div>
            <div className="hero-frame hero-frame--small">
              {heroSecondaryImage && <img src={heroSecondaryImage} alt="" />}
            </div>
            <div className="float-card">
              <div className="stars"><StoreIcon name="star" size={14} /><StoreIcon name="star" size={14} /><StoreIcon name="star" size={14} /><StoreIcon name="star" size={14} /><StoreIcon name="star" size={14} /></div>
              <div><b>{products.length || 'New'} pieces</b><span>Ready to order</span></div>
            </div>
            <div className="float-tag"><span className="dot" /> {businessTypeLabel}</div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Shopping benefits">
          <ul>
            <li><StoreIcon name="truck" size={19} /> Delivery fee from {formatCurrency(deliveryFee)}</li>
            <li><StoreIcon name="sparkles" size={19} /> Small-batch catalog updates</li>
            <li><StoreIcon name="heart" size={19} /> Save favorite products</li>
            <li><StoreIcon name="bag" size={19} /> Checkout directly with the seller</li>
          </ul>
        </section>

        {categoryCards.length > 0 && (
          <section className="categories" id="categories">
            <div className="section-head">
              <div>
                <span className="eyebrow">Browse by mood</span>
                <h2>Shop curated categories</h2>
              </div>
              <p>Move quickly through the catalog by the collections this seller has prepared.</p>
            </div>
            <div className="cat-grid">
              {categoryCards.map((category) => (
                <button
                  className="cat-card"
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.name);
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {category.imageUrl && <img src={category.imageUrl} alt="" />}
                  <span className="cat-card__label">
                    <b>{category.name}</b>
                    <span>{category.count} item{category.count === 1 ? '' : 's'}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="shop" id="shop">
          <div className="section-head">
            <div>
              <span className="eyebrow" id="featured">New Arrivals</span>
              <h2>{copy.productsHeading}</h2>
              <p>{productsSubheading}</p>
            </div>
            <div className="tabs" aria-label="Product categories">
              {productCategories.map((category) => (
                <button
                  className={`tab ${activeCategory === category ? 'tab--on' : ''}`}
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="product-grid">
            {filteredProducts.length ? filteredProducts.map((product, index) => {
              const stock = Number(product.stock || 0);
              const badge = index === 0 ? 'Bestseller' : index === 1 ? 'Sale' : index === 2 ? 'New' : '';
              const badgeClass = badge === 'Bestseller' ? 'badge--bestseller' : badge === 'Sale' ? 'badge--sale' : 'badge--new';
              const isWished = wishlist.includes(productKey(product));
              return (
                <article className="product-card" key={productKey(product)}>
                  <div className="product-card__media" onClick={() => setSelectedProduct(product)} role="button" tabIndex={0}>
                    <img src={product.imageUrl} alt={product.name} />
                    {badge && <span className={`badge ${badgeClass}`}>{badge}</span>}
                    <button
                      className={`wish-btn ${isWished ? 'wish-btn--active' : ''}`}
                      type="button"
                      aria-label={`${isWished ? 'Remove' : 'Save'} ${product.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWishlist(product);
                      }}
                    >
                      <StoreIcon name="heart" size={16} />
                    </button>
                    <button className="quick-add" type="button" onClick={() => { addToCart(product); setCartOpen(true); }} disabled={stock <= 0}>
                      <StoreIcon name="bag" size={15} />
                      {stock <= 0 ? 'Out of stock' : copy.addToCartLabel}
                    </button>
                  </div>
                  <div className="product-card__body" onClick={() => setSelectedProduct(product)} role="button" tabIndex={0}>
                    <p className="product-card__cat">{product.category || businessTypeLabel}</p>
                    <h3 className="product-card__name">{product.name}</h3>
                    <div className="stars-row">
                      <div className="stars">{Array.from({ length: 5 }).map((_, starIndex) => <StoreIcon key={starIndex} name="star" size={13} />)}</div>
                      <span className="stars-count">({Math.max(12, Number(product.stock || 0) * 3)})</span>
                    </div>
                    <div className="product-card__price">{formatCurrency(product.price)}</div>
                  </div>
                </article>
              );
            }) : (
              <div className="empty-shop">{products.length ? 'No products match this search yet.' : 'No products have been published yet.'}</div>
            )}
          </div>
        </section>

        <section className="promo-section">
          <div className="promo">
            {featuredImage && <img src={featuredImage} alt="" />}
            <div className="promo__copy">
              <h2>Considered pieces, ready when you are.</h2>
              <p>{footerText}</p>
              <a className="btn btn--primary" href="#shop">Keep browsing</a>
            </div>
          </div>
        </section>

        <div className={`product-modal ${selectedProduct ? 'product-modal--open' : ''}`} aria-hidden={!selectedProduct}>
          <div className="product-modal__overlay" onClick={() => setSelectedProduct(null)} />
          {selectedProduct && (
            <article className="product-modal__panel" aria-label={selectedProduct.name}>
              <div className="product-detail">
                <div className="product-detail__media">
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                </div>
                <div className="product-detail__copy">
                  <div className="product-detail__top">
                    <span className="eyebrow">{selectedProduct.category || businessTypeLabel}</span>
                    <button className="icon-btn" type="button" onClick={() => setSelectedProduct(null)} aria-label="Close product details">
                      <StoreIcon name="close" size={18} />
                    </button>
                  </div>
                  <h3>{selectedProduct.name}</h3>
                  <div className="stars-row">
                    <div className="stars">{Array.from({ length: 5 }).map((_, starIndex) => <StoreIcon key={starIndex} name="star" size={14} />)}</div>
                    <span className="stars-count">({Math.max(12, Number(selectedProduct.stock || 0) * 3)} reviews)</span>
                  </div>
                  <div className="detail-price">{formatCurrency(selectedProduct.price)}</div>
                  {selectedProduct.description && <p className="product-detail__desc">{selectedProduct.description}</p>}
                  <div className="detail-meta">
                    <div>
                      <span>Availability</span>
                      <b>{Number(selectedProduct.stock || 0) > 0 ? `${Number(selectedProduct.stock || 0)} in stock` : 'Out of stock'}</b>
                    </div>
                    <div>
                      <span>Delivery</span>
                      <b>{formatCurrency(deliveryFee)}</b>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                        setCartOpen(true);
                      }}
                      disabled={Number(selectedProduct.stock || 0) <= 0}
                    >
                      <StoreIcon name="bag" size={16} />
                      {Number(selectedProduct.stock || 0) <= 0 ? 'Out of stock' : copy.addToCartLabel}
                    </button>
                    <button className="btn btn--ghost" type="button" onClick={() => toggleWishlist(selectedProduct)}>
                      <StoreIcon name="heart" size={16} />
                      {wishlist.includes(productKey(selectedProduct)) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>

        <div className={`drawer ${cartOpen ? 'drawer--open' : ''}`}>
          <div className="drawer__overlay" onClick={() => setCartOpen(false)} />
          <aside className="drawer__panel" aria-label="Shopping cart">
            <div className="drawer__head">
              <h3><StoreIcon name="bag" size={18} /> Your cart</h3>
              <button className="icon-btn" type="button" onClick={() => setCartOpen(false)} aria-label="Close cart"><StoreIcon name="close" size={18} /></button>
            </div>
            {cart.length ? (
              <div className="drawer__items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item__img"><img src={item.imageUrl} alt="" /></div>
                    <div className="cart-item__info">
                      <p className="cart-item__name">{item.name}</p>
                      <p className="cart-item__variant">{formatCurrency(item.price)}</p>
                      <div className="cart-item__row">
                        <div className="qty-stepper">
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Reduce ${item.name}`}><StoreIcon name="minus" size={13} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}><StoreIcon name="plus" size={13} /></button>
                        </div>
                        <span className="cart-item__price">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button className="cart-item__remove" type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}><StoreIcon name="close" size={15} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="drawer__empty">
                <StoreIcon name="bag" size={34} />
                <p>Your cart is empty.</p>
              </div>
            )}
            <div className="drawer__foot">
              <div className="ship-bar">
                <div className="ship-bar__msg">
                  <StoreIcon name="truck" size={15} />
                  {cartSubtotal >= freeShippingThreshold ? (
                    <span><strong>Free delivery unlocked.</strong></span>
                  ) : (
                    <span>Add <strong>{formatCurrency(remainingForFreeDelivery)}</strong> more for free delivery</span>
                  )}
                </div>
                <div className="ship-bar__track"><div className="ship-bar__fill" style={{ width: `${freeDeliveryProgress}%` }} /></div>
              </div>
              <div className="drawer__subtotal"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
              <div className="drawer__subtotal"><span>Delivery</span><span>{cart.length ? formatCurrency(deliveryFee) : formatCurrency(0)}</span></div>
              <div className="drawer__subtotal"><span>Total</span><span>{formatCurrency(cartTotal)}</span></div>
              <p className="drawer__note">The seller will confirm delivery details after checkout.</p>
              <form className="drawer-form" onSubmit={handleCheckout}>
                <input value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} placeholder="Your name" />
                <input value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="Phone number" />
                <textarea value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} placeholder="Delivery address" />
                <textarea value={customer.note} onChange={(event) => updateCustomer('note', event.target.value)} placeholder="Delivery note" />
                {checkoutError && <div className="store-alert error">{checkoutError}</div>}
                {checkoutSuccess && <div className="store-alert success">{checkoutSuccess}</div>}
                <button className="btn btn--primary btn--block" type="submit" disabled={submittingOrder || !cart.length}>
                  {submittingOrder ? 'Placing order...' : copy.checkoutLabel}
                </button>
              </form>
            </div>
          </aside>
        </div>

        <section className="newsletter">
          <div className="newsletter__inner">
            <div>
              <h2>Join the list</h2>
              <p>Product drops, restocks, and small notes from {store.businessName}.</p>
            </div>
            <form
              className="newsletter__form"
              onSubmit={(event) => {
                event.preventDefault();
                setNewsletterEmail('');
                setNewsletterMessage('You are on the list.');
              }}
            >
              <input type="email" value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); setNewsletterMessage(''); }} placeholder="you@example.com" required />
              <button className="btn btn--primary" type="submit">Subscribe</button>
            </form>
            {newsletterMessage && <p>{newsletterMessage}</p>}
          </div>
        </section>

        <footer className="site-footer" id="footer">
          <div className="site-footer__grid" id="about">
            <div className="site-footer__brand">
              <a className="brand" href="#top">
                <span className="brand__mark">{store.logoUrl ? <img src={store.logoUrl} alt="" /> : store.businessName.charAt(0)}</span>
                <span className="brand__name">{store.businessName}</span>
              </a>
              <p>{footerText}</p>
              {visibleSocialLinks.length > 0 && (
                <div className="social-row">
                  {visibleSocialLinks.map((link) => (
                    <a key={link.type} href={link.href} target={link.type === 'email' ? undefined : '_blank'} rel={link.type === 'email' ? undefined : 'noreferrer'}>{link.type.slice(0, 2)}</a>
                  ))}
                </div>
              )}
            </div>
            {footerColumns.map((column) => (
              <div key={column.title} className="site-footer__col">
                <h4>{column.title}</h4>
                <ul>
                  {column.links.map((link) => <li key={link}><a href="#shop">{link}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="site-footer__bottom">
            <span>© {new Date().getFullYear()} {store.businessName}. All rights reserved.</span>
            <span className="site-footer__made">Built with Blorbify</span>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className={`storefront storefront-${template.id} layout-${template.layout}`}>
      <style>{`
        .storefront {
          --store-accent: ${theme.primaryColor};
          --store-accent-text: ${theme.buttonTextColor};
          --store-ink: ${theme.textColor};
          --store-surface: ${theme.backgroundColor};
          --store-card: ${theme.cardColor};
          --store-button: ${theme.buttonColor};
          --store-button-text: ${theme.buttonTextColor};
          --store-muted: color-mix(in srgb, var(--store-ink) 68%, #ffffff);
          min-height: 100vh;
          background: var(--store-surface);
          color: var(--store-ink);
          font-family: Raleway, system-ui, sans-serif;
        }
        .storefront * { box-sizing: border-box; }
        .store-wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
        .store-announcement { background: var(--store-ink); color: var(--store-surface); text-align: center; padding: 9px 16px; font-size: 12px; font-weight: 800; letter-spacing: .02em; }
        .store-hero { padding: 28px 0 34px; }
        .store-nav { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 16px 0 28px; }
        .store-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .store-logo { width: 48px; height: 48px; border-radius: 8px; background: var(--store-accent); display: grid; place-items: center; overflow: hidden; color: var(--store-accent-text); font-weight: 900; flex: 0 0 auto; }
        .store-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .store-brand strong { display: block; font-size: 18px; overflow-wrap: anywhere; }
        .store-brand span { display: block; color: var(--store-muted); font-size: 13px; margin-top: 2px; }
        .store-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .store-contact, .store-social-link { border: 1px solid color-mix(in srgb, var(--store-ink) 13%, transparent); border-radius: 999px; color: var(--store-ink); text-decoration: none; padding: 10px 14px; font-weight: 800; font-size: 13px; background: color-mix(in srgb, var(--store-card) 74%, transparent); }
        .store-socials { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .store-social-link { width: 38px; height: 38px; padding: 0; display: inline-grid; place-items: center; text-transform: uppercase; }
        .store-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .75fr); gap: clamp(22px, 5vw, 64px); align-items: end; padding: clamp(24px, 5vw, 58px); border-radius: 8px; background: var(--store-card); border: 1px solid color-mix(in srgb, var(--store-ink) 10%, transparent); background-position: center; background-size: cover; }
        .store-hero-grid.has-banner { color: #fff; min-height: clamp(440px, 58vh, 620px); border-color: rgba(255,255,255,.18); }
        .store-hero h1 { margin: 0; font-size: clamp(38px, 7vw, 78px); line-height: .95; letter-spacing: 0; max-width: 760px; }
        .store-hero p { color: var(--store-muted); line-height: 1.7; margin: 18px 0 0; max-width: 620px; }
        .store-hero-grid.has-banner .store-hero-copy p { color: rgba(255,255,255,.84); }
        .store-pill { display: inline-flex; width: fit-content; border-radius: 999px; background: var(--store-accent); color: var(--store-accent-text); padding: 8px 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 16px; }
        .store-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
        .store-cta { border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); display: inline-flex; align-items: center; justify-content: center; padding: 12px 18px; font: inherit; font-size: 14px; font-weight: 900; text-decoration: none; }
        .store-cta.secondary { border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: transparent; color: currentColor; }
        .store-feature { border-radius: 8px; background: var(--store-ink); color: #fff; padding: 22px; }
        .store-feature span { color: color-mix(in srgb, var(--store-accent) 45%, white); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .store-feature strong { display: block; font-size: 26px; margin-top: 10px; }
        .store-feature small { display: block; margin-top: 8px; color: rgba(255,255,255,.72); font-size: 13px; font-weight: 800; }
        .store-hero-grid.has-banner .store-feature { background: rgba(15,21,24,.72); border: 1px solid rgba(255,255,255,.14); }
        .store-hero-media { display: none; }
        .store-products { padding: 18px 0 56px; }
        .store-section-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
        .store-section-head h2 { margin: 0; font-size: clamp(24px, 4vw, 38px); }
        .store-section-head p { margin: 0; color: var(--store-muted); }
        .store-shop-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: start; }
        .store-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .store-product { background: var(--store-card); border: 1px solid color-mix(in srgb, var(--store-ink) 10%, transparent); border-radius: 8px; overflow: hidden; min-width: 0; }
        .store-product img { width: 100%; aspect-ratio: 1 / .82; object-fit: cover; display: block; background: #e8eddf; }
        .store-product-body { padding: 14px; display: grid; gap: 9px; }
        .store-product h3 { margin: 0; font-size: 17px; letter-spacing: 0; overflow-wrap: anywhere; }
        .store-product p { margin: 0; color: var(--store-muted); font-size: 13px; line-height: 1.5; }
        .store-product-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .store-price { font-weight: 900; font-size: 16px; }
        .store-stock { color: var(--store-muted); font-size: 12px; font-weight: 800; }
        .store-add { width: 100%; border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); display: inline-flex; align-items: center; justify-content: center; padding: 11px 14px; font: inherit; font-size: 13px; font-weight: 900; cursor: pointer; }
        .store-add:disabled { opacity: .55; cursor: not-allowed; }
        .store-cart { position: sticky; top: 16px; border: 1px solid color-mix(in srgb, var(--store-ink) 10%, transparent); border-radius: 8px; background: var(--store-card); padding: 16px; display: grid; gap: 14px; min-width: 0; }
        .store-cart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .store-cart h3 { margin: 0; font-size: 20px; }
        .store-cart-count { border-radius: 999px; background: color-mix(in srgb, var(--store-accent) 22%, #fff); color: var(--store-ink); padding: 5px 9px; font-size: 12px; font-weight: 900; }
        .store-cart-items { display: grid; gap: 10px; }
        .store-cart-item { display: grid; grid-template-columns: 54px minmax(0, 1fr); gap: 10px; align-items: center; }
        .store-cart-item img { width: 54px; height: 54px; border-radius: 8px; object-fit: cover; background: #e8eddf; }
        .store-cart-item strong { display: block; color: var(--store-ink); font-size: 13px; overflow-wrap: anywhere; }
        .store-cart-item span { color: var(--store-muted); font-size: 12px; }
        .store-cart-controls { display: flex; align-items: center; gap: 6px; margin-top: 7px; }
        .store-cart-controls button { width: 28px; height: 28px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--store-ink) 12%, transparent); background: #fff; color: var(--store-ink); font: inherit; font-weight: 900; cursor: pointer; }
        .store-cart-controls b { min-width: 20px; text-align: center; color: var(--store-ink); font-size: 13px; }
        .store-remove { margin-left: auto; width: auto !important; padding: 0 8px; color: #9d2525 !important; }
        .store-totals { border-top: 1px solid color-mix(in srgb, var(--store-ink) 10%, transparent); padding-top: 12px; display: grid; gap: 8px; }
        .store-total-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--store-muted); font-size: 13px; font-weight: 800; }
        .store-total-row strong { color: var(--store-ink); font-size: 16px; }
        .store-checkout { display: grid; gap: 10px; }
        .store-checkout label { display: grid; gap: 6px; color: var(--store-muted); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
        .store-checkout input, .store-checkout textarea { width: 100%; border: 1px solid color-mix(in srgb, var(--store-ink) 12%, transparent); border-radius: 8px; background: #fff; color: var(--store-ink); font: inherit; font-size: 14px; padding: 11px 12px; outline: none; }
        .store-checkout textarea { min-height: 72px; resize: vertical; }
        .store-checkout input:focus, .store-checkout textarea:focus { border-color: var(--store-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--store-accent) 18%, transparent); }
        .store-checkout button { border: 0; border-radius: 999px; background: var(--store-button); color: var(--store-button-text); padding: 12px 15px; font: inherit; font-weight: 900; cursor: pointer; }
        .store-checkout button:disabled { opacity: .6; cursor: not-allowed; }
        .store-alert { border-radius: 8px; padding: 10px 11px; font-size: 12px; font-weight: 800; line-height: 1.45; }
        .store-alert.error { color: #9d2525; background: rgba(255,107,107,.1); border: 1px solid rgba(255,107,107,.24); }
        .store-alert.success { color: #3d5900; background: rgba(175,255,0,.18); border: 1px solid rgba(175,255,0,.32); }
        .store-empty { border: 1px dashed color-mix(in srgb, var(--store-ink) 18%, transparent); border-radius: 8px; padding: 34px 18px; text-align: center; color: color-mix(in srgb, var(--store-ink) 60%, transparent); background: color-mix(in srgb, var(--store-card) 65%, transparent); }
        .store-footer { border-top: 1px solid color-mix(in srgb, var(--store-ink) 10%, transparent); padding: 34px 0; }
        .store-footer-inner { display: flex; justify-content: space-between; gap: 18px; align-items: center; flex-wrap: wrap; color: var(--store-muted); font-size: 13px; font-weight: 700; }
        .layout-split .store-hero-grid { grid-template-columns: minmax(0, .9fr) minmax(280px, 1.1fr); align-items: center; background: transparent; border: 0; padding: clamp(18px, 4vw, 44px) 0; color: var(--store-ink); }
        .layout-split .store-hero-grid.has-banner { min-height: auto; color: var(--store-ink); background-image: none !important; }
        .layout-split .store-hero-grid.has-banner .store-hero-copy p { color: var(--store-muted); }
        .layout-split .store-feature { display: none; }
        .layout-split .store-hero-media { display: block; aspect-ratio: 4 / 5; border-radius: 8px; overflow: hidden; background: color-mix(in srgb, var(--store-accent) 18%, var(--store-card)); }
        .layout-split .store-hero-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .layout-boutique .store-hero-grid { border-radius: 32px 8px 32px 8px; }
        .layout-market .store-grid { gap: 10px; }
        .layout-market .store-product { border-radius: 4px; }
        .layout-showroom .store-contact, .layout-showroom .store-social-link { color: var(--store-ink); background: color-mix(in srgb, var(--store-card) 88%, #ffffff 4%); }
        .layout-showroom .store-product, .layout-showroom .store-cart, .layout-showroom .store-hero-grid { box-shadow: 0 18px 44px rgba(0,0,0,.2); }
        .storefront-elegant .store-hero-grid { border-radius: 0; }
        .storefront-elegant .store-product, .storefront-elegant .store-logo { border-radius: 0; }
        .storefront-bold .store-hero-grid { background: var(--store-ink); color: #fff; }
        .storefront-bold .store-hero p { color: rgba(255,255,255,.72); }
        .storefront-bold .store-hero-grid.has-banner { background-position: center; background-size: cover; }
        .storefront-minimal .store-hero-grid { box-shadow: none; background: transparent; padding-left: 0; padding-right: 0; }
        @media (max-width: 820px) {
          .store-hero-grid, .store-grid, .store-shop-layout { grid-template-columns: 1fr; }
          .layout-split .store-hero-grid { grid-template-columns: 1fr; }
          .store-cart { position: static; }
          .store-section-head { display: block; }
          .store-section-head p { margin-top: 6px; }
        }
        @media (max-width: 560px) {
          .store-contact { display: none; }
          .store-hero-grid { padding: 22px; }
          .store-nav { align-items: flex-start; }
        }
      `}</style>

      {copy.announcement && <div className="store-announcement">{copy.announcement}</div>}

      <section className="store-hero">
        <div className="store-wrap">
          <nav className="store-nav">
            <div className="store-brand">
              <div className="store-logo">
                {store.logoUrl ? <img src={store.logoUrl} alt={`${store.businessName} logo`} /> : store.businessName.charAt(0)}
              </div>
              <div>
                <strong>{store.businessName}</strong>
                <span>{[store.city, store.state].filter(Boolean).join(', ') || store.businessType || 'Online store'}</span>
              </div>
            </div>
            <div className="store-actions">
              {visibleSocialLinks.length > 0 && (
                <div className="store-socials">
                  {visibleSocialLinks.map((link) => (
                    <a key={link.type} className="store-social-link" href={link.href} target={link.type === 'email' ? undefined : '_blank'} rel={link.type === 'email' ? undefined : 'noreferrer'} aria-label={link.type}>
                      {link.type.slice(0, 2)}
                    </a>
                  ))}
                </div>
              )}
              {store.phone && <a className="store-contact" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
            </div>
          </nav>

          <div className={`store-hero-grid ${store.bannerUrl ? 'has-banner' : ''}`} style={store.bannerUrl ? { backgroundImage: `linear-gradient(rgba(15,21,24,.52), rgba(15,21,24,.52)), url("${store.bannerUrl}")` } : undefined}>
            <div className="store-hero-copy">
              <span className="store-pill">{heroEyebrow}</span>
              <h1>{heroHeadline}</h1>
              <p>{heroSubtext}</p>
              <div className="store-hero-ctas">
                <a className="store-cta" href="#shop">{copy.primaryButtonLabel}</a>
                {store.phone && <a className="store-cta secondary" href={`tel:${store.phone}`}>{copy.secondaryButtonLabel}</a>}
              </div>
            </div>
            {template.layout === 'split' && (
              <div className="store-hero-media">
                {store.bannerUrl ? <img src={store.bannerUrl} alt={`${store.businessName} featured`} /> : null}
              </div>
            )}
            <div className="store-feature">
              <span>Products</span>
              <strong>{products.length || 'Coming soon'}</strong>
              <small>Delivery fee: {formatCurrency(deliveryFee)}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="store-products" id="shop">
        <div className="store-wrap">
          <div className="store-section-head">
            <h2>{copy.productsHeading}</h2>
            <p>{productsSubheading}</p>
          </div>

          <div className="store-shop-layout">
            <div className="store-shop-main">
              {products.length ? (
                <div className="store-grid">
                  {products.map((product) => {
                    const stock = Number(product.stock || 0);
                    return (
                    <article className="store-product" key={product.id || product.imageUrl || product.name}>
                      <img src={product.imageUrl} alt={product.name} />
                      <div className="store-product-body">
                        <div>
                          <h3>{product.name}</h3>
                          {product.description && <p>{product.description}</p>}
                        </div>
                        <div className="store-product-footer">
                          <span className="store-price">{formatCurrency(product.price)}</span>
                          <span className="store-stock">{stock} in stock</span>
                        </div>
                        <button className="store-add" type="button" onClick={() => addToCart(product)} disabled={stock <= 0}>
                          {stock <= 0 ? 'Out of stock' : copy.addToCartLabel}
                        </button>
                      </div>
                    </article>
                    );
                  })}
                </div>
              ) : (
                <div className="store-empty">No products have been published yet.</div>
              )}
            </div>

            <aside className="store-cart" aria-label="Shopping cart">
              <div className="store-cart-head">
                <h3>Cart</h3>
                <span className="store-cart-count">{cartCount} item{cartCount === 1 ? '' : 's'}</span>
              </div>

              {cart.length ? (
                <div className="store-cart-items">
                  {cart.map((item) => (
                    <div className="store-cart-item" key={item.id}>
                      <img src={item.imageUrl} alt="" />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{formatCurrency(item.price)}</span>
                        <div className="store-cart-controls">
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} aria-label={`Reduce ${item.name}`}>-</button>
                          <b>{item.quantity}</b>
                          <button type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</button>
                          <button type="button" className="store-remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="store-empty">Your cart is empty.</div>
              )}

              <div className="store-totals">
                <div className="store-total-row">
                  <span>Subtotal</span>
                  <b>{formatCurrency(cartSubtotal)}</b>
                </div>
                <div className="store-total-row">
                  <span>Delivery</span>
                  <b>{cart.length ? formatCurrency(deliveryFee) : formatCurrency(0)}</b>
                </div>
                <div className="store-total-row">
                  <span>Total</span>
                  <strong>{formatCurrency(cartTotal)}</strong>
                </div>
              </div>

              <form className="store-checkout" onSubmit={handleCheckout}>
                <label>
                  Name
                  <input value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} placeholder="Your name" />
                </label>
                <label>
                  Phone number
                  <input value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} placeholder="080..." />
                </label>
                <label>
                  Delivery address
                  <textarea value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} placeholder="Street, area, city" />
                </label>
                <label>
                  Note
                  <textarea value={customer.note} onChange={(event) => updateCustomer('note', event.target.value)} placeholder="Color, size, or delivery note" />
                </label>

                {checkoutError && <div className="store-alert error">{checkoutError}</div>}
                {checkoutSuccess && <div className="store-alert success">{checkoutSuccess}</div>}

                <button type="submit" disabled={submittingOrder || !cart.length}>
                  {submittingOrder ? 'Placing order...' : copy.checkoutLabel}
                </button>
              </form>
            </aside>
          </div>
        </div>
      </section>

      <footer className="store-footer">
        <div className="store-wrap store-footer-inner">
          <span>{copy.footerText || `${store.businessName} - ${[store.city, store.state].filter(Boolean).join(', ') || 'Online store'}`}</span>
          {visibleSocialLinks.length > 0 && (
            <div className="store-socials">
              {visibleSocialLinks.map((link) => (
                <a key={link.type} className="store-social-link" href={link.href} target={link.type === 'email' ? undefined : '_blank'} rel={link.type === 'email' ? undefined : 'noreferrer'} aria-label={link.type}>
                  {link.type.slice(0, 2)}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
