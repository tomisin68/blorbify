import { adminDb } from '../config/firebaseAdmin.js';
import { getSubscriptionPlan, subscriptionPlans } from './planCatalog.js';
import { getLagosMonthKey, getLagosMonthRange } from './monthlyReport.service.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIso(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// No 'suspended' state exists yet (no manual-suspend feature) — 'past_due' is
// derived from a subscription whose endsAt has already lapsed, since nothing
// currently flips status away from 'active' when a renewal is missed.
function resolveSellerStatus(subscription) {
  if (!subscription) return 'trial';
  if (String(subscription.status || '').toLowerCase() !== 'active') return 'trial';

  const endsAt = subscription.endsAt ? new Date(subscription.endsAt) : null;
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() < Date.now()) {
    return 'past_due';
  }
  return 'active';
}

export async function listSellersOverview() {
  const [storesSnap, usersSnap, subsSnap, ordersSnap] = await Promise.all([
    adminDb.collection('stores').get(),
    adminDb.collection('users').get(),
    adminDb.collection('billingSubscriptions').get(),
    adminDb.collection('orders').get(),
  ]);

  const usersById = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));
  const subsById = new Map(subsSnap.docs.map((doc) => [doc.id, doc.data()]));

  const orderCountBySeller = new Map();
  for (const doc of ordersSnap.docs) {
    const order = doc.data();
    if (!order.storeId) continue;
    orderCountBySeller.set(order.storeId, (orderCountBySeller.get(order.storeId) || 0) + 1);
  }

  return storesSnap.docs.map((doc) => {
    const id = doc.id;
    const store = doc.data();
    const user = usersById.get(id) || {};
    const subscription = subsById.get(id) || null;
    const plan = subscription ? getSubscriptionPlan(subscription.planId) : null;
    const status = resolveSellerStatus(subscription);

    return {
      id,
      storeName: store.businessName || 'Untitled store',
      storeSlug: store.storeSlug || '',
      ownerName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown',
      email: user.email || subscription?.email || '',
      plan: plan?.id || null,
      planName: plan?.name || 'No plan',
      status,
      mrrNaira: status === 'active' ? toNumber(subscription?.amountNaira) : 0,
      orders: orderCountBySeller.get(id) || 0,
      joined: toIso(store.createdAt) || toIso(user.createdAt),
    };
  });
}

// A lighter-weight subset of computePlatformMonthlySummary (monthlyReport.service.js) —
// that function also reconciles every seller's ledger balance, which is unrelated to
// what the overview chart needs and too expensive to redo six times per page load.
async function getMonthlySignupsAndRevenue(monthKey) {
  const { startAt, endAt } = getLagosMonthRange(monthKey);
  const [billingSnap, newStoresSnap] = await Promise.all([
    adminDb.collection('billingTransactions').where('createdAt', '>=', startAt).where('createdAt', '<', endAt).get(),
    adminDb.collection('stores').where('createdAt', '>=', startAt).where('createdAt', '<', endAt).get(),
  ]);

  let subscriptionRevenueNaira = 0;
  for (const doc of billingSnap.docs) {
    const transaction = doc.data();
    if (String(transaction.paymentStatus || transaction.status || '').toLowerCase() === 'paid') {
      subscriptionRevenueNaira += toNumber(transaction.amountNaira, 0);
    }
  }

  return { subscriptionRevenueNaira, newStoreCount: newStoresSnap.size };
}

export async function getAdminOverview() {
  const sellers = await listSellersOverview();

  const totalSellers = sellers.length;
  const activeSellers = sellers.filter((seller) => seller.status === 'active').length;
  const trialSellers = sellers.filter((seller) => seller.status === 'trial').length;
  const mrrNaira = sellers.reduce((sum, seller) => sum + seller.mrrNaira, 0);
  const totalOrders = sellers.reduce((sum, seller) => sum + seller.orders, 0);

  const planDistribution = subscriptionPlans.map((plan) => ({
    plan: plan.name,
    value: sellers.filter((seller) => seller.plan === plan.id).length,
  }));

  const now = new Date();
  const monthKeys = Array.from({ length: 6 }, (_, index) =>
    getLagosMonthKey(new Date(now.getFullYear(), now.getMonth() - (5 - index), 1))
  );

  const revenueByMonth = await Promise.all(
    monthKeys.map(async (monthKey) => {
      const [year, month] = monthKey.split('-').map(Number);
      const { subscriptionRevenueNaira, newStoreCount } = await getMonthlySignupsAndRevenue(monthKey);
      return {
        month: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' }),
        mrr: subscriptionRevenueNaira,
        signups: newStoreCount,
      };
    })
  );

  return {
    totalSellers,
    activeSellers,
    trialSellers,
    mrrNaira,
    totalOrders,
    planDistribution,
    revenueByMonth,
  };
}

export async function listPlatformOrders(limitCount = 100) {
  const snapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').limit(limitCount).get();

  return snapshot.docs.map((doc) => {
    const order = doc.data();
    return {
      id: doc.id,
      storeName: order.storeName || '',
      customer: order.customerName || '',
      amount: toNumber(order.total ?? order.amount),
      status: order.status || 'pending',
      date: toIso(order.createdAt),
    };
  });
}

export async function listPlatformNotifications(limitCount = 50) {
  const snapshot = await adminDb.collection('notifications').orderBy('createdAt', 'desc').limit(limitCount).get();

  return snapshot.docs.map((doc) => {
    const notification = doc.data();
    return {
      id: doc.id,
      title: notification.subject || notification.type || 'Notification',
      description: notification.message || '',
      type: notification.type || 'system',
      status: notification.status || 'queued',
      date: toIso(notification.createdAt),
    };
  });
}
