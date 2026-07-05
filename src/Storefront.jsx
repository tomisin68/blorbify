import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getReadableTextColor, getStoreCopy, getStoreSocialLinks, getStoreTemplate, getTemplateTheme } from './storeTemplates';
import { createStoreSlug } from './storeLinks';
import { useCart, productKey } from './storefront/useCart';
import { useToasts } from './storefront/useToasts';
import { formatCurrency, getSocialHref, getBusinessTypeLabel } from './storefront/storefrontUtils';
import SignatureTemplate from './storefront/SignatureTemplate';
import NoirTemplate from './storefront/NoirTemplate';

const addToCartPhrases = [
  (name) => `${name} added to your bag`,
  (name) => `Good pick — ${name} is in your cart`,
  (name) => `${name} added. Your cart's looking good.`,
];

const templateComponents = {
  signature: SignatureTemplate,
  noir: NoirTemplate,
};

export default function Storefront({ slug }) {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', note: '' });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const appliedInitialProductRef = useRef(false);

  const { toasts, notify, dismiss } = useToasts();

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
  const accentTextColor = useMemo(() => getReadableTextColor(theme.primaryColor, theme.textColor), [theme]);
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

  // Auto-open the product a shared link points to, once the store has loaded. Only runs once —
  // afterwards the URL is driven by the effect below, not the other way around.
  useEffect(() => {
    if (appliedInitialProductRef.current) return;
    if (loading) return;
    if (!store) return;

    appliedInitialProductRef.current = true;
    const productId = searchParams.get('product');
    if (!productId) return;

    const match = products.find((product) => productKey(product) === productId);
    if (match) {
      setSelectedProduct(match);
    } else {
      console.warn(`Storefront: product "${productId}" from the shared link was not found in this store's catalog.`);
    }
  }, [loading, store, products, searchParams]);

  // Keep the URL in sync with the open product modal, using replace so opening/closing products
  // doesn't clutter browser history.
  useEffect(() => {
    const productId = selectedProduct ? productKey(selectedProduct) : null;
    const currentParam = searchParams.get('product');
    if (productId === currentParam) return;

    const nextParams = new URLSearchParams(searchParams);
    if (productId) {
      nextParams.set('product', productId);
    } else {
      nextParams.delete('product');
    }
    setSearchParams(nextParams, { replace: true });
  }, [selectedProduct, searchParams, setSearchParams]);

  const productShareUrl = selectedProduct
    ? `${window.location.origin}/${store?.storeSlug || slug}?${new URLSearchParams({ product: productKey(selectedProduct) }).toString()}`
    : '';

  const { cart, cartCount, cartSubtotal, addToCart, updateQuantity, removeItem, clearCart } = useCart(store?.storeSlug || slug, {
    onAdd: (product, quantity) => {
      const phrase = addToCartPhrases[Math.floor(Math.random() * addToCartPhrases.length)];
      notify(phrase(product.name), { type: 'cart', duration: quantity > 1 ? 3200 : 2800 });
    },
    onRemove: (item) => notify(`Removed ${item.name} from your cart`, { type: 'info' }),
    onLimit: (product) => notify(`That's all the ${product.name} we have in stock`, { type: 'error' }),
  });

  const deliveryFee = Number(store?.deliveryFee || 0);
  const cartTotal = cartSubtotal + (cart.length ? deliveryFee : 0);
  const freeShippingThreshold = Number(store?.freeShippingThreshold || 75000);

  const heroHeadline = copy.heroHeadline || store?.businessName || 'Your store';
  const heroSubtext = copy.heroSubtext || store?.description || 'Browse our products and contact us to place your order.';
  const heroEyebrow = copy.heroEyebrow || getBusinessTypeLabel(store?.businessType) || 'Open online';
  const productsSubheading = copy.productsSubheading || (products.length ? 'Fresh picks from this seller.' : 'This seller is preparing their catalog.');
  const featuredImage = store?.bannerUrl || products[0]?.imageUrl || '';
  const secondaryImage = products[1]?.imageUrl || products[2]?.imageUrl || featuredImage;
  const businessTypeLabel = getBusinessTypeLabel(store?.businessType) || 'Shop';
  const footerText = copy.footerText || `${store?.businessName || 'Your store'} sources considered products one order at a time.`;

  const productCategories = useMemo(() => {
    const categories = products
      .map((product) => product.category || businessTypeLabel)
      .filter(Boolean);
    return ['All', ...Array.from(new Set(categories)).slice(0, 6)];
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

  const isWished = (product) => wishlist.includes(productKey(product));
  const toggleWishlist = (product) => {
    const id = productKey(product);
    if (!id) return;
    setWishlist((current) => {
      const already = current.includes(id);
      notify(already ? `Removed ${product.name} from your wishlist` : `Saved ${product.name} to your wishlist`, { type: already ? 'info' : 'wish' });
      return already ? current.filter((item) => item !== id) : [...current, id];
    });
  };

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!cart.length) {
      notify('Add at least one product to your cart first', { type: 'error' });
      return;
    }

    const name = customer.name.trim();
    const phone = customer.phone.trim();
    const address = customer.address.trim();

    if (!name || !phone || !address) {
      notify('We need your name, phone number, and delivery address to arrange delivery', { type: 'error' });
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

      clearCart();
      setCustomer({ name: '', phone: '', address: '', note: '' });
      setOrderPlaced(true);
      notify(`Order placed! ${store.businessName} will reach out shortly`, { type: 'order', duration: 5200 });
    } catch (error) {
      console.error('Order creation failed:', error);
      notify('Your order could not be placed — please try again', { type: 'error' });
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    setNewsletterEmail('');
    notify("You're on the list — watch for drops and restocks", { type: 'success' });
  };

  const closeCart = () => {
    setCartOpen(false);
    setOrderPlaced(false);
  };

  if (loading) {
    return (
      <div className="storefront-loading">
        <style>{`
          .storefront-loading { min-height: 100vh; display: grid; place-items: center; background: #f6f8f1; color: #141B1E; font-family: Inter, system-ui, sans-serif; }
          .storefront-loader { width: 42px; height: 42px; border: 3px solid #e3e8d9; border-top-color: #141B1E; border-radius: 999px; animation: spin .8s linear infinite; margin: 0 auto 12px; }
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
          .storefront-empty { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0f1518; color: #f6f8f1; font-family: Inter, system-ui, sans-serif; text-align: center; }
          .storefront-empty h1 { color: #f6f8f1; margin: 0 0 8px; font-size: clamp(28px, 5vw, 44px); }
          .storefront-empty p { margin: 0; color: #93a2a6; }
        `}</style>
        <div>
          <h1>Store not found</h1>
          <p>This Blorbify store is not published yet.</p>
        </div>
      </div>
    );
  }

  const TemplateComponent = templateComponents[template.id] || SignatureTemplate;

  const templateProps = {
    store,
    theme,
    accentTextColor,
    copy,
    businessTypeLabel,
    visibleSocialLinks,
    footerText,
    products,
    filteredProducts,
    productCategories,
    activeCategory,
    setActiveCategory,
    searchTerm,
    setSearchTerm,
    featuredImage,
    secondaryImage,
    heroHeadline,
    heroSubtext,
    heroEyebrow,
    productsSubheading,
    formatCurrency,
    wishlist,
    isWished,
    toggleWishlist,
    addToCart,
    selectedProduct,
    setSelectedProduct,
    productShareUrl,
    cart,
    cartCount,
    cartSubtotal,
    cartTotal,
    deliveryFee,
    freeShippingThreshold,
    updateQuantity,
    removeItem,
    cartOpen,
    setCartOpen,
    closeCart,
    mobileMenuOpen,
    setMobileMenuOpen,
    customer,
    updateCustomer,
    handleCheckout,
    submittingOrder,
    orderPlaced,
    newsletterEmail,
    setNewsletterEmail,
    handleNewsletterSubmit,
    toasts,
    dismiss,
  };

  return <TemplateComponent {...templateProps} />;
}
