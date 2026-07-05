import { adminDb, fieldValue } from '../config/firebaseAdmin.js';
import { env } from '../config/env.js';
import { sendEmail } from './notification.service.js';
import { escapeHtml, getDashboardUrl, renderEmailLayout } from '../utils/emailTemplate.js';
import { toCsv } from '../utils/csv.js';
import { computeSellerLedgerTotals, reconcileAllSellerBalances } from './sellerOrder.service.js';

const MONTHLY_REPORT_RUNS_COLLECTION = 'monthlyReportRuns';
const LAGOS_OFFSET_MS = 60 * 60 * 1000; // Africa/Lagos is a fixed UTC+1, no DST.

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNaira(kobo) {
  return `₦${(toNumber(kobo) / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

// "monthKey" is a 'YYYY-MM' string in Africa/Lagos wall-clock time. Since WAT has
// no DST, a fixed +1h offset is enough — no date library needed.
export function getLagosMonthKey(date = new Date()) {
  const lagos = new Date(date.getTime() + LAGOS_OFFSET_MS);
  return `${lagos.getUTCFullYear()}-${String(lagos.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousLagosMonthKey(date = new Date()) {
  const lagos = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const previousMonth = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() - 1, 1));
  return `${previousMonth.getUTCFullYear()}-${String(previousMonth.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getLagosMonthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  // Lagos midnight on the 1st of the month is 23:00 UTC the day before.
  const startAt = new Date(Date.UTC(year, month - 1, 1) - LAGOS_OFFSET_MS);
  const endAt = new Date(Date.UTC(year, month, 1) - LAGOS_OFFSET_MS);
  return { startAt, endAt };
}

export async function computeSellerMonthlySummary(sellerId, monthKey) {
  const { startAt, endAt } = getLagosMonthRange(monthKey);
  const [totals, storeSnap] = await Promise.all([
    computeSellerLedgerTotals(sellerId, { startAt, endAt }),
    adminDb.collection('stores').doc(sellerId).get(),
  ]);

  const store = storeSnap.exists ? storeSnap.data() : {};
  return {
    sellerId,
    storeName: store.businessName || 'Your store',
    monthKey,
    ...totals,
  };
}

// Platform-wide totals for the month. Both queries below are single-field range
// filters on `createdAt` (no equality clause combined with it), so neither needs a
// composite Firestore index — grouping by seller/type happens in memory instead,
// following the same tradeoff already made in cartSweep.service.js.
export async function computePlatformMonthlySummary(monthKey) {
  const { startAt, endAt } = getLagosMonthRange(monthKey);

  const [ledgerSnap, billingSnap, newStoresSnap, activeSubsSnap, reconciliation] = await Promise.all([
    adminDb.collection('sellerLedgers').where('createdAt', '>=', startAt).where('createdAt', '<', endAt).get(),
    adminDb.collection('billingTransactions').where('createdAt', '>=', startAt).where('createdAt', '<', endAt).get(),
    adminDb.collection('stores').where('createdAt', '>=', startAt).where('createdAt', '<', endAt).get(),
    adminDb.collection('billingSubscriptions').where('status', '==', 'active').get(),
    reconcileAllSellerBalances(),
  ]);

  const sellerTotals = new Map();
  let gmv = 0;
  let totalRefunds = 0;
  let saleCount = 0;

  for (const doc of ledgerSnap.docs) {
    const entry = doc.data();
    const netAmount = toNumber(entry.sellerNetAmount, 0);
    if (entry.type === 'sale') {
      gmv += netAmount;
      saleCount += 1;
      sellerTotals.set(entry.sellerId, (sellerTotals.get(entry.sellerId) || 0) + netAmount);
    } else if (entry.type === 'refund') {
      totalRefunds += Math.abs(netAmount);
      sellerTotals.set(entry.sellerId, (sellerTotals.get(entry.sellerId) || 0) + netAmount);
    }
  }

  let subscriptionRevenueNaira = 0;
  for (const doc of billingSnap.docs) {
    const transaction = doc.data();
    if (String(transaction.paymentStatus || transaction.status || '').toLowerCase() === 'paid') {
      subscriptionRevenueNaira += toNumber(transaction.amountNaira, 0);
    }
  }

  return {
    monthKey,
    gmvKobo: gmv,
    totalRefundsKobo: totalRefunds,
    netGmvKobo: gmv - totalRefunds,
    orderCount: saleCount,
    subscriptionRevenueNaira,
    newStoreCount: newStoresSnap.size,
    activeSubscriptionCount: activeSubsSnap.size,
    salesActiveSellerCount: sellerTotals.size,
    reconciliation,
    perSellerRows: Array.from(sellerTotals.entries()).map(([sellerId, netKobo]) => ({ sellerId, netKobo })),
  };
}

// On-demand equivalent of sendSellerMonthlyReportEmail, for an arbitrary date
// range chosen by the seller from the dashboard rather than a full calendar
// month — computeSellerLedgerTotals already accepts any {startAt, endAt}, the
// "monthly" framing elsewhere in this file is just a caller convention.
export async function sendSellerRangeReportEmail(sellerId, { startAt, endAt, toEmail, rangeLabel }) {
  const [totals, storeSnap] = await Promise.all([
    computeSellerLedgerTotals(sellerId, { startAt, endAt }),
    adminDb.collection('stores').doc(sellerId).get(),
  ]);

  const storeName = storeSnap.exists ? storeSnap.data()?.businessName || 'Your store' : 'Your store';
  const summary = { sellerId, storeName, rangeLabel, ...totals };

  if (!toEmail) {
    return { sent: false, skipped: true, reason: 'no-email', summary };
  }

  const csv = toCsv(
    [
      { metric: 'Gross sales', valueKobo: summary.grossSales },
      { metric: 'Refunds', valueKobo: summary.refundsTotal },
      { metric: 'Net revenue', valueKobo: summary.netRevenue },
      { metric: 'Orders', valueKobo: summary.orderCount },
    ],
    [
      { key: 'metric', header: 'Metric' },
      { key: 'valueKobo', header: 'Value (kobo)' },
    ]
  );

  const subject = `Your financial report (${rangeLabel}) — ${summary.storeName}`;
  const html = renderEmailLayout({
    preheader: `Net revenue for ${rangeLabel}: ${formatNaira(summary.netRevenue)}`,
    heading: `${rangeLabel} report for ${escapeHtml(summary.storeName)}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Here's how ${escapeHtml(summary.storeName)} did for ${escapeHtml(rangeLabel)}:</p>
      <p style="margin:0 0 6px;">Gross sales: <strong>${formatNaira(summary.grossSales)}</strong></p>
      <p style="margin:0 0 6px;">Refunds: <strong>${formatNaira(summary.refundsTotal)}</strong></p>
      <p style="margin:0 0 6px;">Net revenue: <strong>${formatNaira(summary.netRevenue)}</strong></p>
      <p style="margin:0;">Orders: <strong>${summary.orderCount}</strong></p>
    `,
    ctaLabel: 'View your dashboard',
    ctaUrl: getDashboardUrl(),
    footerNote: 'Sent because you requested a financial report on Blorbify. A CSV breakdown is attached.',
  });
  const text = `${rangeLabel} report for ${summary.storeName}\n\nGross sales: ${formatNaira(summary.grossSales)}\nRefunds: ${formatNaira(summary.refundsTotal)}\nNet revenue: ${formatNaira(summary.netRevenue)}\nOrders: ${summary.orderCount}`;

  const sendResult = await sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    attachments: [{ filename: `blorbify-report-${Date.now()}.csv`, content: csv }],
  });

  return { ...sendResult, summary };
}

async function sendSellerMonthlyReportEmail(sellerId, monthKey) {
  const [summary, userSnap] = await Promise.all([
    computeSellerMonthlySummary(sellerId, monthKey),
    adminDb.collection('users').doc(sellerId).get(),
  ]);

  const toEmail = userSnap.exists ? userSnap.data()?.email : '';
  if (!toEmail) {
    return { sent: false, skipped: true, reason: 'no-email' };
  }

  const csv = toCsv(
    [
      { metric: 'Gross sales', valueKobo: summary.grossSales },
      { metric: 'Refunds', valueKobo: summary.refundsTotal },
      { metric: 'Net revenue', valueKobo: summary.netRevenue },
      { metric: 'Orders', valueKobo: summary.orderCount },
    ],
    [
      { key: 'metric', header: 'Metric' },
      { key: 'valueKobo', header: 'Value (kobo)' },
    ]
  );

  const subject = `Your ${monthKey} sales summary — ${summary.storeName}`;
  const html = renderEmailLayout({
    preheader: `Net revenue this month: ${formatNaira(summary.netRevenue)}`,
    heading: `${monthKey} summary for ${escapeHtml(summary.storeName)}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Here's how ${escapeHtml(summary.storeName)} did in ${monthKey}:</p>
      <p style="margin:0 0 6px;">Gross sales: <strong>${formatNaira(summary.grossSales)}</strong></p>
      <p style="margin:0 0 6px;">Refunds: <strong>${formatNaira(summary.refundsTotal)}</strong></p>
      <p style="margin:0 0 6px;">Net revenue: <strong>${formatNaira(summary.netRevenue)}</strong></p>
      <p style="margin:0;">Orders: <strong>${summary.orderCount}</strong></p>
    `,
    ctaLabel: 'View your dashboard',
    ctaUrl: getDashboardUrl(),
    footerNote: `Sent because you have a store on Blorbify. A CSV breakdown is attached.`,
  });
  const text = `${monthKey} summary for ${summary.storeName}\n\nGross sales: ${formatNaira(summary.grossSales)}\nRefunds: ${formatNaira(summary.refundsTotal)}\nNet revenue: ${formatNaira(summary.netRevenue)}\nOrders: ${summary.orderCount}`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    attachments: [{ filename: `blorbify-${monthKey}-summary.csv`, content: csv }],
  });
}

async function sendPlatformMonthlyReportEmail(monthKey) {
  const summary = await computePlatformMonthlySummary(monthKey);

  const csv = toCsv(summary.perSellerRows, [
    { key: 'sellerId', header: 'Seller ID' },
    { key: 'netKobo', header: 'Net revenue (kobo)' },
  ]);

  const subject = `Blorbify platform summary — ${monthKey}`;
  const html = renderEmailLayout({
    preheader: `GMV this month: ${formatNaira(summary.gmvKobo)}`,
    heading: `Platform summary for ${monthKey}`,
    bodyHtml: `
      <p style="margin:0 0 6px;">Gross merchandise value: <strong>${formatNaira(summary.gmvKobo)}</strong></p>
      <p style="margin:0 0 6px;">Refunds: <strong>${formatNaira(summary.totalRefundsKobo)}</strong></p>
      <p style="margin:0 0 6px;">Net GMV: <strong>${formatNaira(summary.netGmvKobo)}</strong></p>
      <p style="margin:0 0 6px;">Orders: <strong>${summary.orderCount}</strong></p>
      <p style="margin:0 0 6px;">Subscription revenue: <strong>₦${summary.subscriptionRevenueNaira.toLocaleString('en-NG')}</strong></p>
      <p style="margin:0 0 6px;">New stores this month: <strong>${summary.newStoreCount}</strong></p>
      <p style="margin:0 0 6px;">Active paying subscriptions: <strong>${summary.activeSubscriptionCount}</strong></p>
      <p style="margin:0 0 6px;">Sellers with a sale this month: <strong>${summary.salesActiveSellerCount}</strong></p>
      <p style="margin:0;">Seller balances flagged in reconciliation: <strong>${summary.reconciliation.flaggedCount}</strong> of ${summary.reconciliation.checkedCount}</p>
    `,
    footerNote: `Per-seller CSV breakdown attached.`,
  });
  const text = `Platform summary for ${monthKey}\n\nGMV: ${formatNaira(summary.gmvKobo)}\nRefunds: ${formatNaira(summary.totalRefundsKobo)}\nNet GMV: ${formatNaira(summary.netGmvKobo)}\nOrders: ${summary.orderCount}\nSubscription revenue: ₦${summary.subscriptionRevenueNaira.toLocaleString('en-NG')}\nNew stores: ${summary.newStoreCount}\nActive subscriptions: ${summary.activeSubscriptionCount}\nSellers with a sale: ${summary.salesActiveSellerCount}\nReconciliation flags: ${summary.reconciliation.flaggedCount}/${summary.reconciliation.checkedCount}`;

  return sendEmail({
    to: env.platformReportEmail,
    subject,
    html,
    text,
    attachments: [{ filename: `blorbify-${monthKey}-platform.csv`, content: csv }],
  });
}

// Idempotency-guarded: claims monthlyReportRuns/{monthKey} inside a transaction so
// the daily in-process timer and the on-demand internal route can both fire
// without double-sending. A 'failed' run does not auto-retry on the next tick
// (avoids retry-storming emails on a persistent bug) — re-run via the internal
// route with { force: true } once the underlying issue is fixed.
export async function runMonthlyReportJob({ monthKey, force = false } = {}) {
  const resolvedMonthKey = monthKey || getPreviousLagosMonthKey();
  const runRef = adminDb.collection(MONTHLY_REPORT_RUNS_COLLECTION).doc(resolvedMonthKey);

  const claimed = await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(runRef);
    if (snap.exists && !force && ['running', 'completed'].includes(snap.data().status)) {
      return false;
    }
    transaction.set(
      runRef,
      { monthKey: resolvedMonthKey, status: 'running', startedAt: fieldValue.serverTimestamp(), force: Boolean(force) },
      { merge: true }
    );
    return true;
  });

  if (!claimed) {
    return { skipped: true, monthKey: resolvedMonthKey };
  }

  const failedSellerIds = [];
  try {
    const storesSnap = await adminDb.collection('stores').where('onboardingCompleted', '==', true).get();

    for (const storeDoc of storesSnap.docs) {
      try {
        await sendSellerMonthlyReportEmail(storeDoc.id, resolvedMonthKey);
      } catch (error) {
        failedSellerIds.push(storeDoc.id);
        console.error(`Monthly report email failed for seller ${storeDoc.id}:`, error.message);
      }
    }

    await sendPlatformMonthlyReportEmail(resolvedMonthKey);

    await runRef.set(
      {
        status: 'completed',
        completedAt: fieldValue.serverTimestamp(),
        sellerCount: storesSnap.size,
        failedSellerIds,
      },
      { merge: true }
    );

    return { skipped: false, monthKey: resolvedMonthKey, sellerCount: storesSnap.size, failedSellerIds };
  } catch (error) {
    await runRef.set(
      { status: 'failed', error: error.message, updatedAt: fieldValue.serverTimestamp() },
      { merge: true }
    );
    throw error;
  }
}

// Called by the daily in-process timer (server.js). Always targets the previous
// completed month, so this is a no-op every day except the first tick after a
// month rolls over — and it self-heals if the process was down on day 1, since
// the idempotency doc only cares whether that month's report was ever sent.
export async function maybeSendMonthlyReports(now = new Date()) {
  return runMonthlyReportJob({ monthKey: getPreviousLagosMonthKey(now) });
}
