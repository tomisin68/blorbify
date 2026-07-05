import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { arrayUnion, collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import {
  checkProductImageDimensions,
  uploadProductImage,
  uploadStoreBanner,
  uploadStoreLogo,
  validateProductImage,
  validateStoreBanner,
  validateStoreLogo,
} from './cloudinary';
import { db } from './firebase';
import { createStoreSlug, getStoreUrl } from './storeLinks';
import { buildPublicStorePayload } from './publicStore';
import { getProductImages, getProductCoverImage, MAX_PRODUCT_IMAGES } from './productImages';
import SellerPayoutPanel from './SellerPayoutPanel';
import BillingPanel from './BillingPanel';
import {
  colorPresets,
  defaultStoreCopy,
  getStoreCopy,
  getStoreSocialLinks,
  getTemplateTheme,
  socialLinkFields,
  storeTemplates,
} from './storeTemplates';
import LivePreviewFrame from './storefront/LivePreviewFrame';
import { nigerianStates } from './nigerianStates';
import { notifyOrderStatusUpdate } from './backendApi';

const emptyStats = {
  revenue: 0,
  totalOrders: 0,
  totalCustomers: 0,
  totalProducts: 0,
};

const IconBase = ({ children, size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

const IconDashboard = (props) => (
  <IconBase {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </IconBase>
);

const IconStore = (props) => (
  <IconBase {...props}>
    <path d="M4 9 5.4 4.5h13.2L20 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 9v10.5h14V9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M9 19.5V14h6v5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M4 9c.7 1.3 2.7 1.3 3.4 0 .7 1.3 2.7 1.3 3.4 0 .7 1.3 2.7 1.3 3.4 0 .7 1.3 2.7 1.3 3.4 0 .7 1.3 2.7 1.3 3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconOrders = (props) => (
  <IconBase {...props}>
    <path d="M6.5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v14l-3-1.8-3 1.8-3-1.8-3 1.8V6a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M9 9h6M9 12.5h6M9 16h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconPalette = (props) => (
  <IconBase {...props}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17h1.3c1 0 1.4-1.2.7-1.9-.9-.9-.2-2.4 1.1-2.4H17A6.7 6.7 0 0 0 23 9.5c0-3.3-4.9-6-11-6Z" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
  </IconBase>
);

const IconWallet = (props) => (
  <IconBase {...props}>
    <path d="M4.5 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9Z" stroke="currentColor" strokeWidth="1.7" />
    <path d="M17.5 11h2V9.2h-2c-1 0-1.8.8-1.8 1.8v0c0 1 .8 1.8 1.8 1.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="14.2" cy="11" r="1" fill="currentColor" />
  </IconBase>
);

const IconUsers = (props) => (
  <IconBase {...props}>
    <path d="M16 20v-1.5c0-2.2-1.8-4-4-4H6c-2.2 0-4 1.8-4 4V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="9" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M22 20v-1.5c0-1.9-1.3-3.5-3-3.9M16 4.3a3.5 3.5 0 0 1 0 6.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconMenu = (props) => (
  <IconBase {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </IconBase>
);

const IconClose = (props) => (
  <IconBase {...props}>
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </IconBase>
);

const IconLogout = (props) => (
  <IconBase {...props}>
    <path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M15 7l5 5-5 5M20 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </IconBase>
);

const IconPlus = (props) => (
  <IconBase {...props}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </IconBase>
);

const IconTrash = (props) => (
  <IconBase {...props}>
    <path d="M4 7h16M9 7V4.8h6V7M6.5 7l.8 13h9.4l.8-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconEdit = (props) => (
  <IconBase {...props}>
    <path d="M4.5 19.5h4l10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16.5l-1 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m14.8 7.2 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconImage = (props) => (
  <IconBase {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="m5.5 16 4.3-4.3 3.2 3.2 2.2-2.2 3.3 3.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="15.8" cy="8.8" r="1.3" fill="currentColor" />
  </IconBase>
);

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString()}`;
}

function titleCase(value) {
  if (!value) return 'Not set';
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDisplayName(user, profile) {
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  return profile?.displayName || fullName || user?.displayName || user?.email?.split('@')[0] || 'Merchant';
}

function StatCard({ label, value, icon: Icon, tone = 'lime' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value || 'Not set'}</strong>
    </div>
  );
}

const businessTypeOptions = [
  { value: 'fashion', label: 'Fashion & Clothing' },
  { value: 'beauty', label: 'Beauty & Cosmetics' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'services', label: 'Services' },
  { value: 'handmade', label: 'Handmade & Crafts' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'others', label: 'Others' },
];

const ORDER_FLOW_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

function getStatusHistoryAt(order, status) {
  const entry = (order.statusHistory || []).find((item) => item?.status === status);
  return entry?.at || (status === 'pending' ? order.createdAt : null);
}

function formatOrderTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderRow({ order }) {
  const navigate = useNavigate();
  const placedAt = formatOrderTimestamp(order.createdAt);

  return (
    <button type="button" className="order-row" onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
      <div>
        <strong>{order.customerName || order.customer?.name || 'Customer'}</strong>
        <span>{order.id ? `#${order.id.slice(0, 8)}` : 'New order'}{placedAt ? ` · ${placedAt}` : ''}</span>
      </div>
      <div>
        <strong>{formatCurrency(order.total || order.amount)}</strong>
        <span className="status-pill">{order.status || 'pending'}</span>
      </div>
    </button>
  );
}

function OrderDetailPage({ orderId }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOrder(null);
          setNotFound(true);
        } else {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Order detail load failed:', error);
        setOrder(null);
        setNotFound(true);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [orderId]);

  const updateStatus = async (nextStatus) => {
    if (!order || nextStatus === order.status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await setDoc(
        doc(db, 'orders', orderId),
        {
          status: nextStatus,
          statusHistory: arrayUnion({ status: nextStatus, at: new Date().toISOString() }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (order.customerEmail) {
        notifyOrderStatusUpdate({ orderId, status: nextStatus }).catch((error) => {
          console.error('Order status email failed:', error);
        });
      }
    } catch (error) {
      console.error('Order status update failed:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading order…</div>;
  }

  if (notFound || !order) {
    return (
      <div className="empty-state">
        <strong>Order not found.</strong>
        <br />
        <button type="button" className="btn-link" onClick={() => navigate('/dashboard/orders')}>← Back to orders</button>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const placedAt = formatOrderTimestamp(order.createdAt);
  const currentStatus = order.status || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = ORDER_FLOW_STATUSES.findIndex((step) => step.value === currentStatus);

  return (
    <div className="order-detail">
      <button type="button" className="order-detail-back" onClick={() => navigate('/dashboard/orders')}>
        ← Back to orders
      </button>

      <div className="order-detail-header">
        <div>
          <h3>{order.customerName || order.customer?.name || 'Customer'}</h3>
          <span>#{order.id.slice(0, 8)}{placedAt ? ` · ${placedAt}` : ''}</span>
        </div>
        <strong>{formatCurrency(order.total || order.amount)}</strong>
      </div>

      <div className="order-timeline">
        {isCancelled && <div className="order-cancelled-banner">This order was cancelled.</div>}

        <div className={`timeline ${isCancelled ? 'is-cancelled' : ''}`}>
          {ORDER_FLOW_STATUSES.map((step, index) => {
            const reached = !isCancelled && index <= currentIndex;
            const isCurrent = !isCancelled && index === currentIndex;
            const at = formatOrderTimestamp(getStatusHistoryAt(order, step.value));
            return (
              <button
                key={step.value}
                type="button"
                className={`timeline-step ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}
                disabled={updatingStatus || isCancelled}
                onClick={() => updateStatus(step.value)}
              >
                <span className="timeline-dot">{reached && !isCurrent ? '✓' : index + 1}</span>
                <span className="timeline-label">{step.label}</span>
                <span className="timeline-time">{at || '—'}</span>
              </button>
            );
          })}
        </div>

        {!isCancelled && currentStatus !== 'delivered' && (
          <button type="button" className="btn-link btn-link-danger" disabled={updatingStatus} onClick={() => updateStatus('cancelled')}>
            Cancel this order
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="order-items">
          {items.map((item, index) => (
            <div className="order-item" key={item.productId || index}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name || 'Product'} />
              ) : (
                <div className="order-item-noimg" />
              )}
              <div>
                <strong>{item.name || 'Product'}</strong>
                <span>{item.quantity || 1} x {formatCurrency(item.price)}</span>
              </div>
              <strong className="order-item-subtotal">
                {formatCurrency(item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 1))}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="order-details-empty">No item details were recorded for this order.</p>
      )}

      <div className="order-summary">
        <div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div>
        <div><span>Delivery fee</span><strong>{formatCurrency(order.deliveryFee)}</strong></div>
        <div><span>Total</span><strong>{formatCurrency(order.total || order.amount)}</strong></div>
      </div>

      <div className="order-contact">
        {order.customerPhone && <div><span>Phone</span><strong>{order.customerPhone}</strong></div>}
        {order.customerWhatsapp && <div><span>WhatsApp</span><strong>{order.customerWhatsapp}</strong></div>}
        {order.customerLocation && <div><span>Location</span><strong>{order.customerLocation}</strong></div>}
        {order.customerAddress && <div><span>Delivery address</span><strong>{order.customerAddress}</strong></div>}
        {order.customerNote && <div><span>Note</span><strong>{order.customerNote}</strong></div>}
      </div>
    </div>
  );
}

function createProductId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`;
}

const emptyProductForm = {
  name: '',
  price: '',
  description: '',
  category: '',
  stock: '',
};

let imageItemSeq = 0;
function nextImageItemId() {
  imageItemSeq += 1;
  return `img-${Date.now()}-${imageItemSeq}`;
}

function getProductKey(product, index) {
  return product.id || product.imagePublicId || product.imageUrl || `${product.name || 'product'}-${index}`;
}

async function publishPublicStore(storeInfo, userId) {
  const storeSlug = createStoreSlug(storeInfo.storeSlug || storeInfo.businessName || 'your-store');

  await setDoc(doc(db, 'publicStores', storeSlug), {
    ...buildPublicStorePayload({ ...storeInfo, storeSlug }, userId),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

function ProductManager({ userId, storeInfo, products, onProductsSaved }) {
  const [form, setForm] = useState(emptyProductForm);
  const [imageItems, setImageItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleImagesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const room = MAX_PRODUCT_IMAGES - imageItems.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PRODUCT_IMAGES} photos per product.`);
      return;
    }

    const accepted = [];
    let validationError = '';
    const dimensionWarnings = [];
    for (const file of files.slice(0, room)) {
      const fileError = validateProductImage(file);
      if (fileError) {
        validationError = fileError;
        continue;
      }
      accepted.push({ uid: nextImageItemId(), kind: 'new', file, previewUrl: URL.createObjectURL(file) });

      const dimensionWarning = await checkProductImageDimensions(file);
      if (dimensionWarning) dimensionWarnings.push(dimensionWarning);
    }

    if (accepted.length) {
      setImageItems((current) => [...current, ...accepted]);
    }
    setWarning(dimensionWarnings[0] || '');
    if (files.length > room) {
      setError(`You can add up to ${MAX_PRODUCT_IMAGES} photos per product.`);
    } else if (validationError) {
      setError(validationError);
    } else {
      setError('');
      setSuccess('');
    }
  };

  const removeImageItem = (uid) => {
    setImageItems((current) => {
      const target = current.find((item) => item.uid === uid);
      if (target?.kind === 'new') URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.uid !== uid);
    });
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    imageItems.forEach((item) => {
      if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
    });
    setForm(emptyProductForm);
    setImageItems([]);
    setEditingKey('');
    setUploadProgress(0);
    setWarning('');
  };

  const saveProducts = async (nextProducts) => {
    const nextStoreInfo = {
      ...(storeInfo || {}),
      products: nextProducts,
    };

    await setDoc(
      doc(db, 'stores', userId),
      {
        userId,
        products: nextProducts,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await publishPublicStore(nextStoreInfo, userId);
    onProductsSaved(nextProducts);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const name = form.name.trim();
    const price = Number(String(form.price).replace(/[^\d.]/g, ''));
    const stock = form.stock === '' ? 0 : Number(String(form.stock).replace(/[^\d]/g, ''));

    if (!name) {
      setError('Enter a product name.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid product price.');
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      setError('Enter a valid stock quantity.');
      return;
    }

    if (!imageItems.length) {
      setError('Add at least one product photo.');
      return;
    }

    const newItems = imageItems.filter((item) => item.kind === 'new');

    setSaving(true);
    setUploadProgress(newItems.length ? 1 : 0);
    try {
      const currentProduct = editingKey
        ? products.find((item, index) => getProductKey(item, index) === editingKey)
        : null;

      let completedUploads = 0;
      const images = [];
      for (const item of imageItems) {
        if (item.kind === 'existing') {
          images.push({
            url: item.url,
            publicId: item.publicId || '',
            width: item.width || null,
            height: item.height || null,
            format: item.format || '',
            bytes: item.bytes || null,
          });
          continue;
        }

        const uploaded = await uploadProductImage(item.file, `blorbify/products/${userId}`, (fileProgress) => {
          const overall = ((completedUploads + fileProgress / 100) / newItems.length) * 100;
          setUploadProgress(Math.round(overall));
        });
        completedUploads += 1;
        setUploadProgress(Math.round((completedUploads / newItems.length) * 100));
        images.push({
          url: uploaded.secureUrl,
          publicId: uploaded.publicId,
          width: uploaded.width,
          height: uploaded.height,
          format: uploaded.format,
          bytes: uploaded.bytes,
        });
      }

      const cover = images[0];
      const now = new Date().toISOString();
      const product = {
        ...(currentProduct || {}),
        id: currentProduct?.id || createProductId(),
        name,
        price,
        description: form.description.trim(),
        category: form.category.trim(),
        stock,
        images,
        imageUrl: cover?.url || '',
        imagePublicId: cover?.publicId || '',
        imageWidth: cover?.width || null,
        imageHeight: cover?.height || null,
        imageFormat: cover?.format || '',
        imageBytes: cover?.bytes || null,
        status: currentProduct?.status || 'active',
        createdAt: currentProduct?.createdAt || now,
        updatedAt: now,
      };

      const nextProducts = editingKey
        ? products.map((item, index) => (getProductKey(item, index) === editingKey ? product : item))
        : [product, ...products];

      await saveProducts(nextProducts);
      resetForm();
      setSuccess(editingKey ? 'Product updated.' : 'Product added to your store.');
    } catch (uploadError) {
      setError(uploadError?.message || 'Product could not be saved. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (product, productKey) => {
    imageItems.forEach((item) => {
      if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
    });

    setEditingKey(productKey);
    setImageItems(getProductImages(product).map((image) => ({
      uid: nextImageItemId(),
      kind: 'existing',
      ...image,
    })));
    setUploadProgress(0);
    setError('');
    setSuccess('');
    setWarning('');
    setForm({
      name: product.name || '',
      price: product.price ?? '',
      description: product.description || '',
      category: product.category || '',
      stock: product.stock ?? '',
    });
  };

  const handleDelete = async (productKey) => {
    const product = products.find((item, index) => getProductKey(item, index) === productKey);
    if (!product || !window.confirm(`Remove ${product.name} from your store?`)) {
      return;
    }

    setDeletingId(productKey);
    setError('');
    setSuccess('');
    try {
      await saveProducts(products.filter((item, index) => getProductKey(item, index) !== productKey));
      setSuccess('Product removed from your store.');
    } catch (deleteError) {
      setError(deleteError?.message || 'Product could not be removed. Please try again.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="product-manager">
      <div className="product-layout">
        <form className="product-form" onSubmit={handleSubmit}>
          {editingKey && (
            <div className="edit-banner">
              <span>Editing product</span>
              <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>
            </div>
          )}
          <div className="product-form-grid">
            <label className="field-group">
              <span>Product name</span>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Ankara maxi dress" />
            </label>
            <label className="field-group">
              <span>Price (NGN)</span>
              <input inputMode="decimal" value={form.price} onChange={(event) => updateField('price', event.target.value)} placeholder="8500" />
            </label>
            <label className="field-group">
              <span>Category</span>
              <input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="Fashion" />
            </label>
            <label className="field-group">
              <span>Stock</span>
              <input inputMode="numeric" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} placeholder="12" />
            </label>
            <label className="field-group full">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Short product details customers should know" rows="3" />
            </label>
          </div>

          <span className="control-label">Product photos ({imageItems.length}/{MAX_PRODUCT_IMAGES})</span>
          <div className="image-drop-grid">
            {imageItems.map((item, index) => (
              <div className={`image-tile ${index === 0 ? 'cover' : ''}`} key={item.uid}>
                <img src={item.kind === 'new' ? item.previewUrl : item.url} alt="" />
                {index === 0 && <span className="image-tile-cover-badge">Cover</span>}
                <button type="button" className="image-tile-remove" onClick={() => removeImageItem(item.uid)} aria-label="Remove photo">
                  <IconClose size={14} />
                </button>
              </div>
            ))}
            {imageItems.length < MAX_PRODUCT_IMAGES && (
              <label className="image-tile image-tile-add">
                <IconImage size={22} />
                <span>Add photo{imageItems.length ? '' : 's'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImagesChange} />
              </label>
            )}
          </div>
          <p className="image-help">The first photo is used as the cover image on your storefront. Add up to {MAX_PRODUCT_IMAGES} per product.</p>

          {saving && imageItems.some((item) => item.kind === 'new') && (
            <div className="upload-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}>
              <div>
                <span>Uploading photos</span>
                <strong>{uploadProgress}%</strong>
              </div>
              <progress value={uploadProgress} max="100" />
            </div>
          )}

          {warning && <div className="form-alert warning">{warning}</div>}
          {error && <div className="form-alert error">{error}</div>}
          {success && <div className="form-alert success">{success}</div>}

          <button type="submit" className="product-submit" disabled={saving}>
            {saving ? (imageItems.some((item) => item.kind === 'new') ? 'Uploading photos...' : 'Saving changes...') : <><IconPlus size={17} /> {editingKey ? 'Save changes' : 'Add product'}</>}
          </button>
        </form>

        <div className="product-list-card">
          <div className="card-header">
            <h3>Products</h3>
            <span className="product-count-pill">{products.length}</span>
          </div>

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product, index) => {
                const productKey = getProductKey(product, index);

                const productImages = getProductImages(product);
                return (
                <article className="product-card" key={productKey}>
                  <div className="product-card-media">
                    <img src={getProductCoverImage(product)} alt={product.name} />
                    {productImages.length > 1 && <span className="product-card-photo-count">+{productImages.length - 1}</span>}
                  </div>
                  <div className="product-card-body">
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category || 'Uncategorized'}</span>
                    </div>
                    <div className="product-card-meta">
                      <b>{formatCurrency(product.price)}</b>
                      <small>{Number(product.stock || 0)} in stock</small>
                    </div>
                    <div className="product-actions">
                      <button type="button" className="edit-product" onClick={() => handleEdit(product, productKey)} disabled={saving || deletingId === productKey}>
                        <IconEdit size={15} />
                        Edit
                      </button>
                      <button type="button" className="delete-product" onClick={() => handleDelete(productKey)} disabled={deletingId === productKey}>
                        <IconTrash size={15} />
                        {deletingId === productKey ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No products yet.</strong>
              <br />
              Add your first product with an image, price, and stock quantity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BusinessInfoEditor({ userId, profile, storeInfo, onBusinessSaved }) {
  const getCurrentForm = () => ({
    businessName: storeInfo.businessName || profile?.businessName || '',
    businessType: storeInfo.businessType || profile?.businessType || '',
    description: storeInfo.description || profile?.description || '',
    phone: storeInfo.phone || profile?.phone || '',
    city: storeInfo.city || profile?.city || '',
    state: storeInfo.state || profile?.state || '',
    instagram: storeInfo.instagram || profile?.instagram || '',
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(getCurrentForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(getCurrentForm());
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const startEditing = () => {
    setForm(getCurrentForm());
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.businessName.trim()) return 'Business name is required.';
    if (!form.businessType) return 'Select your business type.';
    if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\D/g, ''))) return 'Enter a valid phone number.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.state) return 'Select your state.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const businessUpdate = {
      businessName: form.businessName.trim(),
      businessType: form.businessType,
      description: form.description.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state,
      instagram: form.instagram.trim(),
    };
    const nextStoreInfo = {
      ...(storeInfo || {}),
      ...businessUpdate,
    };
    const nextOnboardingData = {
      ...(profile?.onboardingData || {}),
      ...businessUpdate,
      storeSlug: nextStoreInfo.storeSlug,
      storeUrl: nextStoreInfo.storeUrl,
    };
    const nextOnboardingDraft = {
      ...(profile?.onboardingDraft || {}),
      ...businessUpdate,
      storeSlug: nextStoreInfo.storeSlug,
      storeUrl: nextStoreInfo.storeUrl,
    };

    setSaving(true);
    try {
      await setDoc(doc(db, 'stores', userId), {
        ...businessUpdate,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, 'users', userId), {
        ...businessUpdate,
        onboardingData: nextOnboardingData,
        onboardingDraft: nextOnboardingDraft,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await publishPublicStore(nextStoreInfo, userId);

      onBusinessSaved(nextStoreInfo);
      setEditing(false);
      setSuccess('Business information updated.');
    } catch (saveError) {
      setError(saveError?.message || 'Business information could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="business-info-view">
        <div className="detail-list">
          <DetailRow label="Business name" value={storeInfo.businessName || profile?.businessName} />
          <DetailRow label="Business type" value={titleCase(storeInfo.businessType || profile?.businessType)} />
          <DetailRow label="Phone" value={storeInfo.phone || profile?.phone} />
          <DetailRow label="Location" value={[storeInfo.city || profile?.city, storeInfo.state || profile?.state].filter(Boolean).join(', ')} />
          <DetailRow label="Instagram" value={storeInfo.instagram || profile?.instagram} />
          <DetailRow label="Delivery fee" value={formatCurrency(storeInfo.deliveryFee)} />
          <DetailRow label="Store slug" value={storeInfo.storeSlug || profile?.storeSlug} />
        </div>
        {success && <div className="form-alert success">{success}</div>}
        <button type="button" className="secondary-action" onClick={startEditing}>
          <IconEdit size={16} />
          Edit business info
        </button>
      </div>
    );
  }

  return (
    <form className="business-info-form" onSubmit={handleSubmit}>
      <div className="product-form-grid">
        <label className="field-group">
          <span>Business name</span>
          <input value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} placeholder="Chioma's Fashion Hub" maxLength="50" />
        </label>
        <label className="field-group">
          <span>Business type</span>
          <select value={form.businessType} onChange={(event) => updateField('businessType', event.target.value)}>
            <option value="">Select type</option>
            {businessTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>
        <label className="field-group full">
          <span>Description</span>
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="What do you sell?" rows="3" maxLength="200" />
        </label>
        <label className="field-group">
          <span>Phone</span>
          <input inputMode="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="08012345678" />
        </label>
        <label className="field-group">
          <span>Instagram</span>
          <input value={form.instagram} onChange={(event) => updateField('instagram', event.target.value)} placeholder="@yourbrand" />
        </label>
        <label className="field-group">
          <span>City</span>
          <input value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder="Lagos" />
        </label>
        <label className="field-group">
          <span>State</span>
          <select value={form.state} onChange={(event) => updateField('state', event.target.value)}>
            <option value="">Select state</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="form-alert error">{error}</div>}
      {success && <div className="form-alert success">{success}</div>}

      <div className="form-actions">
        <button type="button" className="secondary-action" onClick={resetForm} disabled={saving}>Cancel</button>
        <button type="submit" className="product-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save business info'}
        </button>
      </div>
    </form>
  );
}

const themeColorFields = [
  { key: 'primaryColor', label: 'Accent color' },
  { key: 'backgroundColor', label: 'Page background' },
  { key: 'textColor', label: 'Text color' },
  { key: 'cardColor', label: 'Card color' },
  { key: 'buttonColor', label: 'Button color' },
  { key: 'buttonTextColor', label: 'Button text' },
];

const copyFieldRows = [
  { key: 'announcement', label: 'Announcement', placeholder: 'Free delivery this weekend' },
  { key: 'heroEyebrow', label: 'Hero eyebrow', placeholder: 'New arrivals' },
  { key: 'heroHeadline', label: 'Hero headline', placeholder: 'Your store name is used if empty' },
  { key: 'heroSubtext', label: 'Hero text', placeholder: 'A short line about what makes the store special', multiline: true },
  { key: 'primaryButtonLabel', label: 'Primary button', placeholder: defaultStoreCopy.primaryButtonLabel },
  { key: 'secondaryButtonLabel', label: 'Call button', placeholder: defaultStoreCopy.secondaryButtonLabel },
  { key: 'productsHeading', label: 'Products heading', placeholder: defaultStoreCopy.productsHeading },
  { key: 'productsSubheading', label: 'Products subheading', placeholder: 'Fresh picks from this seller', multiline: true },
  { key: 'addToCartLabel', label: 'Product button', placeholder: defaultStoreCopy.addToCartLabel },
  { key: 'checkoutLabel', label: 'Checkout button', placeholder: defaultStoreCopy.checkoutLabel },
  { key: 'footerText', label: 'Footer text', placeholder: 'Made in Lagos. Delivered nationwide.' },
];

function AppearanceEditor({ userId, storeInfo, onAppearanceSaved, compact = false }) {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(storeInfo.template || 'signature');
  const [themeColors, setThemeColors] = useState(() => getTemplateTheme(storeInfo.template || 'signature', storeInfo));
  const [copy, setCopy] = useState(() => getStoreCopy(storeInfo));
  const [socials, setSocials] = useState(() => getStoreSocialLinks(storeInfo));
  const [deliveryFee, setDeliveryFee] = useState(storeInfo.deliveryFee ?? '');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [existingLogoUrl, setExistingLogoUrl] = useState(storeInfo.logoUrl || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [existingBannerUrl, setExistingBannerUrl] = useState(storeInfo.bannerUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview, logoPreview]);

  const previewLogo = logoPreview || existingLogoUrl;
  const previewBanner = bannerPreview || existingBannerUrl;
  const livePreviewStore = {
    ...storeInfo,
    ...copy,
    ...socials,
    template: selectedTemplate,
    primaryColor: themeColors.primaryColor,
    backgroundColor: themeColors.backgroundColor,
    textColor: themeColors.textColor,
    cardColor: themeColors.cardColor,
    buttonColor: themeColors.buttonColor,
    buttonTextColor: themeColors.buttonTextColor,
    logoUrl: previewLogo,
    bannerUrl: previewBanner,
    deliveryFee: deliveryFee === '' ? 0 : Number(String(deliveryFee).replace(/[^\d.]/g, '')) || 0,
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setThemeColors(getTemplateTheme(templateId));
    clearMessages();
  };

  const updateThemeColor = (key, value) => {
    setThemeColors((current) => ({ ...current, [key]: value }));
    clearMessages();
  };

  const updateCopy = (key, value) => {
    setCopy((current) => ({ ...current, [key]: value }));
    clearMessages();
  };

  const updateSocial = (key, value) => {
    setSocials((current) => ({ ...current, [key]: value }));
    clearMessages();
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = file ? validateStoreLogo(file) : '';

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    if (validationError) {
      event.target.value = '';
      setLogoFile(null);
      setLogoPreview('');
      setError(validationError);
      setSuccess('');
      return;
    }

    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : '');
    clearMessages();
  };

  const handleBannerChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = file ? validateStoreBanner(file) : '';

    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
    }

    if (validationError) {
      event.target.value = '';
      setBannerFile(null);
      setBannerPreview('');
      setError(validationError);
      setSuccess('');
      return;
    }

    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : '');
    clearMessages();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cleanDeliveryFee = deliveryFee === '' ? 0 : Number(String(deliveryFee).replace(/[^\d.]/g, ''));
    if (!Number.isFinite(cleanDeliveryFee) || cleanDeliveryFee < 0) {
      setError('Enter a valid delivery fee.');
      return;
    }

    setSaving(true);
    setUploadProgress(logoFile || bannerFile ? 1 : 0);

    try {
      const logo = logoFile
        ? await uploadStoreLogo(logoFile, `blorbify/logos/${userId}`, setUploadProgress)
        : null;
      const banner = bannerFile
        ? await uploadStoreBanner(bannerFile, `blorbify/banners/${userId}`, setUploadProgress)
        : null;
      const cleanCopy = Object.entries(copy).reduce((result, [key, value]) => {
        result[key] = String(value || '').trim();
        return result;
      }, {});
      const cleanSocials = Object.entries(socials).reduce((result, [key, value]) => {
        result[key] = String(value || '').trim();
        return result;
      }, {});
      const appearanceUpdate = {
        template: selectedTemplate,
        ...themeColors,
        ...cleanCopy,
        ...cleanSocials,
        deliveryFee: cleanDeliveryFee,
        logoUrl: logo?.secureUrl || existingLogoUrl || '',
        logoPublicId: logo?.publicId || storeInfo.logoPublicId || '',
        logoWidth: logo?.width || storeInfo.logoWidth || null,
        logoHeight: logo?.height || storeInfo.logoHeight || null,
        logoFormat: logo?.format || storeInfo.logoFormat || '',
        logoBytes: logo?.bytes || storeInfo.logoBytes || null,
        bannerUrl: banner?.secureUrl || existingBannerUrl || '',
        bannerPublicId: banner?.publicId || storeInfo.bannerPublicId || '',
        bannerWidth: banner?.width || storeInfo.bannerWidth || null,
        bannerHeight: banner?.height || storeInfo.bannerHeight || null,
        bannerFormat: banner?.format || storeInfo.bannerFormat || '',
        bannerBytes: banner?.bytes || storeInfo.bannerBytes || null,
      };
      const nextStoreInfo = {
        ...(storeInfo || {}),
        ...appearanceUpdate,
      };

      await setDoc(doc(db, 'stores', userId), {
        ...appearanceUpdate,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, 'users', userId), {
        ...appearanceUpdate,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await publishPublicStore(nextStoreInfo, userId);

      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
      }
      setLogoFile(null);
      setLogoPreview('');
      setBannerFile(null);
      setBannerPreview('');
      setExistingLogoUrl(appearanceUpdate.logoUrl);
      setExistingBannerUrl(appearanceUpdate.bannerUrl);
      setDeliveryFee(String(appearanceUpdate.deliveryFee));
      setCopy(getStoreCopy(appearanceUpdate));
      setSocials(getStoreSocialLinks(appearanceUpdate));
      onAppearanceSaved(nextStoreInfo);
      setSuccess('Storefront appearance updated.');
    } catch (saveError) {
      setError(saveError?.message || 'Appearance could not be saved. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (compact) {
    const activeTemplate = storeTemplates.find((item) => item.id === (storeInfo.template || 'signature')) || storeTemplates[0];
    const currentTheme = getTemplateTheme(storeInfo.template || 'signature', storeInfo);

    return (
      <div className="business-info-view">
        <div className="appearance-summary-row">
          <span
            className={`template-swatch preview-${activeTemplate.id}`}
            style={{ '--preview-accent': currentTheme.primaryColor, '--preview-ink': currentTheme.textColor, '--preview-surface': currentTheme.backgroundColor }}
          >
            <i />
            <b />
            <em />
          </span>
          <div>
            <strong>{activeTemplate.name} template</strong>
            <p>{activeTemplate.description}</p>
          </div>
        </div>
        <div className="detail-list">
          <DetailRow label="Accent color" value={currentTheme.primaryColor} />
          <DetailRow label="Delivery fee" value={formatCurrency(storeInfo.deliveryFee)} />
        </div>
        <button type="button" className="secondary-action" onClick={() => navigate('/dashboard/appearance')}>
          <IconEdit size={16} />
          Edit appearance
        </button>
      </div>
    );
  }

  return (
    <div className={`appearance-editor ${previewOpen ? '' : 'preview-collapsed'}`}>
      <div className="appearance-controls">
        <div>
          <span className="control-label">Design</span>
          <div className="template-choice-grid">
            {storeTemplates.map((storeTemplate) => (
              <button
                key={storeTemplate.id}
                type="button"
                className={`template-choice ${selectedTemplate === storeTemplate.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(storeTemplate.id)}
              >
                <span
                  className={`template-swatch preview-${storeTemplate.id}`}
                  style={{ '--preview-accent': storeTemplate.accent, '--preview-ink': storeTemplate.ink, '--preview-surface': storeTemplate.surface }}
                >
                  <i />
                  <b />
                  <em />
                </span>
                <strong>{storeTemplate.name}</strong>
                <small>{storeTemplate.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="control-label">Quick accent colors</span>
          <div className="color-choice-grid">
            {colorPresets.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-choice ${themeColors.primaryColor === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => updateThemeColor('primaryColor', color)}
                aria-label={`Use ${color}`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="control-label">Custom colors</span>
          <div className="color-input-grid">
            {themeColorFields.map((field) => (
              <label key={field.key} className="color-input-row">
                <span>{field.label}</span>
                <input type="color" value={themeColors[field.key]} onChange={(event) => updateThemeColor(field.key, event.target.value)} />
                <b>{themeColors[field.key]}</b>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="control-label">Store media</span>
          <div className="media-grid">
            <div>
              <label className={`image-drop logo-drop ${previewLogo ? 'has-image' : ''}`}>
                {previewLogo ? (
                  <img src={previewLogo} alt="Store logo preview" />
                ) : (
                  <span>
                    <IconImage size={24} />
                    Upload store logo
                  </span>
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} />
              </label>
              <p className="image-help">Square PNG, JPG, or WEBP works best.</p>
            </div>
            <div>
              <label className={`image-drop banner-drop ${previewBanner ? 'has-image' : ''}`}>
                {previewBanner ? (
                  <img src={previewBanner} alt="Store hero banner preview" />
                ) : (
                  <span>
                    <IconImage size={24} />
                    Upload hero banner
                  </span>
                )}
                <input type="file" accept="image/*" onChange={handleBannerChange} />
              </label>
              <p className="image-help">Use a wide product, shop, or brand image.</p>
            </div>
          </div>
        </div>

        <div>
          <span className="control-label">Store text</span>
          <div className="copy-grid">
            {copyFieldRows.map((field) => (
              <label key={field.key} className={`field-group ${field.multiline ? 'full' : ''}`}>
                <span>{field.label}</span>
                {field.multiline ? (
                  <textarea value={copy[field.key]} onChange={(event) => updateCopy(field.key, event.target.value)} placeholder={field.placeholder} rows="3" />
                ) : (
                  <input value={copy[field.key]} onChange={(event) => updateCopy(field.key, event.target.value)} placeholder={field.placeholder} />
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="control-label">Social links</span>
          <div className="copy-grid">
            {socialLinkFields.map((field) => (
              <label key={field.key} className="field-group">
                <span>{field.label}</span>
                <input value={socials[field.key] || ''} onChange={(event) => updateSocial(field.key, event.target.value)} placeholder={field.placeholder} />
              </label>
            ))}
          </div>
        </div>

        <label className="field-group">
          <span>Delivery fee (NGN)</span>
          <input
            inputMode="decimal"
            value={deliveryFee}
            onChange={(event) => {
              setDeliveryFee(event.target.value);
              clearMessages();
            }}
            placeholder="1500"
          />
        </label>

        {saving && (logoFile || bannerFile) && (
          <div className="upload-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}>
            <div>
              <span>Uploading image</span>
              <strong>{uploadProgress}%</strong>
            </div>
            <progress value={uploadProgress} max="100" />
          </div>
        )}

        {error && <div className="form-alert error">{error}</div>}
        {success && <div className="form-alert success">{success}</div>}

        <button type="button" className="product-submit" onClick={handleSubmit} disabled={saving}>
          {saving ? (logoFile || bannerFile ? 'Uploading image...' : 'Saving appearance...') : 'Save appearance'}
        </button>
      </div>

      <div className="appearance-preview-col">
        <div className="preview-col-header">
          <span className="control-label">Live preview</span>
          <button type="button" className="preview-toggle" onClick={() => setPreviewOpen((current) => !current)}>
            {previewOpen ? 'Hide preview' : 'Show preview'}
          </button>
        </div>
        {previewOpen && (
          <>
            <LivePreviewFrame store={livePreviewStore} />
            <p className="preview-hint">This is your actual storefront design, scaled down — exactly what buyers will see at {storeInfo.storeSlug ? getStoreUrl(storeInfo.storeSlug) : 'your store URL'}.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ user, userProfile, onLogout }) {
  const navigate = useNavigate();
  const { tab: tabParam, orderId } = useParams();
  const activeTab = orderId ? 'orders' : (tabParam || 'overview');
  const [profile, setProfile] = useState(userProfile || null);
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.uid));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    const storeRef = doc(db, 'stores', user.uid);
    const ordersQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile((current) => ({ ...(current || {}), ...snapshot.data() }));
        }
      },
      (error) => {
        console.error('Dashboard user profile load failed:', error);
      }
    );

    const unsubscribeStore = onSnapshot(
      storeRef,
      (snapshot) => {
        setStore(snapshot.exists() ? snapshot.data() : null);
        setLoading(false);
      },
      (error) => {
        console.error('Dashboard store load failed:', error);
        setStore(null);
        setLoading(false);
      }
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setOrders(snapshot.docs.map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() })));
        setOrdersError('');
      },
      (error) => {
        console.error('Dashboard orders load failed:', error);
        setOrders([]);
        setOrdersError('Orders will appear here after Firestore access is enabled for your store orders.');
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeStore();
      unsubscribeOrders();
    };
  }, [user?.uid]);

  const storeInfo = useMemo(() => {
    return store || profile?.onboardingData || profile?.onboardingDraft || {};
  }, [profile, store]);

  const stats = useMemo(() => {
    const uniqueCustomers = new Set(
      orders
        .map((order) => order.customerId || order.customerEmail || order.customer?.email || order.customerName)
        .filter(Boolean)
    );
    const revenue = orders.reduce((total, order) => total + Number(order.total || order.amount || 0), 0);
    const products = Array.isArray(storeInfo.products) ? storeInfo.products.filter((product) => product?.name) : [];

    return {
      ...emptyStats,
      ...(storeInfo.stats || {}),
      revenue: storeInfo.stats?.revenue || revenue,
      totalOrders: storeInfo.stats?.totalOrders || orders.length,
      totalCustomers: storeInfo.stats?.totalCustomers || uniqueCustomers.size,
      totalProducts: products.length,
    };
  }, [orders, storeInfo]);

  const displayName = getDisplayName(user, profile);
  const businessName = storeInfo.businessName || profile?.businessName || 'Your store';
  const storeSlug = storeInfo.storeSlug || profile?.storeSlug || 'your-store';
  const storeUrl = getStoreUrl(storeSlug);
  const products = Array.isArray(storeInfo.products) ? storeInfo.products.filter((product) => product?.name) : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: IconDashboard },
    { id: 'products', label: 'Products', icon: IconStore },
    { id: 'business', label: 'Business Info', icon: IconStore },
    { id: 'orders', label: 'Orders', icon: IconOrders },
    { id: 'appearance', label: 'Appearance', icon: IconPalette },
    { id: 'payouts', label: 'Payouts', icon: IconWallet },
    { id: 'billing', label: 'Billing', icon: IconWallet },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <style>{`
          .dashboard-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f6f8f1;
            color: #192328;
            font-family: Raleway, system-ui, sans-serif;
          }
          .dashboard-loader {
            width: 44px;
            height: 44px;
            border-radius: 999px;
            border: 3px solid #e3e8d9;
            border-top-color: #192328;
            animation: dashSpin .75s linear infinite;
            margin: 0 auto 14px;
          }
          @keyframes dashSpin { to { transform: rotate(360deg); } }
        `}</style>
        <div>
          <div className="dashboard-loader" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .dashboard-root {
          --ink: #192328;
          --ink-deep: #0f1518;
          --ink-soft: #233038;
          --signal: #afff00;
          --paper: #f6f8f1;
          --paper-dim: #e8eddf;
          --slate: #728084;
          --line: rgba(25,35,40,0.1);
          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          display: flex;
          font-family: Raleway, system-ui, sans-serif;
          text-align: left;
        }
        .dashboard-root * { box-sizing: border-box; }
        .dashboard-sidebar {
          width: 270px;
          background: var(--ink-deep);
          color: #f6f8f1;
          position: fixed;
          inset: 0 auto 0 0;
          padding: 22px 16px;
          display: flex;
          flex-direction: column;
          z-index: 20;
          transition: transform .25s ease;
        }
        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px 20px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          margin-bottom: 18px;
        }
        .brand-dot {
          width: 11px;
          height: 11px;
          border-radius: 4px;
          background: var(--signal);
          box-shadow: 0 0 18px rgba(175,255,0,.5);
        }
        .brand-name { font-size: 21px; font-weight: 900; letter-spacing: -0.02em; }
        .brand-sub {
          color: #93a2a6;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .dashboard-nav {
          display: grid;
          gap: 6px;
          flex: 1;
          align-content: start;
        }
        .nav-item {
          width: 100%;
          border: 0;
          background: transparent;
          color: #93a2a6;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          text-align: left;
        }
        .nav-item:hover { background: var(--ink-soft); color: #fff; }
        .nav-item.active { background: var(--signal); color: var(--ink); }
        .dashboard-user {
          border-top: 1px solid rgba(255,255,255,.1);
          padding-top: 14px;
        }
        .user-chip {
          display: flex;
          gap: 11px;
          align-items: center;
          padding: 10px 8px 14px;
          min-width: 0;
        }
        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--signal);
          color: var(--ink);
          font-weight: 900;
          flex: 0 0 auto;
        }
        .user-chip strong, .user-chip span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-chip strong { color: #fff; font-size: 14px; }
        .user-chip span { color: #93a2a6; font-size: 12px; }
        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          color: #f6f8f1;
          border-radius: 12px;
          padding: 11px 12px;
          cursor: pointer;
          font: inherit;
          font-weight: 800;
        }
        .dashboard-main {
          width: 100%;
          min-width: 0;
          margin-left: 270px;
          padding: 24px clamp(16px, 3vw, 36px) 36px;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }
        .mobile-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fff;
          color: var(--ink);
          place-items: center;
          cursor: pointer;
        }
        .headline h1 {
          font-size: clamp(26px, 4vw, 38px);
          line-height: 1.05;
          margin: 0 0 6px;
          color: var(--ink);
          font-weight: 900;
          letter-spacing: 0;
        }
        .headline p {
          color: var(--slate);
          margin: 0;
          font-size: 15px;
        }
        .store-link {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          border-radius: 999px;
          padding: 11px 15px;
          font-family: "JetBrains Mono", monospace;
          font-size: 12px;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hero-panel {
          background: linear-gradient(135deg, #192328 0%, #0f1518 100%);
          color: #f6f8f1;
          border-radius: 8px;
          padding: clamp(18px, 3vw, 28px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          margin-bottom: 18px;
          overflow: hidden;
        }
        .hero-panel h2 {
          color: #f6f8f1;
          margin: 0 0 8px;
          font-size: clamp(22px, 3vw, 30px);
          line-height: 1.1;
          letter-spacing: 0;
        }
        .hero-panel p {
          color: #b9c4c7;
          max-width: 680px;
          line-height: 1.6;
          margin: 0;
        }
        .hero-badge {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-width: 130px;
          border-radius: 999px;
          background: var(--signal);
          color: var(--ink);
          padding: 12px 16px;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: .08em;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .stat-card, .content-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 8px;
          box-shadow: 0 12px 30px rgba(25,35,40,.05);
        }
        .stat-card {
          padding: 18px;
          display: grid;
          gap: 10px;
          min-width: 0;
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
        }
        .stat-icon.lime { background: rgba(175,255,0,.22); color: #4e7300; }
        .stat-icon.blue { background: rgba(69,183,209,.16); color: #12708a; }
        .stat-icon.orange { background: rgba(255,160,122,.18); color: #a84c22; }
        .stat-icon.green { background: rgba(25,35,40,.08); color: var(--ink); }
        .stat-card span {
          color: var(--slate);
          font-size: 13px;
          font-weight: 700;
        }
        .stat-card strong {
          color: var(--ink);
          font-size: clamp(22px, 3vw, 29px);
          line-height: 1;
          overflow-wrap: anywhere;
        }
        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr);
          gap: 18px;
        }
        .content-card { padding: 20px; min-width: 0; }
        .content-card.full-span { grid-column: 1 / -1; }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .card-header h3 {
          margin: 0;
          color: var(--ink);
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0;
        }
        .detail-list { display: grid; gap: 0; }
        .detail-row {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid var(--paper-dim);
        }
        .detail-row:last-child { border-bottom: 0; }
        .detail-row span {
          color: var(--slate);
          font-size: 13px;
          font-weight: 800;
        }
        .detail-row strong {
          color: var(--ink);
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .appearance-editor {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, .72fr);
          gap: 18px;
          align-items: start;
        }
        .appearance-editor.preview-collapsed {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .appearance-controls {
          display: grid;
          gap: 16px;
          min-width: 0;
        }
        .control-label {
          display: block;
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin-bottom: 9px;
        }
        .template-choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .template-choice {
          border: 2px solid var(--line);
          border-radius: 12px;
          background: #fff;
          color: var(--ink);
          padding: 10px;
          text-align: left;
          cursor: pointer;
          display: grid;
          gap: 8px;
          font: inherit;
          min-width: 0;
        }
        .template-choice.selected {
          border-color: #9bdc00;
          box-shadow: 0 0 0 4px rgba(175,255,0,.16);
        }
        .template-choice strong {
          font-size: 14px;
          font-weight: 900;
        }
        .template-choice small {
          color: var(--slate);
          font-size: 12px;
          line-height: 1.35;
        }
        .template-swatch {
          height: 72px;
          border-radius: 8px;
          background: var(--preview-surface);
          border: 1px solid rgba(25,35,40,.08);
          padding: 10px;
          display: grid;
          align-content: end;
          gap: 6px;
          overflow: hidden;
        }
        .template-swatch i {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: var(--preview-accent);
          display: block;
        }
        .template-swatch b {
          width: 78%;
          height: 9px;
          border-radius: 999px;
          background: var(--preview-ink);
          display: block;
        }
        .template-swatch em {
          width: 52%;
          height: 7px;
          border-radius: 999px;
          background: rgba(25,35,40,.22);
          display: block;
        }
        .template-swatch.preview-noir {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr auto auto;
          align-content: stretch;
          gap: 6px;
        }
        .template-swatch.preview-noir i {
          grid-row: 1 / 4;
          width: auto;
          height: auto;
          border-radius: 4px;
          background: linear-gradient(150deg, color-mix(in srgb, var(--preview-accent) 30%, var(--preview-ink)), var(--preview-ink));
        }
        .template-swatch.preview-noir b {
          align-self: end;
          border-radius: 3px;
        }
        .template-swatch.preview-noir em {
          border-radius: 3px;
          background: var(--preview-accent);
          height: 7px;
        }
        .color-choice-grid {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .color-choice {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px rgba(25,35,40,.14);
          cursor: pointer;
        }
        .color-choice.selected {
          box-shadow: 0 0 0 2px var(--ink), 0 0 0 5px #fff;
        }
        .custom-color {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 5px 10px 5px 5px;
          background: #fff;
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
        }
        .custom-color input {
          width: 31px;
          height: 31px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          overflow: hidden;
          background: transparent;
        }
        .color-input-grid,
        .copy-grid,
        .media-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .color-input-row {
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #fff;
          padding: 10px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 36px;
          gap: 8px;
          align-items: center;
          min-width: 0;
        }
        .color-input-row span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .color-input-row input {
          width: 36px;
          height: 36px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .color-input-row b {
          grid-column: 1 / -1;
          color: var(--ink);
          font-size: 12px;
          font-weight: 900;
        }
        .logo-drop {
          min-height: 132px;
        }
        .logo-drop img {
          height: 150px;
          object-fit: contain;
          padding: 12px;
          background: #fff;
        }
        .banner-drop {
          min-height: 168px;
        }
        .banner-drop img {
          height: 210px;
        }
        .appearance-preview-col {
          position: sticky;
          top: 16px;
          display: grid;
          gap: 10px;
          align-self: start;
        }
        .preview-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .preview-toggle {
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .preview-toggle:hover {
          border-color: var(--slate);
        }
        .preview-hint {
          margin: 0;
          color: var(--slate);
          font-size: 12.5px;
          line-height: 1.5;
        }
        .orders-list { display: grid; gap: 10px; }
        .order-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid var(--paper-dim);
          border-radius: 8px;
          padding: 13px;
          width: 100%;
          background: transparent;
          font: inherit;
          text-align: inherit;
          cursor: pointer;
          transition: border-color .15s ease, background .15s ease;
        }
        .order-row:hover { border-color: var(--line); background: var(--paper-dim); }
        .order-row div {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .order-row div:last-child { text-align: right; }
        .order-row strong {
          color: var(--ink);
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .order-row span {
          color: var(--slate);
          font-size: 12px;
        }
        .status-pill {
          justify-self: end;
          width: fit-content;
          border-radius: 999px;
          background: rgba(175,255,0,.22);
          color: var(--ink) !important;
          padding: 4px 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .order-details {
          padding: 13px;
          border-top: 1px solid var(--paper-dim);
          background: var(--paper-dim);
          display: grid;
          gap: 12px;
        }
        .order-items { display: grid; gap: 8px; }
        .order-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid var(--paper-dim);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .order-item img,
        .order-item-noimg {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          object-fit: cover;
          background: var(--paper-dim);
          flex-shrink: 0;
        }
        .order-item > div {
          display: grid;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .order-item strong { font-size: 13.5px; color: var(--ink); overflow-wrap: anywhere; }
        .order-item span { font-size: 12px; color: var(--slate); }
        .order-item-subtotal { white-space: nowrap; font-size: 13.5px; }
        .order-details-empty { margin: 0; font-size: 12.5px; color: var(--slate); }
        .order-summary,
        .order-contact {
          display: grid;
          gap: 4px;
          font-size: 13px;
          border-top: 1px dashed var(--line);
          padding-top: 10px;
        }
        .order-summary div,
        .order-contact div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .order-summary span,
        .order-contact span { color: var(--slate); }
        .order-contact strong { text-align: right; overflow-wrap: anywhere; }
        .order-detail { display: grid; gap: 16px; }
        .order-detail-back {
          justify-self: start;
          border: 0;
          background: transparent;
          color: var(--slate);
          font: inherit;
          font-weight: 700;
          font-size: 13px;
          padding: 0;
          cursor: pointer;
        }
        .order-detail-back:hover { color: var(--ink); }
        .order-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 1px dashed var(--line);
          padding-bottom: 14px;
        }
        .order-detail-header h3 { margin: 0 0 4px; font-size: 18px; color: var(--ink); }
        .order-detail-header span { font-size: 12.5px; color: var(--slate); }
        .order-detail-header strong { font-size: 18px; color: var(--ink); white-space: nowrap; }
        .order-timeline { display: grid; gap: 12px; padding: 4px 0 14px; border-bottom: 1px dashed var(--line); }
        .order-cancelled-banner {
          border-radius: 8px;
          background: rgba(220,38,38,.1);
          color: #b91c1c;
          border: 1px solid rgba(220,38,38,.25);
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 800;
        }
        .timeline { display: flex; align-items: flex-start; }
        .timeline.is-cancelled { opacity: .45; }
        .timeline-step {
          flex: 1;
          position: relative;
          display: grid;
          justify-items: center;
          gap: 4px;
          border: 0;
          background: transparent;
          font: inherit;
          padding: 0 4px 0;
          cursor: pointer;
        }
        .timeline-step:disabled { cursor: not-allowed; }
        .timeline-step::before {
          content: '';
          position: absolute;
          top: 13px;
          left: -50%;
          width: 100%;
          height: 2px;
          background: var(--paper-dim);
          z-index: 0;
        }
        .timeline-step:first-child::before { display: none; }
        .timeline-step.reached::before { background: var(--ink); }
        .timeline-dot {
          position: relative;
          z-index: 1;
          width: 27px;
          height: 27px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border: 2px solid var(--line);
          background: #fff;
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
        }
        .timeline-step.reached .timeline-dot { border-color: var(--ink); background: var(--ink); color: #fff; }
        .timeline-step.current .timeline-dot { box-shadow: 0 0 0 3px rgba(175,255,0,.35); }
        .timeline-label { font-size: 12.5px; font-weight: 800; color: var(--ink); }
        .timeline-step:not(.reached) .timeline-label { color: var(--slate); }
        .timeline-time { font-size: 11px; color: var(--slate); }
        .btn-link {
          justify-self: start;
          border: 0;
          background: transparent;
          color: var(--ink);
          font: inherit;
          font-weight: 800;
          text-decoration: underline;
          padding: 0;
          cursor: pointer;
        }
        .btn-link-danger { color: #b91c1c; }
        .btn-link:disabled { opacity: .6; cursor: not-allowed; }
        .empty-state {
          border: 1px dashed var(--line);
          border-radius: 8px;
          padding: 30px 18px;
          text-align: center;
          color: var(--slate);
          line-height: 1.6;
        }
        .product-layout {
          display: grid;
          grid-template-columns: minmax(280px, .85fr) minmax(0, 1.15fr);
          gap: 18px;
        }
        .product-form {
          display: grid;
          gap: 14px;
          align-content: start;
        }
        .edit-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-radius: 8px;
          background: rgba(175,255,0,.16);
          border: 1px solid rgba(175,255,0,.3);
          color: var(--ink);
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 900;
        }
        .edit-banner button {
          border: 0;
          border-radius: 999px;
          background: var(--ink);
          color: #fff;
          padding: 7px 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }
        .edit-banner button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .product-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .field-group {
          display: grid;
          gap: 7px;
          min-width: 0;
        }
        .field-group.full { grid-column: 1 / -1; }
        .field-group span {
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .field-group input,
        .field-group select,
        .field-group textarea {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #fff;
          color: var(--ink);
          font: inherit;
          font-size: 14px;
          padding: 12px 13px;
          outline: none;
        }
        .field-group select {
          appearance: none;
          cursor: pointer;
        }
        .field-group textarea { resize: vertical; min-height: 84px; }
        .field-group input:focus,
        .field-group select:focus,
        .field-group textarea:focus {
          border-color: #9bdc00;
          box-shadow: 0 0 0 4px rgba(175,255,0,.15);
        }
        .business-info-view,
        .business-info-form {
          display: grid;
          gap: 14px;
        }
        .appearance-summary-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .appearance-summary-row .template-swatch {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
        }
        .appearance-summary-row strong {
          display: block;
          font-size: 15px;
        }
        .appearance-summary-row p {
          margin: 4px 0 0;
          color: var(--slate);
          font-size: 13px;
          line-height: 1.5;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .secondary-action {
          width: fit-content;
          border: 1px solid rgba(25,35,40,.12);
          border-radius: 999px;
          background: #fff;
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }
        .secondary-action:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .image-drop {
          min-height: 190px;
          border: 1.5px dashed rgba(25,35,40,.18);
          border-radius: 8px;
          background: rgba(25,35,40,.03);
          display: grid;
          place-items: center;
          color: var(--slate);
          cursor: pointer;
          overflow: hidden;
        }
        .image-drop span {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 900;
        }
        .image-drop input { display: none; }
        .image-drop img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
        }
        .image-drop.has-image { border-style: solid; background: #fff; }
        .image-drop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
        }
        .image-tile {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(25,35,40,.03);
        }
        .image-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .image-tile-cover-badge {
          position: absolute;
          bottom: 6px;
          left: 6px;
          background: var(--signal);
          color: var(--ink);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
          padding: 3px 7px;
          border-radius: 999px;
        }
        .image-tile-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 0;
          background: rgba(15,21,24,.72);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .image-tile-remove:hover { background: #9d2525; }
        .image-tile-add {
          border: 1.5px dashed rgba(25,35,40,.18);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: var(--slate);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          text-align: center;
        }
        .image-tile-add input { display: none; }
        .image-tile-add:hover { border-color: var(--slate); color: var(--ink); }
        .product-card-media {
          position: relative;
        }
        .product-card-photo-count {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(15,21,24,.72);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .image-help {
          margin: -6px 0 0;
          color: var(--slate);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }
        .upload-progress {
          display: grid;
          gap: 8px;
          border-radius: 8px;
          background: rgba(25,35,40,.04);
          border: 1px solid var(--line);
          padding: 11px 13px;
        }
        .upload-progress div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--slate);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .upload-progress strong {
          color: var(--ink);
        }
        .upload-progress progress {
          width: 100%;
          height: 9px;
          border: 0;
          border-radius: 999px;
          overflow: hidden;
          background: var(--paper-dim);
        }
        .upload-progress progress::-webkit-progress-bar {
          background: var(--paper-dim);
          border-radius: 999px;
        }
        .upload-progress progress::-webkit-progress-value {
          background: var(--signal);
          border-radius: 999px;
        }
        .upload-progress progress::-moz-progress-bar {
          background: var(--signal);
          border-radius: 999px;
        }
        .product-submit {
          border: 0;
          border-radius: 999px;
          background: var(--signal);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 13px 18px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .product-submit:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .form-alert {
          border-radius: 8px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }
        .form-alert.error {
          background: rgba(255,107,107,.1);
          color: #9d2525;
          border: 1px solid rgba(255,107,107,.25);
        }
        .form-alert.success {
          background: rgba(175,255,0,.16);
          color: #3d5900;
          border: 1px solid rgba(175,255,0,.3);
        }
        .form-alert.warning {
          background: rgba(255,184,0,.12);
          color: #8a5a00;
          border: 1px solid rgba(255,184,0,.32);
        }
        .product-list-card {
          min-width: 0;
        }
        .product-count-pill {
          border-radius: 999px;
          background: rgba(175,255,0,.22);
          color: var(--ink);
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .product-card {
          border: 1px solid var(--paper-dim);
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
          min-width: 0;
        }
        .product-card img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          display: block;
          background: var(--paper-dim);
        }
        .product-card-body {
          display: grid;
          gap: 10px;
          padding: 12px;
        }
        .product-card-body strong,
        .product-card-body b {
          color: var(--ink);
          overflow-wrap: anywhere;
        }
        .product-card-body strong {
          display: block;
          font-size: 14px;
          margin-bottom: 3px;
        }
        .product-card-body span,
        .product-card-body small {
          color: var(--slate);
          font-size: 12px;
        }
        .product-card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .product-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .edit-product,
        .delete-product {
          width: 100%;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }
        .edit-product {
          border: 1px solid rgba(25,35,40,.12);
          background: rgba(25,35,40,.04);
          color: var(--ink);
        }
        .delete-product {
          border: 1px solid rgba(255,107,107,.2);
          background: rgba(255,107,107,.08);
          color: #9d2525;
        }
        .edit-product:disabled,
        .delete-product:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .sidebar-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15,21,24,.45);
          z-index: 10;
        }
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .content-grid { grid-template-columns: 1fr; }
          .product-layout,
          .appearance-editor,
          .appearance-editor.preview-collapsed { grid-template-columns: 1fr; }
          .media-grid { grid-template-columns: 1fr; }
          .appearance-preview-col { position: static; top: auto; }
        }
        @media (max-width: 780px) {
          .dashboard-sidebar { transform: translateX(-100%); }
          .dashboard-sidebar.open { transform: translateX(0); }
          .sidebar-backdrop.open { display: block; }
          .dashboard-main { margin-left: 0; padding: 16px; }
          .mobile-toggle { display: grid; }
          .topbar { align-items: flex-start; }
          .hero-panel { grid-template-columns: 1fr; }
          .hero-badge { width: fit-content; }
          .store-link { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .stats-grid { grid-template-columns: 1fr; }
          .topbar { flex-direction: column; }
          .detail-row { grid-template-columns: 1fr; gap: 4px; }
          .order-row { flex-direction: column; }
          .order-row div:last-child { text-align: left; }
          .status-pill { justify-self: start; }
          .product-form-grid,
          .product-grid,
          .color-input-grid,
          .copy-grid,
          .template-choice-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dashboard-brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-name">Blorbify</div>
            <div className="brand-sub">by Blorbmart</div>
          </div>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                navigate(tab.id === 'overview' ? '/dashboard' : `/dashboard/${tab.id}`);
                setSidebarOpen(false);
              }}
            >
              <tab.icon size={19} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-user">
          <div className="user-chip">
            <div className="avatar">{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            <IconLogout size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
          <div className="headline">
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard'}</h1>
            {activeTab === 'overview' && <p>Welcome back, {displayName}. Your store setup is synced from Firestore.</p>}
          </div>
          <a className="store-link" href={storeUrl} target="_blank" rel="noreferrer">
            {storeUrl}
          </a>
        </header>

        {activeTab === 'overview' && (
          <>
            <section className="hero-panel">
              <div>
                <h2>{businessName}</h2>
                <p>
                  {storeInfo.description ||
                    'Your store profile is ready. Add products whenever you are prepared to start taking orders.'}
                </p>
              </div>
              <div className="hero-badge">Onboarded</div>
            </section>

            <section className="stats-grid" aria-label="Store stats">
              <StatCard label="Revenue" value={formatCurrency(stats.revenue)} icon={IconDashboard} tone="lime" />
              <StatCard label="Orders" value={stats.totalOrders} icon={IconOrders} tone="blue" />
              <StatCard label="Customers" value={stats.totalCustomers} icon={IconUsers} tone="orange" />
              <StatCard label="Products" value={stats.totalProducts} icon={IconStore} tone="green" />
            </section>
          </>
        )}

        <section className="content-grid">
          {activeTab === 'products' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Add Products</h3>
              </div>
              <ProductManager
                userId={user.uid}
                storeInfo={storeInfo}
                products={products}
                onProductsSaved={(nextProducts) => setStore((current) => ({ ...(current || storeInfo), products: nextProducts }))}
              />
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'business') && (
            <div className="content-card">
              <div className="card-header">
                <h3>Business Information</h3>
              </div>
              <BusinessInfoEditor
                userId={user.uid}
                profile={profile}
                storeInfo={{
                  ...storeInfo,
                  businessName,
                  storeSlug,
                  storeUrl,
                }}
                onBusinessSaved={(nextStoreInfo) => setStore((current) => ({ ...(current || storeInfo), ...nextStoreInfo }))}
              />
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'appearance') && (
            <div className={`content-card ${activeTab === 'appearance' ? 'full-span' : ''}`}>
              <div className="card-header">
                <h3>Appearance</h3>
              </div>
              <AppearanceEditor
                userId={user.uid}
                storeInfo={{
                  ...storeInfo,
                  businessName,
                  storeSlug,
                  products,
                }}
                onAppearanceSaved={(nextStoreInfo) => setStore((current) => ({ ...(current || storeInfo), ...nextStoreInfo }))}
                compact={activeTab === 'overview'}
              />
            </div>
          )}

          {activeTab === 'orders' && orderId && (
            <div className="content-card full-span">
              <OrderDetailPage key={orderId} orderId={orderId} />
            </div>
          )}

          {activeTab === 'orders' && !orderId && (
            <div className="content-card">
              <div className="card-header">
                <h3>Orders</h3>
              </div>
              {orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No orders yet.</strong>
                  <br />
                  {ordersError || 'Your orders will show here as soon as customers start buying.'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Seller Payouts</h3>
              </div>
              <SellerPayoutPanel user={user} storeInfo={storeInfo} />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Billing</h3>
              </div>
              <BillingPanel user={user} userProfile={userProfile} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
