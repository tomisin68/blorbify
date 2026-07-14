import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  checkProductImageDimensions,
  uploadDigitalFile,
  uploadProductImage,
  uploadStoreBanner,
  uploadStoreLogo,
  validateDigitalFile,
  validateProductImage,
  validateStoreBanner,
  validateStoreLogo,
} from './cloudinary';
import { auth, db } from './firebase';
import { createStoreSlug, getPublicStoreBaseUrl, getStoreUrl, validateStoreSlugFormat } from './storeLinks';
import { getWhatsAppOrderHref } from './storefront/storefrontUtils';
import { buildPublicStorePayload } from './publicStore';
import { applyDashboardManifest, resetAppManifest } from './pwaManifest';
import { getProductImages, getProductCoverImage, MAX_PRODUCT_IMAGES } from './productImages';
import SellerPayoutPanel from './SellerPayoutPanel';
import BillingPanel from './BillingPanel';
import InvoicesPanel from './InvoicesPanel';
import ReportsPanel from './ReportsPanel';
import AnalyticsPanel from './AnalyticsPanel';
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
import StarRating from './storefront/StarRating';
import { nigerianStates } from './nigerianStates';
import {
  confirmEmailChange,
  generateProductDescription,
  notifyLowStock,
  notifyOrderStatusUpdate,
  notifySupportMessage,
  sendEmailChangeOtp,
  sendOrderReceipt,
} from './backendApi';
import DashboardTour from './DashboardTour';

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

const IconChart = (props) => (
  <IconBase {...props}>
    <path d="M4 20V10M10 20V4M16 20v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 20h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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

const IconTruck = (props) => (
  <IconBase {...props}>
    <path d="M3 6.5h10.5v10H3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M13.5 10h3.7L20 12.8v3.7h-6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="7.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="16.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.7" />
  </IconBase>
);

const IconServices = (props) => (
  <IconBase {...props}>
    <path d="M8 7V5.8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3.5" y="7" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 12.5h17M10.5 12v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconQr = (props) => (
  <IconBase {...props}>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M14 14h3v3h-3zM19 14h1.5v1.5H19zM14 19h1.5v1.5H14zM17.5 17.5H20V20h-2.5z" fill="currentColor" />
  </IconBase>
);

const IconCoupon = (props) => (
  <IconBase {...props}>
    <path d="M4 9.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1.3a1.7 1.7 0 0 0 0 3.4V15.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.3a1.7 1.7 0 0 0 0-3.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M9.5 7.5v9" stroke="currentColor" strokeWidth="1.7" strokeDasharray="1.6 2" strokeLinecap="round" />
  </IconBase>
);

const IconShare = (props) => (
  <IconBase {...props}>
    <circle cx="18" cy="6" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="6" cy="12" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="18" cy="18" r="2.3" stroke="currentColor" strokeWidth="1.7" />
    <path d="m8.1 10.8 7.8-3.6M8.1 13.2l7.8 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </IconBase>
);

const IconStar = (props) => (
  <IconBase {...props}>
    <path d="m12 4 2.3 4.9 5.3.7-3.9 3.7.9 5.3L12 16l-4.6 2.6.9-5.3-3.9-3.7 5.3-.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </IconBase>
);

const IconSupport = (props) => (
  <IconBase {...props}>
    <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8v4.5a2.5 2.5 0 0 1-2.5 2.5H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="12" width="4" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="17" y="12" width="4" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M13.5 19h-2a1.5 1.5 0 0 1 0-3h2a1.5 1.5 0 0 1 0 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
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

const businessServiceGroups = [
  {
    category: 'Business Registration',
    services: [
      {
        name: 'CAC Registration',
        meta: 'Business name or limited liability',
        description: 'Register your business with the Corporate Affairs Commission so you can open a business bank account and build trust with customers.',
        status: 'coming-soon',
      },
    ],
  },
  {
    category: 'Advertising',
    services: [
      {
        name: 'Meta Ads',
        meta: 'Facebook & Instagram',
        description: 'Targeted ad campaigns that put your store in front of buyers already browsing on Facebook and Instagram.',
        status: 'coming-soon',
      },
      {
        name: 'Google Ads',
        meta: 'Search & Display',
        description: 'Show up when customers search for what you sell, and retarget visitors who checked out your store.',
        status: 'coming-soon',
      },
    ],
  },
  {
    category: 'Local Presence',
    services: [
      {
        name: 'Google My Business',
        meta: 'Maps & local search',
        description: 'Get your store listed on Google Maps and local search results, complete with reviews and business hours.',
        status: 'coming-soon',
      },
    ],
  },
  {
    category: 'Marketing',
    services: [
      {
        name: 'Email Marketing',
        meta: 'Newsletters & promos',
        description: 'Reach past customers directly with restock alerts, promotions, and seasonal campaigns.',
        status: 'coming-soon',
      },
    ],
  },
  {
    category: 'AI & Automation',
    services: [
      {
        name: 'AI Product Descriptions',
        meta: 'Auto-generated copy',
        description: 'Turn a product photo and price into ready-to-use, on-brand descriptions and social captions in seconds.',
        status: 'coming-soon',
      },
    ],
  },
  {
    category: 'Social Sync',
    services: [
      {
        name: 'Instagram & TikTok Sync',
        meta: 'Auto-post new products',
        description: 'Keep your Instagram and TikTok shops in step with your storefront — new products post automatically.',
        status: 'coming-soon',
      },
    ],
  },
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

// Mirrors buildWhatsAppOrderMessage in Storefront.jsx (the buyer-facing checkout
// handoff) but summarizes pickup/delivery details for a courier instead of a product order.
function buildLogisticsHandoffMessage(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = [
    `Hi, we'd like to book a delivery for order #${(order.id || '').slice(0, 8)}:`,
    '',
    ...items.map((item) => `• ${item.quantity || 1} x ${item.name || 'Item'}`),
    '',
    `Total: ${formatCurrency(order.total ?? order.amount)}`,
    `Recipient: ${order.customerName || 'Customer'}`,
  ];
  if (order.customerPhone) lines.push(`Phone: ${order.customerPhone}`);
  if (order.customerAddress) lines.push(`Delivery address: ${order.customerAddress}`);
  if (order.customerLocation) lines.push(`Location: ${order.customerLocation}`);
  if (order.customerNote) lines.push(`Note: ${order.customerNote}`);
  return lines.join('\n');
}

function OrderDetailPage({ orderId, logisticsCompanies = [] }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState('');

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
  const hasPhysicalItems = items.length === 0 || items.some((item) => item.type !== 'digital');
  const hasDigitalItems = items.some((item) => item.type === 'digital');
  const placedAt = formatOrderTimestamp(order.createdAt);
  const currentStatus = order.status || 'pending';
  const isCancelled = currentStatus === 'cancelled';
  const isDelivered = currentStatus === 'delivered';
  const currentIndex = ORDER_FLOW_STATUSES.findIndex((step) => step.value === currentStatus);
  const nextStep = !isCancelled ? ORDER_FLOW_STATUSES[currentIndex + 1] : null;

  const confirmAndUpdate = (status, confirmMessage) => {
    if (updatingStatus) return;
    if (window.confirm(confirmMessage)) {
      updateStatus(status);
    }
  };

  const handleSendReceipt = async () => {
    if (sendingReceipt) return;
    setSendingReceipt(true);
    setReceiptMessage('');
    try {
      await sendOrderReceipt({ orderId });
      setReceiptMessage('Receipt emailed to you.');
    } catch (error) {
      console.error('Send receipt failed:', error);
      setReceiptMessage(error.message || 'Could not send the receipt — try again.');
    } finally {
      setSendingReceipt(false);
    }
  };

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

        <div className={`timeline ${isCancelled ? 'is-cancelled' : ''}`} aria-hidden="true">
          {ORDER_FLOW_STATUSES.map((step, index) => {
            const reached = !isCancelled && index <= currentIndex;
            const isCurrent = !isCancelled && index === currentIndex;
            const at = formatOrderTimestamp(getStatusHistoryAt(order, step.value));
            return (
              <div
                key={step.value}
                className={`timeline-step ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <span className="timeline-dot">{reached && !isCurrent ? '✓' : index + 1}</span>
                <span className="timeline-label">{step.label}</span>
                <span className="timeline-time">{at || '—'}</span>
              </div>
            );
          })}
        </div>

        {isDelivered && !isCancelled && (
          <p className="order-timeline-complete">✓ This order is complete.</p>
        )}

        {nextStep && (
          <button
            type="button"
            className="order-primary-action"
            disabled={updatingStatus}
            onClick={() => confirmAndUpdate(
              nextStep.value,
              `Mark this order as "${nextStep.label}"? The buyer will get an email update.`
            )}
          >
            {updatingStatus ? (
              <>
                <span className="btn-spinner" />
                Updating…
              </>
            ) : (
              `Mark as ${nextStep.label} →`
            )}
          </button>
        )}

        {!isCancelled && !isDelivered && (
          <button
            type="button"
            className="btn-link btn-link-danger"
            disabled={updatingStatus}
            onClick={() => confirmAndUpdate('cancelled', 'Cancel this order? The buyer will be notified by email.')}
          >
            Cancel this order
          </button>
        )}

        {order.paymentMethod === 'whatsapp' && (
          <div className="order-receipt-action">
            <button
              type="button"
              className="btn-link"
              disabled={sendingReceipt}
              onClick={handleSendReceipt}
            >
              {sendingReceipt ? 'Sending…' : 'Email me a receipt'}
            </button>
            {receiptMessage && <span className="order-receipt-message">{receiptMessage}</span>}
          </div>
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

      {hasDigitalItems && (
        <div className="order-logistics-share">
          <h4>Digital delivery</h4>
          {order.digitalDelivery?.items?.length ? (
            <>
              <p className="order-details-empty">
                Delivered {formatOrderTimestamp(order.digitalDelivery.deliveredAt) || 'just now'}.
              </p>
              <div className="order-logistics-list">
                {order.digitalDelivery.items.map((item) => (
                  <a key={item.productId} className="btn-link" href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                    Download {item.name} →
                  </a>
                ))}
              </div>
            </>
          ) : (
            <p className="order-details-empty">
              The buyer's download link will appear here once payment is confirmed.
            </p>
          )}
        </div>
      )}

      {!isCancelled && hasPhysicalItems && (
        <div className="order-logistics-share">
          <h4>Share with a logistics partner</h4>
          {logisticsCompanies.length === 0 ? (
            <p className="order-details-empty">
              No logistics partners available yet — add one from the Logistics tab.
            </p>
          ) : (
            <div className="order-logistics-list">
              {logisticsCompanies.map((company) => {
                const href = getWhatsAppOrderHref(company.whatsapp, buildLogisticsHandoffMessage(order));
                if (!href) return null;
                return (
                  <a
                    key={company.id}
                    className="btn-link"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Share via WhatsApp with {company.name} →
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function createProductId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`;
}

function generateReferralCode() {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return random.toUpperCase();
}

const emptyProductForm = {
  name: '',
  price: '',
  description: '',
  category: '',
  stock: '',
  type: 'physical',
};

const LOW_STOCK_THRESHOLD = 3;

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

// Firestore's publicStores/{slug} doc is keyed BY the slug itself, so a slug
// change can't be an in-place update — it has to create a new doc, migrate
// the reviews subcollection (also keyed off the old slug), then retire the
// old doc. Called only when the slug actually changed.
async function renameStorePublicDoc({ userId, storeInfo, oldSlug, newSlug }) {
  const targetRef = doc(db, 'publicStores', newSlug);
  const targetSnap = await getDoc(targetRef);
  if (targetSnap.exists() && targetSnap.data()?.ownerId !== userId) {
    throw new Error('This store URL is already taken. Please choose another.');
  }

  await setDoc(targetRef, {
    ...buildPublicStorePayload({ ...storeInfo, storeSlug: newSlug }, userId),
    updatedAt: serverTimestamp(),
  });

  if (oldSlug) {
    try {
      const reviewsSnap = await getDocs(collection(db, 'publicStores', oldSlug, 'reviews'));
      await Promise.all(reviewsSnap.docs.map((reviewDoc) =>
        setDoc(doc(db, 'publicStores', newSlug, 'reviews', reviewDoc.id), reviewDoc.data())
      ));
      await Promise.all(reviewsSnap.docs.map((reviewDoc) =>
        deleteDoc(doc(db, 'publicStores', oldSlug, 'reviews', reviewDoc.id))
      ));
      await deleteDoc(doc(db, 'publicStores', oldSlug));
    } catch (cleanupError) {
      // The new doc + reviews are already migrated and live at the new slug —
      // the store is fully functional even if this best-effort cleanup of the
      // old slug's doc fails, so it's logged rather than surfaced as an error.
      console.error('Old store slug cleanup failed (non-fatal):', cleanupError);
    }
  }
}

function ProductManager({ userId, storeInfo, products, onProductsSaved }) {
  const [form, setForm] = useState(emptyProductForm);
  const [imageItems, setImageItems] = useState([]);
  const [digitalFileItem, setDigitalFileItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);

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

  const handleDigitalFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const fileError = validateDigitalFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setDigitalFileItem({ kind: 'new', file, name: file.name });
    setError('');
    setSuccess('');
  };

  const removeDigitalFileItem = () => {
    setDigitalFileItem(null);
    setError('');
    setSuccess('');
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
    setDigitalFileItem(null);
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
    const isDigital = form.type === 'digital';
    const stock = form.stock === '' ? 0 : Number(String(form.stock).replace(/[^\d]/g, ''));

    if (!name) {
      setError('Enter a product name.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid product price.');
      return;
    }

    if (!isDigital && (!Number.isFinite(stock) || stock < 0)) {
      setError('Enter a valid stock quantity.');
      return;
    }

    if (!imageItems.length) {
      setError('Add at least one product photo.');
      return;
    }

    if (isDigital && !digitalFileItem) {
      setError('Add the file customers will receive after buying this product.');
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

      let digitalFile = null;
      if (isDigital) {
        if (digitalFileItem.kind === 'existing') {
          digitalFile = {
            url: digitalFileItem.url,
            publicId: digitalFileItem.publicId || '',
            format: digitalFileItem.format || '',
            bytes: digitalFileItem.bytes || null,
            originalName: digitalFileItem.originalName || '',
          };
        } else {
          const uploaded = await uploadDigitalFile(digitalFileItem.file, `blorbify/digital-files/${userId}`, (fileProgress) => {
            setUploadProgress(fileProgress);
          });
          digitalFile = {
            url: uploaded.secureUrl,
            publicId: uploaded.publicId,
            format: uploaded.format,
            bytes: uploaded.bytes,
            originalName: uploaded.originalName,
          };
        }
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
        type: isDigital ? 'digital' : 'physical',
        stock: isDigital ? null : stock,
        digitalFile: isDigital ? digitalFile : null,
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

      // Fires once when stock crosses the threshold going down, not on every save
      // while it stays low — a new product's "previous" stock counts as
      // unlimited so it can still alert the first time it's saved low.
      const previousStock = Number(currentProduct?.stock ?? Infinity);
      if (!isDigital && stock <= LOW_STOCK_THRESHOLD && previousStock > LOW_STOCK_THRESHOLD) {
        notifyLowStock({ productName: name, stock }).catch((notifyError) => {
          console.error('Low stock alert failed:', notifyError);
        });
      }

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
    setDigitalFileItem(product.type === 'digital' && product.digitalFile?.url
      ? { kind: 'existing', ...product.digitalFile, name: product.digitalFile.originalName || 'Current file' }
      : null);
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
      type: product.type === 'digital' ? 'digital' : 'physical',
    });
  };

  const handleGenerateDescription = async () => {
    const name = form.name.trim();
    if (!name) {
      setError('Enter a product name first so AI knows what to write about.');
      return;
    }

    setGeneratingDescription(true);
    setError('');
    setSuccess('');
    try {
      const response = await generateProductDescription({
        name,
        category: form.category,
        price: form.price,
        type: form.type,
      });
      updateField('description', response.data.description);
    } catch (generateError) {
      setError(generateError?.message || 'Could not generate a description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
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
              <span>Product type</span>
              <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                <option value="physical">Physical — shipped to the customer</option>
                <option value="digital">Digital — a file to download</option>
              </select>
            </label>
            <label className="field-group">
              <span>Price (NGN)</span>
              <input inputMode="decimal" value={form.price} onChange={(event) => updateField('price', event.target.value)} placeholder="8500" />
            </label>
            <label className="field-group">
              <span>Category</span>
              <input value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder="Fashion" />
            </label>
            {form.type !== 'digital' && (
              <label className="field-group">
                <span>Stock</span>
                <input inputMode="numeric" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} placeholder="12" />
              </label>
            )}
            <label className="field-group full">
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                Description
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingDescription || saving}
                  style={{ fontSize: '0.85em' }}
                >
                  {generatingDescription ? 'Generating…' : '✨ Generate with AI'}
                </button>
              </span>
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

          {form.type === 'digital' && (
            <>
              <span className="control-label">File customers receive after buying</span>
              {digitalFileItem ? (
                <div className="edit-banner">
                  <span>{digitalFileItem.name || digitalFileItem.originalName || 'File selected'}</span>
                  <button type="button" onClick={removeDigitalFileItem} disabled={saving}>Remove</button>
                </div>
              ) : (
                <label className="image-tile image-tile-add" style={{ width: '100%' }}>
                  <IconImage size={22} />
                  <span>Add file</span>
                  <input type="file" accept=".pdf,.zip,.epub,.mp3,.mp4,.docx" onChange={handleDigitalFileChange} />
                </label>
              )}
              <p className="image-help">Buyers get this file by email and on the checkout confirmation page right after payment.</p>
            </>
          )}

          {saving && (imageItems.some((item) => item.kind === 'new') || digitalFileItem?.kind === 'new') && (
            <div className="upload-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}>
              <div>
                <span>Uploading...</span>
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
                      <small>{product.type === 'digital' ? 'Digital download' : `${Number(product.stock || 0)} in stock`}</small>
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

const emptyCouponForm = {
  code: '',
  type: 'percent',
  value: '',
  expiresAt: '',
  usageLimit: '',
  active: true,
};

function CouponManager({ userId, coupons, onCouponsSaved }) {
  const [form, setForm] = useState(emptyCouponForm);
  const [editingCode, setEditingCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(emptyCouponForm);
    setEditingCode('');
  };

  const saveCoupons = async (nextCoupons) => {
    await setDoc(doc(db, 'stores', userId), { coupons: nextCoupons, updatedAt: serverTimestamp() }, { merge: true });
    onCouponsSaved(nextCoupons);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);

    if (!code) {
      setError('Enter a coupon code.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid discount value.');
      return;
    }
    if (form.type === 'percent' && value > 100) {
      setError('Percentage discounts cannot exceed 100.');
      return;
    }
    if (!editingCode && coupons[code]) {
      setError('A coupon with this code already exists.');
      return;
    }

    setSaving(true);
    try {
      const existing = editingCode ? coupons[editingCode] : null;
      const nextCoupon = {
        type: form.type,
        value,
        expiresAt: form.expiresAt || null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usageCount: existing?.usageCount || 0,
        active: form.active,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      const nextCoupons = { ...coupons };
      if (editingCode && editingCode !== code) {
        delete nextCoupons[editingCode];
      }
      nextCoupons[code] = nextCoupon;

      await saveCoupons(nextCoupons);
      resetForm();
      setSuccess(editingCode ? 'Coupon updated.' : 'Coupon created.');
    } catch (saveError) {
      setError(saveError?.message || 'Coupon could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (code) => {
    const coupon = coupons[code];
    setEditingCode(code);
    setForm({
      code,
      type: coupon.type || 'percent',
      value: coupon.value ?? '',
      expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : '',
      usageLimit: coupon.usageLimit ?? '',
      active: coupon.active !== false,
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextCoupons = { ...coupons };
      delete nextCoupons[code];
      await saveCoupons(nextCoupons);
      setSuccess('Coupon removed.');
    } catch (deleteError) {
      setError(deleteError?.message || 'Coupon could not be removed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const couponEntries = Object.entries(coupons);

  return (
    <div className="product-manager">
      <div className="product-layout">
        <form className="product-form" onSubmit={handleSubmit}>
          {editingCode && (
            <div className="edit-banner">
              <span>Editing coupon</span>
              <button type="button" onClick={resetForm} disabled={saving}>Cancel</button>
            </div>
          )}
          <div className="product-form-grid">
            <label className="field-group">
              <span>Coupon code</span>
              <input
                value={form.code}
                onChange={(event) => updateField('code', event.target.value.toUpperCase())}
                placeholder="WELCOME10"
                disabled={Boolean(editingCode)}
              />
            </label>
            <label className="field-group">
              <span>Discount type</span>
              <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off (NGN)</option>
              </select>
            </label>
            <label className="field-group">
              <span>{form.type === 'percent' ? 'Percent off' : 'Amount off (NGN)'}</span>
              <input
                inputMode="decimal"
                value={form.value}
                onChange={(event) => updateField('value', event.target.value)}
                placeholder={form.type === 'percent' ? '10' : '1000'}
              />
            </label>
            <label className="field-group">
              <span>Expiry date (optional)</span>
              <input type="date" value={form.expiresAt} onChange={(event) => updateField('expiresAt', event.target.value)} />
            </label>
            <label className="field-group">
              <span>Usage limit (optional)</span>
              <input inputMode="numeric" value={form.usageLimit} onChange={(event) => updateField('usageLimit', event.target.value)} placeholder="Unlimited" />
            </label>
            <label className="field-group coupon-active-toggle">
              <span>Active</span>
              <input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />
            </label>
          </div>

          {error && <div className="form-alert error">{error}</div>}
          {success && <div className="form-alert success">{success}</div>}

          <button type="submit" className="product-submit" disabled={saving}>
            {saving ? 'Saving...' : <><IconPlus size={17} /> {editingCode ? 'Save changes' : 'Add coupon'}</>}
          </button>
        </form>

        <div className="product-list-card">
          <div className="card-header">
            <h3>Coupons</h3>
            <span className="product-count-pill">{couponEntries.length}</span>
          </div>

          {couponEntries.length > 0 ? (
            <div className="coupon-list">
              {couponEntries.map(([code, coupon]) => (
                <div className="coupon-row" key={code}>
                  <div>
                    <strong>{code}</strong>
                    <span>{coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`}</span>
                  </div>
                  <div className="coupon-row-meta">
                    <span className={`partner-status ${coupon.active ? 'available' : 'coming-soon'}`}>
                      {coupon.active ? 'Active' : 'Paused'}
                    </span>
                    <span>{coupon.usageCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''} used</span>
                    {coupon.expiresAt && <span>Expires {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="product-actions">
                    <button type="button" className="edit-product" onClick={() => handleEdit(code)} disabled={saving}>
                      <IconEdit size={15} /> Edit
                    </button>
                    <button type="button" className="delete-product" onClick={() => handleDelete(code)} disabled={saving}>
                      <IconTrash size={15} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No coupons yet.</strong>
              <br />
              Create a code to offer buyers a percentage or fixed discount at checkout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalInfoEditor({ userId, profile }) {
  const getCurrentForm = () => ({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
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

  const startEditing = () => {
    setForm(getCurrentForm());
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const cancel = () => {
    setForm(getCurrentForm());
    setEditing(false);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!form.lastName.trim()) {
      setError('Last name is required.');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', userId), {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setEditing(false);
      setSuccess('Personal information updated.');
    } catch (saveError) {
      setError(saveError?.message || 'Personal information could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="business-info-view">
        <div className="detail-list">
          <DetailRow label="First name" value={profile?.firstName} />
          <DetailRow label="Last name" value={profile?.lastName} />
        </div>
        {success && <div className="form-alert success">{success}</div>}
        <button type="button" className="secondary-action" onClick={startEditing}>
          <IconEdit size={16} />
          Edit personal info
        </button>
      </div>
    );
  }

  return (
    <form className="business-info-form" onSubmit={handleSubmit}>
      <div className="product-form-grid">
        <label className="field-group">
          <span>First name</span>
          <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} placeholder="Chioma" maxLength="50" />
        </label>
        <label className="field-group">
          <span>Last name</span>
          <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} placeholder="Okafor" maxLength="50" />
        </label>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="secondary-action" onClick={cancel} disabled={saving}>Cancel</button>
        <button type="submit" className="product-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save personal info'}
        </button>
      </div>
    </form>
  );
}

function AccountEmailEditor({ profile }) {
  const [step, setStep] = useState('idle'); // idle | entering | verifying
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // `profile` is kept live by the Dashboard's own Firestore listener on the
  // user doc, so once confirmEmailChange updates users/{uid}.email, this
  // reflects the new address automatically — no local mirror/effect needed.
  const currentEmail = profile?.email || '';

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const startChange = () => {
    setStep('entering');
    setNewEmail('');
    setCode('');
    setError('');
    setSuccess('');
  };

  const cancel = () => {
    setStep('idle');
    setNewEmail('');
    setCode('');
    setError('');
  };

  const requestCode = async (emailToVerify) => {
    setSending(true);
    setError('');
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await sendEmailChangeOtp(emailToVerify, idToken);
      setCooldown(result?.resendCooldownSeconds || 45);
      return true;
    } catch (err) {
      setError(err?.message || 'Could not send a verification code. Please try again.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      setError('That is already your current email address.');
      return;
    }

    setNewEmail(trimmed);
    const sent = await requestCode(trimmed);
    if (sent) setStep('verifying');
  };

  const handleResend = () => {
    if (sending || cooldown > 0) return;
    requestCode(newEmail);
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setVerifying(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await confirmEmailChange(code.trim(), idToken);
      await auth.currentUser.getIdToken(true);
      const confirmedEmail = result?.email || newEmail;
      setStep('idle');
      setSuccess(`Your login email is now ${confirmedEmail}. Use it next time you sign in.`);
    } catch (err) {
      setError(err?.message || 'Incorrect code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="account-email-editor">
      {step === 'idle' && (
        <div className="detail-list">
          <DetailRow label="Login email" value={currentEmail} />
          {success && <div className="form-alert success">{success}</div>}
          <button type="button" className="secondary-action" onClick={startChange}>
            <IconEdit size={16} />
            Change email
          </button>
        </div>
      )}

      {step === 'entering' && (
        <form className="business-info-form" onSubmit={handleSendCode}>
          <div className="product-form-grid">
            <label className="field-group full">
              <span>New email address</span>
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="you@newdomain.com"
              />
            </label>
          </div>
          {error && <div className="form-alert error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="secondary-action" onClick={cancel} disabled={sending}>Cancel</button>
            <button type="submit" className="product-submit" disabled={sending || !newEmail.trim()}>
              {sending ? 'Sending...' : 'Send verification code'}
            </button>
          </div>
        </form>
      )}

      {step === 'verifying' && (
        <form className="business-info-form" onSubmit={handleVerify}>
          <p className="partner-intro">
            Enter the 6-digit code we sent to <strong>{newEmail}</strong> to confirm this is your new login email.
          </p>
          <div className="product-form-grid">
            <label className="field-group full">
              <span>Verification code</span>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
              />
            </label>
          </div>
          {error && <div className="form-alert error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="secondary-action" onClick={cancel} disabled={verifying}>Cancel</button>
            <button type="button" className="secondary-action" onClick={handleResend} disabled={sending || cooldown > 0}>
              {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
            <button type="submit" className="product-submit" disabled={verifying || code.length !== 6}>
              {verifying ? 'Verifying...' : 'Verify & save'}
            </button>
          </div>
        </form>
      )}
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
    storeSlug: storeInfo.storeSlug || profile?.storeSlug || '',
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
    const slugError = validateStoreSlugFormat(form.storeSlug);
    if (slugError) return slugError;
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

    const currentSlug = storeInfo.storeSlug || profile?.storeSlug || '';
    const nextSlug = createStoreSlug(form.storeSlug);

    const businessUpdate = {
      businessName: form.businessName.trim(),
      businessType: form.businessType,
      description: form.description.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state,
      instagram: form.instagram.trim(),
      storeSlug: nextSlug,
      storeUrl: getStoreUrl(nextSlug),
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
      // The public store doc (and, for a slug change, the uniqueness check) is
      // written first and can throw — e.g. "already taken" — before touching
      // stores/{uid} or users/{uid}, so a rejected slug never leaves the
      // seller's own records pointing at a slug that was never published.
      if (nextSlug === currentSlug) {
        await publishPublicStore(nextStoreInfo, userId);
      } else {
        await renameStorePublicDoc({ userId, storeInfo: nextStoreInfo, oldSlug: currentSlug, newSlug: nextSlug });
      }

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
          <DetailRow label="Store URL" value={getStoreUrl(storeInfo.storeSlug || profile?.storeSlug)} />
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
        <label className="field-group full">
          <span>Store URL</span>
          <div className="slug-field-row">
            <span className="slug-prefix">{getPublicStoreBaseUrl().replace(/^https?:\/\//, '')}/</span>
            <input value={form.storeSlug} onChange={(event) => updateField('storeSlug', event.target.value)} placeholder="your-store-name" maxLength="40" />
          </div>
          <span className="field-hint">
            {form.storeSlug ? `Will be saved as: ${createStoreSlug(form.storeSlug)}` : 'Letters, numbers, and hyphens only.'}
          </span>
        </label>
      </div>

      {createStoreSlug(form.storeSlug) !== (storeInfo.storeSlug || profile?.storeSlug || '') && (
        <div className="form-alert warning">
          Changing your store URL breaks any links you've already shared (Instagram bio, WhatsApp, ads, QR codes, etc.) — they'll stop working once you save. Your new link will be <strong>{getStoreUrl(form.storeSlug)}</strong>.
        </div>
      )}

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

function ReferralsPanel({ userId, storeInfo, storeUrl, orders }) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const referralCode = storeInfo.referralCode || generatedCode;

  useEffect(() => {
    if (referralCode) return;

    let cancelled = false;
    const code = generateReferralCode();
    setDoc(doc(db, 'stores', userId), { referralCode: code, updatedAt: serverTimestamp() }, { merge: true })
      .then(() => {
        if (!cancelled) setGeneratedCode(code);
      })
      .catch((error) => {
        console.error('Referral code generation failed:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [referralCode, userId]);

  const referralLink = referralCode ? `${storeUrl}?ref=${referralCode}` : '';

  const attribution = useMemo(() => {
    const grouped = new Map();
    orders.forEach((order) => {
      const code = order.referralCode;
      if (!code) return;
      const entry = grouped.get(code) || { orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += Number(order.total || order.amount || 0);
      grouped.set(code, entry);
    });
    return Array.from(grouped.entries()).map(([code, stats]) => ({ code, ...stats }));
  }, [orders]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="referrals-panel">
      <p className="partner-intro">
        Share this link with customers so word-of-mouth referrals are tracked back to the orders they bring in.
      </p>
      <label className="field-group">
        <span>Your referral link</span>
        <div className="pos-link-row">
          <input value={referralLink || 'Generating your link…'} readOnly />
          <button type="button" className="secondary-action" onClick={handleCopy} disabled={!referralLink}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </label>

      <div className="referrals-orders">
        <div className="card-header">
          <h3>Attributed orders</h3>
        </div>
        {attribution.length > 0 ? (
          <div className="detail-list">
            {attribution.map((entry) => (
              <div className="detail-row" key={entry.code}>
                <span>{entry.code}</span>
                <strong>{entry.orders} order{entry.orders === 1 ? '' : 's'} · {formatCurrency(entry.revenue)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No referred orders yet.</strong>
            <br />
            Orders placed through your referral link will show up here.
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsManager({ storeSlug }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(Boolean(storeSlug));
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    if (!storeSlug) return undefined;

    const reviewsQuery = query(collection(db, 'publicStores', storeSlug, 'reviews'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        setReviews(snapshot.docs.map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Reviews load failed:', error);
        setReviews([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [storeSlug]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setDeletingId(reviewId);
    try {
      await deleteDoc(doc(db, 'publicStores', storeSlug, 'reviews', reviewId));
    } catch (error) {
      console.error('Review delete failed:', error);
    } finally {
      setDeletingId('');
    }
  };

  if (loading) {
    return <div className="empty-state">Loading reviews…</div>;
  }

  if (!reviews.length) {
    return (
      <div className="empty-state">
        <strong>No reviews yet.</strong>
        <br />
        Reviews customers leave on your products will show up here.
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <div className="review-row" key={review.id}>
          <div className="review-row-head">
            <StarRating value={review.rating} size={15} />
            <strong>{review.productName || 'Product'}</strong>
            <span className="review-row-author">by {review.customerName || 'Anonymous'}</span>
          </div>
          <p>{review.comment}</p>
          <button
            type="button"
            className="delete-product"
            onClick={() => handleDelete(review.id)}
            disabled={deletingId === review.id}
          >
            <IconTrash size={15} />
            {deletingId === review.id ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ))}
    </div>
  );
}

function PosPanel({ storeUrl }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(storeUrl, { width: 320, margin: 1, color: { dark: '#192328', light: '#ffffff' } })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error('QR code generation failed:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [storeUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="pos-panel">
      <p className="partner-intro">
        Print or display this QR code at your stall, shop counter, or market table. Customers scan it to open your
        storefront on their phone and check out on the spot — no card machine needed.
      </p>
      <div className="pos-layout">
        {qrDataUrl && (
          <div className="pos-qr-card">
            <img src={qrDataUrl} alt="QR code linking to your storefront" width={220} height={220} />
          </div>
        )}
        <div className="pos-links">
          <label className="field-group">
            <span>Your storefront link</span>
            <div className="pos-link-row">
              <input value={storeUrl} readOnly />
              <button type="button" className="secondary-action" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </label>
          {qrDataUrl && (
            <a className="secondary-action pos-download" href={qrDataUrl} download="storefront-qr-code.png">
              Download QR code
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const SUPPORT_BOT_TOPICS = [
  { keywords: ['payout', 'payment', 'withdraw', 'bank'], reply: "Payouts are sent to the bank account on file under Payouts. If a payout looks delayed, check its status there — our team will follow up here shortly too." },
  { keywords: ['deliver', 'shipping', 'courier'], reply: "Delivery fees and logistics options live under the Logistics tab. If this is about a specific order, share the order ID and we'll take a look." },
  { keywords: ['template', 'design', 'theme', 'color', 'appearance'], reply: "You can change your store's look anytime from the Appearance tab — template, colors, and copy update instantly. Let us know if something isn't rendering right." },
  { keywords: ['slug', 'url', 'link', 'domain'], reply: "Your store URL can be changed from Business Info. Changing it breaks any previously shared links, so let us know if you need help deciding on a new one." },
  { keywords: ['order', 'refund', 'cancel'], reply: "For a specific order issue, share the order ID and what's wrong — our team will check it and get back to you." },
];
const SUPPORT_BOT_DEFAULT_REPLY = "Thanks for reaching out! We've received your message and a member of the Blorbify team will reply here soon — usually within a few hours.";

function pickSupportBotReply(messageText) {
  const lower = messageText.toLowerCase();
  const match = SUPPORT_BOT_TOPICS.find((topic) => topic.keywords.some((keyword) => lower.includes(keyword)));
  return match ? match.reply : SUPPORT_BOT_DEFAULT_REPLY;
}

function SupportChatPanel({ userId, storeInfo, profile }) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;

    const messagesQuery = query(
      collection(db, 'supportConversations', userId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setLoadingMessages(false);
      },
      (error) => {
        console.error('Support chat listener failed:', error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const hasAdminReplied = messages.some((message) => message.senderType === 'admin');

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const senderName = storeInfo?.businessName || profile?.businessName || 'Seller';
    const conversationRef = doc(db, 'supportConversations', userId);

    try {
      await addDoc(collection(conversationRef, 'messages'), {
        senderType: 'seller',
        senderName,
        text: trimmed,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        conversationRef,
        {
          sellerId: userId,
          storeName: storeInfo?.businessName || profile?.businessName || '',
          ownerName: [profile?.firstName, profile?.lastName].filter(Boolean).join(' '),
          email: profile?.email || '',
          lastMessageText: trimmed,
          lastMessageAt: serverTimestamp(),
          lastMessageSender: 'seller',
          unreadByAdmin: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setText('');

      // Auto-reply only while no admin has ever engaged in this conversation
      // — once a real person has replied, the bot stays quiet from then on.
      if (!hasAdminReplied) {
        const botReply = pickSupportBotReply(trimmed);
        setTimeout(() => {
          addDoc(collection(conversationRef, 'messages'), {
            senderType: 'bot',
            senderName: 'Blorbify Bot',
            text: botReply,
            createdAt: serverTimestamp(),
          })
            .then(() =>
              setDoc(
                conversationRef,
                {
                  lastMessageText: botReply,
                  lastMessageAt: serverTimestamp(),
                  lastMessageSender: 'bot',
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              )
            )
            .catch((error) => console.error('Support bot auto-reply failed:', error));
        }, 1500);
      }

      notifySupportMessage({ messagePreview: trimmed.slice(0, 300) }).catch((error) => {
        console.error('Support message admin notification failed:', error);
      });
    } catch (error) {
      console.error('Sending support message failed:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-chat">
      <p className="partner-intro">
        Have a question or ran into an issue? Message the Blorbify team here — we typically reply within a few hours.
      </p>
      <div className="support-chat-window">
        {loadingMessages ? (
          <div className="empty-state">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <strong>No messages yet.</strong>
            <br />
            Send a message below to reach the Blorbify support team.
          </div>
        ) : (
          <div className="support-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`support-bubble-row ${message.senderType === 'seller' ? 'from-seller' : 'from-support'}`}
              >
                <div className={`support-bubble ${message.senderType}`}>
                  <span className="support-bubble-sender">
                    {message.senderType === 'seller' ? 'You' : message.senderType === 'bot' ? 'Blorbify Bot' : 'Blorbify Support'}
                  </span>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <form className="support-chat-form" onSubmit={handleSend}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type your message…"
          rows={2}
          maxLength={1000}
        />
        <button type="submit" className="product-submit" disabled={sending || !text.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
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
  const [analyticsOrders, setAnalyticsOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.uid));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [tourOpen, setTourOpen] = useState(false);
  const [logisticsCompanies, setLogisticsCompanies] = useState([]);

  // Installing the dashboard from the home screen should open straight into
  // it, not the generic Blorbify landing page.
  useEffect(() => {
    applyDashboardManifest();
    return () => resetAppManifest();
  }, []);

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
    const analyticsOrdersQuery = query(collection(db, 'orders'), where('storeId', '==', user.uid), limit(500));

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

    const unsubscribeAnalyticsOrders = onSnapshot(
      analyticsOrdersQuery,
      (snapshot) => {
        setAnalyticsOrders(snapshot.docs.map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() })));
      },
      (error) => {
        console.error('Dashboard analytics orders load failed:', error);
        setAnalyticsOrders([]);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeStore();
      unsubscribeOrders();
      unsubscribeAnalyticsOrders();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    // No orderBy here — combining it with a where clause would need a composite
    // Firestore index, so the (small) list is just sorted client-side instead.
    const unsubscribe = onSnapshot(
      collection(db, 'logisticsCompanies'),
      (snapshot) => {
        const companies = snapshot.docs
          .map((companyDoc) => ({ id: companyDoc.id, ...companyDoc.data() }))
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        setLogisticsCompanies(companies);
      },
      (error) => {
        console.error('Logistics companies load failed:', error);
        setLogisticsCompanies([]);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || loading) {
      return undefined;
    }
    const tourSeenKey = `blorbify_tour_seen_${user.uid}`;
    if (localStorage.getItem(tourSeenKey)) {
      return undefined;
    }
    const timer = setTimeout(() => setTourOpen(true), 700);
    return () => clearTimeout(timer);
  }, [user?.uid, loading]);

  const closeTour = () => {
    setTourOpen(false);
    setSidebarOpen(false);
    if (user?.uid) {
      localStorage.setItem(`blorbify_tour_seen_${user.uid}`, '1');
    }
  };

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
    { id: 'analytics', label: 'Analytics', icon: IconChart },
    { id: 'products', label: 'Products', icon: IconStore },
    { id: 'coupons', label: 'Coupons', icon: IconCoupon },
    { id: 'reviews', label: 'Reviews', icon: IconStar },
    { id: 'business', label: 'Business Info', icon: IconStore },
    { id: 'orders', label: 'Orders', icon: IconOrders },
    { id: 'invoices', label: 'Invoices', icon: IconOrders },
    { id: 'appearance', label: 'Appearance', icon: IconPalette },
    { id: 'logistics', label: 'Logistics', icon: IconTruck },
    { id: 'services', label: 'Services', icon: IconServices },
    { id: 'referrals', label: 'Referrals', icon: IconShare },
    { id: 'pos', label: 'Sell in Person', icon: IconQr },
    { id: 'payouts', label: 'Payouts', icon: IconWallet },
    { id: 'billing', label: 'Billing', icon: IconWallet },
    { id: 'reports', label: 'Reports', icon: IconChart },
    { id: 'support', label: 'Support', icon: IconSupport },
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

  const hasActivePlan = profile?.subscription?.status === 'active';

  if (!hasActivePlan) {
    return (
      <div className="dashboard-gate">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap');
          .dashboard-gate {
            min-height: 100vh;
            background: #f6f8f1;
            color: #192328;
            font-family: Raleway, system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 48px 20px 64px;
          }
          .dashboard-gate-topbar {
            width: 100%;
            max-width: 720px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
          }
          .dashboard-gate-brand {
            font-weight: 900;
            font-size: 18px;
          }
          .dashboard-gate-logout {
            border: 1px solid rgba(25,35,40,0.15);
            background: transparent;
            color: #192328;
            border-radius: 999px;
            padding: 8px 16px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }
          .dashboard-gate-card {
            width: 100%;
            max-width: 720px;
            display: grid;
            gap: 10px;
          }
          .dashboard-gate-card h1 {
            margin: 0;
            font-size: 26px;
          }
          .dashboard-gate-card p {
            margin: 0 0 14px;
            color: #728084;
            line-height: 1.55;
          }
        `}</style>
        <div className="dashboard-gate-topbar">
          <span className="dashboard-gate-brand">Blorbify</span>
          <button type="button" className="dashboard-gate-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-gate-card">
          <h1>Choose a plan to launch your store</h1>
          <p>
            Your store details are saved, but you need an active plan before you can list products, take orders, or
            use the rest of the dashboard.
          </p>
          <BillingPanel user={user} userProfile={profile} />
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
          min-height: 0;
          align-content: start;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.2) transparent;
        }
        .dashboard-nav::-webkit-scrollbar { width: 6px; }
        .dashboard-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,.2);
          border-radius: 999px;
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
        .partner-intro {
          color: var(--slate);
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 16px;
          max-width: 640px;
        }
        .partner-group + .partner-group { margin-top: 24px; }
        .partner-group-title {
          color: var(--ink);
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin: 0 0 10px;
        }
        .partner-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }
        .partner-card {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 16px;
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .partner-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .partner-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: rgba(175,255,0,.22);
          color: #4e7300;
        }
        .partner-status {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
          padding: 4px 9px;
          border-radius: 999px;
        }
        .partner-status.available { background: rgba(175,255,0,.22); color: #4e7300; }
        .partner-status.coming-soon { background: var(--paper-dim); color: var(--slate); }
        .partner-card strong { color: var(--ink); font-size: 15px; }
        .partner-meta { color: var(--slate); font-size: 12px; font-weight: 700; }
        .partner-card p { color: var(--ink-soft); font-size: 13px; line-height: 1.5; margin: 4px 0 0; }
        .pos-layout {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .pos-qr-card {
          padding: 16px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #fff;
          flex: 0 0 auto;
        }
        .pos-qr-card img { display: block; border-radius: 4px; }
        .pos-links {
          display: grid;
          gap: 14px;
          min-width: 260px;
          flex: 1;
        }
        .pos-link-row { display: flex; gap: 8px; }
        .pos-link-row input {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          font: inherit;
          font-size: 13px;
          color: var(--ink);
          background: var(--paper);
        }
        .pos-download { width: fit-content; text-decoration: none; }
        .support-chat { display: flex; flex-direction: column; gap: 14px; }
        .support-chat-window {
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--paper);
          min-height: 320px;
          max-height: 480px;
          overflow-y: auto;
          padding: 16px;
        }
        .support-chat-messages { display: flex; flex-direction: column; gap: 10px; }
        .support-bubble-row { display: flex; }
        .support-bubble-row.from-seller { justify-content: flex-end; }
        .support-bubble-row.from-support { justify-content: flex-start; }
        .support-bubble {
          max-width: 70%;
          padding: 10px 13px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid var(--line);
        }
        .support-bubble.seller { background: var(--signal); border-color: var(--signal); }
        .support-bubble.bot { background: var(--paper-dim, #eff3e8); }
        .support-bubble-sender {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .04em;
          color: var(--slate);
          margin-bottom: 3px;
        }
        .support-bubble.seller .support-bubble-sender { color: var(--ink); opacity: .65; }
        .support-bubble p { margin: 0; font-size: 14px; line-height: 1.5; color: var(--ink); white-space: pre-wrap; overflow-wrap: anywhere; }
        .support-chat-form { display: flex; gap: 10px; align-items: flex-end; }
        .support-chat-form textarea {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          font: inherit;
          font-size: 14px;
          color: var(--ink);
          background: #fff;
          resize: vertical;
          min-height: 44px;
        }
        @media (max-width: 640px) {
          .support-bubble { max-width: 85%; }
          .support-chat-form { flex-direction: column; align-items: stretch; }
        }
        .referrals-orders { margin-top: 24px; }
        .coupon-active-toggle { flex-direction: row; align-items: center; gap: 8px; }
        .coupon-active-toggle input[type="checkbox"] { width: auto; }
        .coupon-list { display: grid; gap: 10px; }
        .coupon-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: 10px;
        }
        .coupon-row strong { display: block; color: var(--ink); font-size: 15px; }
        .coupon-row > div:first-child span { color: var(--slate); font-size: 13px; font-weight: 700; }
        .coupon-row-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--slate); font-weight: 700; }
        .star-rating { display: inline-flex; gap: 1px; align-items: center; color: #d99a00; }
        .star-rating-star { border: 0; background: none; padding: 0; display: inline-flex; color: inherit; }
        .star-rating-star:not(.filled) { opacity: .35; }
        .reviews-list { display: grid; gap: 10px; }
        .review-row { border: 1px solid var(--line); border-radius: 10px; padding: 14px; }
        .review-row-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
        .review-row-head strong { color: var(--ink); font-size: 14px; }
        .review-row-author { color: var(--slate); font-size: 12px; font-weight: 700; }
        .review-row p { margin: 0 0 10px; color: var(--ink-soft); font-size: 13px; line-height: 1.5; }
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
        .template-swatch.preview-bloom {
          justify-items: center;
          text-align: center;
          background: color-mix(in srgb, var(--preview-accent) 14%, var(--preview-surface));
        }
        .template-swatch.preview-bloom i {
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }
        .template-swatch.preview-bloom b,
        .template-swatch.preview-bloom em {
          justify-self: center;
        }
        .template-swatch.preview-kitchen {
          grid-template-rows: auto auto auto;
          align-content: center;
          gap: 5px;
        }
        .template-swatch.preview-kitchen i {
          width: 100%;
          height: 10px;
          border-radius: 3px;
        }
        .template-swatch.preview-kitchen b { height: 8px; border-radius: 3px; }
        .template-swatch.preview-kitchen em { height: 6px; border-radius: 3px; background: var(--preview-accent); }
        .template-swatch.preview-atelier {
          background: color-mix(in srgb, var(--preview-accent) 10%, var(--preview-surface));
        }
        .template-swatch.preview-atelier i {
          transform: rotate(-4deg);
          border-radius: 2px;
          box-shadow: 0 6px 10px -6px rgba(0,0,0,.3);
        }
        .template-swatch.preview-atelier b,
        .template-swatch.preview-atelier em {
          border-radius: 2px;
        }
        .template-swatch.preview-boutique {
          justify-items: center;
          text-align: center;
          background: color-mix(in srgb, var(--preview-accent) 8%, var(--preview-surface));
        }
        .template-swatch.preview-boutique i {
          width: 34px;
          height: 44px;
          border-radius: 0;
          background: color-mix(in srgb, var(--preview-accent) 35%, var(--preview-surface));
        }
        .template-swatch.preview-boutique b,
        .template-swatch.preview-boutique em {
          justify-self: center;
          border-radius: 0;
        }
        .template-swatch.preview-runway {
          border: 2px solid var(--preview-ink);
          box-sizing: border-box;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .template-swatch.preview-runway i {
          grid-row: 1 / 4;
          width: auto;
          height: auto;
          border-radius: 0;
          background: var(--preview-ink);
        }
        .template-swatch.preview-runway b {
          border-radius: 0;
        }
        .template-swatch.preview-runway em {
          border-radius: 0;
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
        .order-logistics-share {
          display: grid;
          gap: 8px;
          border-top: 1px dashed var(--line);
          padding-top: 10px;
        }
        .order-logistics-share h4 { margin: 0; font-size: 13.5px; color: var(--ink); }
        .order-logistics-list { display: grid; gap: 6px; }
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
          padding: 0 4px 0;
        }
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
        .order-timeline-complete { margin: 0; font-size: 13px; font-weight: 800; color: var(--ink); }
        .order-primary-action {
          justify-self: start;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 999px;
          background: var(--ink);
          color: #fff;
          padding: 11px 18px;
          font: inherit;
          font-size: 13.5px;
          font-weight: 900;
          cursor: pointer;
        }
        .order-primary-action:hover { opacity: .92; }
        .order-primary-action:disabled { opacity: .7; cursor: not-allowed; }
        .btn-spinner {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          animation: orderBtnSpin .7s linear infinite;
        }
        @keyframes orderBtnSpin { to { transform: rotate(360deg); } }
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
        .slug-field-row {
          display: flex;
          align-items: stretch;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }
        .slug-field-row:focus-within {
          border-color: #9bdc00;
          box-shadow: 0 0 0 4px rgba(175,255,0,.15);
        }
        .field-group .slug-prefix {
          display: flex;
          align-items: center;
          padding: 0 0 0 13px;
          color: var(--slate);
          font-size: 13px;
          font-weight: 600;
          text-transform: none;
          letter-spacing: normal;
          white-space: nowrap;
        }
        .slug-field-row input {
          border: 0;
          padding-left: 2px;
        }
        .slug-field-row input:focus {
          box-shadow: none;
        }
        .field-group .field-hint {
          color: var(--slate);
          font-size: 12px;
          font-weight: 500;
          text-transform: none;
          letter-spacing: normal;
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
        <div className="dashboard-brand" data-tour="brand">
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
              data-tour={`nav-${tab.id}`}
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

        <div className="dashboard-user" data-tour="account">
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
          <a className="store-link" data-tour="store-link" href={storeUrl} target="_blank" rel="noreferrer">
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

            <section className="stats-grid" data-tour="stats-grid" aria-label="Store stats">
              <StatCard label="Revenue" value={formatCurrency(stats.revenue)} icon={IconDashboard} tone="lime" />
              <StatCard label="Orders" value={stats.totalOrders} icon={IconOrders} tone="blue" />
              <StatCard label="Customers" value={stats.totalCustomers} icon={IconUsers} tone="orange" />
              <StatCard label="Products" value={stats.totalProducts} icon={IconStore} tone="green" />
            </section>
          </>
        )}

        <section className="content-grid">
          {activeTab === 'analytics' && (
            <AnalyticsPanel orders={analyticsOrders} products={products} formatCurrency={formatCurrency} />
          )}

          {activeTab === 'products' && (
            <div className="content-card full-span" data-tour="products-card">
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

          {activeTab === 'coupons' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Coupons</h3>
              </div>
              <CouponManager
                userId={user.uid}
                coupons={storeInfo.coupons || {}}
                onCouponsSaved={(nextCoupons) => setStore((current) => ({ ...(current || storeInfo), coupons: nextCoupons }))}
              />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Reviews</h3>
              </div>
              <ReviewsManager storeSlug={storeSlug} />
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

          {(activeTab === 'overview' || activeTab === 'business') && (
            <div className="content-card">
              <div className="card-header">
                <h3>Personal Information</h3>
              </div>
              <PersonalInfoEditor userId={user.uid} profile={profile} />
            </div>
          )}

          {(activeTab === 'overview' || activeTab === 'business') && (
            <div className="content-card">
              <div className="card-header">
                <h3>Account Email</h3>
              </div>
              <AccountEmailEditor profile={profile} />
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

          {activeTab === 'logistics' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Logistics Partnerships</h3>
              </div>
              <p className="partner-intro">
                Connect your store with a delivery partner so orders get picked up and delivered without you chasing riders.
                Availability depends on where your store ships from. Once a partner is available, open any order and
                share it with them directly over WhatsApp.
              </p>
              {logisticsCompanies.length === 0 ? (
                <p className="partner-intro">No logistics partners have been added yet — check back soon.</p>
              ) : (
                <div className="partner-grid">
                  {logisticsCompanies.map((company) => (
                    <div className="partner-card" key={company.id}>
                      <div className="partner-card-head">
                        <div className="partner-icon">
                          <IconTruck size={20} />
                        </div>
                        <span className={`partner-status ${company.active ? 'available' : 'coming-soon'}`}>
                          {company.active ? 'Available' : 'Coming soon'}
                        </span>
                      </div>
                      <strong>{company.name}</strong>
                      <span className="partner-meta">{company.coverage}</span>
                      <p>{company.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Additional Services</h3>
              </div>
              <p className="partner-intro">
                Grow beyond your storefront with add-on services — from getting registered to getting found.
                More services are added regularly.
              </p>
              {businessServiceGroups.map((group) => (
                <div className="partner-group" key={group.category}>
                  <h4 className="partner-group-title">{group.category}</h4>
                  <div className="partner-grid">
                    {group.services.map((service) => (
                      <div className="partner-card" key={service.name}>
                        <div className="partner-card-head">
                          <div className="partner-icon">
                            <IconServices size={20} />
                          </div>
                          <span className={`partner-status ${service.status}`}>
                            {service.status === 'available' ? 'Available' : 'Coming soon'}
                          </span>
                        </div>
                        <strong>{service.name}</strong>
                        <span className="partner-meta">{service.meta}</span>
                        <p>{service.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Referrals</h3>
              </div>
              <ReferralsPanel userId={user.uid} storeInfo={storeInfo} storeUrl={storeUrl} orders={orders} />
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Sell in Person</h3>
              </div>
              <PosPanel storeUrl={storeUrl} />
            </div>
          )}

          {activeTab === 'orders' && orderId && (
            <div className="content-card full-span">
              <OrderDetailPage
                key={orderId}
                orderId={orderId}
                logisticsCompanies={logisticsCompanies.filter((company) => company.active && company.whatsapp)}
              />
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

          {activeTab === 'invoices' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Invoices</h3>
              </div>
              <InvoicesPanel user={user} />
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
              <BillingPanel user={user} userProfile={profile} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Reports</h3>
              </div>
              <ReportsPanel user={user} />
            </div>
          )}

          {activeTab === 'support' && (
            <div className="content-card full-span">
              <div className="card-header">
                <h3>Support</h3>
              </div>
              <SupportChatPanel userId={user.uid} storeInfo={storeInfo} profile={profile} />
            </div>
          )}
        </section>
      </main>

      <button
        type="button"
        className="tour-trigger"
        data-tour="tour-trigger"
        onClick={() => setTourOpen(true)}
        aria-label="Take the dashboard tour"
      >
        ?
      </button>

      {tourOpen && <DashboardTour navigate={navigate} setSidebarOpen={setSidebarOpen} onFinish={closeTour} />}

      <style>{`
        .tour-trigger {
          position: fixed;
          right: 22px;
          bottom: 22px;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: none;
          background: var(--ink);
          color: var(--signal);
          font-family: Raleway, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(15,21,24,.3);
          z-index: 40;
        }
        .tour-trigger:hover { background: var(--ink-deep); }
      `}</style>
    </div>
  );
}
