export type SellerStatus = 'active' | 'trial' | 'past_due' | 'suspended'
export type PlanTier = 'starter' | 'growth' | 'pro'

export type Seller = {
  id: string
  storeName: string
  ownerName: string
  email: string
  plan: PlanTier
  status: SellerStatus
  mrr: number
  orders: number
  joined: string
  storeUrl: string
  avatarSeed: string
}

export const sellers: Seller[] = [
  { id: 'sl_1001', storeName: 'Noir & Co', ownerName: 'Amaka Obi', email: 'amaka@noirco.shop', plan: 'pro', status: 'active', mrr: 45000, orders: 812, joined: '2025-11-03', storeUrl: 'noirco.blorbify.com', avatarSeed: 'Amaka' },
  { id: 'sl_1002', storeName: 'Signature Scents', ownerName: 'Tunde Bakare', email: 'tunde@sigscents.com', plan: 'growth', status: 'active', mrr: 22000, orders: 431, joined: '2025-12-14', storeUrl: 'sigscents.blorbify.com', avatarSeed: 'Tunde' },
  { id: 'sl_1003', storeName: 'Kaleido Kids', ownerName: 'Ronke Adeyemi', email: 'ronke@kaleidokids.ng', plan: 'starter', status: 'trial', mrr: 0, orders: 12, joined: '2026-06-28', storeUrl: 'kaleidokids.blorbify.com', avatarSeed: 'Ronke' },
  { id: 'sl_1004', storeName: 'Urban Sole', ownerName: 'Chidi Eze', email: 'chidi@urbansole.co', plan: 'pro', status: 'past_due', mrr: 45000, orders: 1204, joined: '2025-08-19', storeUrl: 'urbansole.blorbify.com', avatarSeed: 'Chidi' },
  { id: 'sl_1005', storeName: 'The Bead House', ownerName: 'Ifeoma Nwosu', email: 'ifeoma@beadhouse.com', plan: 'growth', status: 'active', mrr: 22000, orders: 298, joined: '2026-01-22', storeUrl: 'beadhouse.blorbify.com', avatarSeed: 'Ifeoma' },
  { id: 'sl_1006', storeName: 'Fit Culture', ownerName: 'Segun Alade', email: 'segun@fitculture.ng', plan: 'starter', status: 'active', mrr: 8000, orders: 156, joined: '2026-03-11', storeUrl: 'fitculture.blorbify.com', avatarSeed: 'Segun' },
  { id: 'sl_1007', storeName: 'Bloom Botanicals', ownerName: 'Hauwa Sani', email: 'hauwa@bloombot.co', plan: 'growth', status: 'suspended', mrr: 0, orders: 87, joined: '2025-09-30', storeUrl: 'bloombot.blorbify.com', avatarSeed: 'Hauwa' },
  { id: 'sl_1008', storeName: 'Lagos Leather Co', ownerName: 'Emeka Okafor', email: 'emeka@lagosleather.com', plan: 'pro', status: 'active', mrr: 45000, orders: 967, joined: '2025-07-05', storeUrl: 'lagosleather.blorbify.com', avatarSeed: 'Emeka' },
  { id: 'sl_1009', storeName: 'Little Wonders', ownerName: 'Zainab Bello', email: 'zainab@littlewonders.ng', plan: 'starter', status: 'trial', mrr: 0, orders: 4, joined: '2026-06-30', storeUrl: 'littlewonders.blorbify.com', avatarSeed: 'Zainab' },
  { id: 'sl_1010', storeName: 'Craftline Studio', ownerName: 'Bassey Etim', email: 'bassey@craftline.co', plan: 'growth', status: 'active', mrr: 22000, orders: 512, joined: '2025-10-08', storeUrl: 'craftline.blorbify.com', avatarSeed: 'Bassey' },
]

export const planPricing: Record<PlanTier, number> = {
  starter: 8000,
  growth: 22000,
  pro: 45000,
}

export const revenueByMonth = [
  { month: 'Jan', mrr: 612000, signups: 18 },
  { month: 'Feb', mrr: 698000, signups: 22 },
  { month: 'Mar', mrr: 745000, signups: 19 },
  { month: 'Apr', mrr: 812000, signups: 27 },
  { month: 'May', mrr: 890000, signups: 31 },
  { month: 'Jun', mrr: 964000, signups: 26 },
  { month: 'Jul', mrr: 1021000, signups: 15 },
]

export const planDistribution = [
  { plan: 'Starter', value: sellers.filter((s) => s.plan === 'starter').length, fill: 'var(--color-starter)' },
  { plan: 'Growth', value: sellers.filter((s) => s.plan === 'growth').length, fill: 'var(--color-growth)' },
  { plan: 'Pro', value: sellers.filter((s) => s.plan === 'pro').length, fill: 'var(--color-pro)' },
]

export type OrderStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export type PlatformOrder = {
  id: string
  storeName: string
  customer: string
  amount: number
  status: OrderStatus
  date: string
}

export const platformOrders: PlatformOrder[] = [
  { id: 'ord_9001', storeName: 'Noir & Co', customer: 'Fatima Yusuf', amount: 34500, status: 'paid', date: '2026-07-04T14:22:00' },
  { id: 'ord_9002', storeName: 'Urban Sole', customer: 'David Okon', amount: 21000, status: 'paid', date: '2026-07-04T11:05:00' },
  { id: 'ord_9003', storeName: 'Lagos Leather Co', customer: 'Grace Effiong', amount: 68000, status: 'pending', date: '2026-07-04T09:40:00' },
  { id: 'ord_9004', storeName: 'Signature Scents', customer: 'Ibrahim Musa', amount: 15200, status: 'paid', date: '2026-07-03T19:12:00' },
  { id: 'ord_9005', storeName: 'The Bead House', customer: 'Ngozi Chukwu', amount: 9800, status: 'failed', date: '2026-07-03T16:50:00' },
  { id: 'ord_9006', storeName: 'Craftline Studio', customer: 'Peter Adisa', amount: 44500, status: 'paid', date: '2026-07-03T10:30:00' },
  { id: 'ord_9007', storeName: 'Urban Sole', customer: 'Blessing Ade', amount: 27600, status: 'refunded', date: '2026-07-02T20:05:00' },
  { id: 'ord_9008', storeName: 'Fit Culture', customer: 'Samuel Danjuma', amount: 12000, status: 'paid', date: '2026-07-02T13:47:00' },
]

export type NotificationItem = {
  id: string
  title: string
  description: string
  type: 'billing' | 'seller' | 'system' | 'order'
  read: boolean
  date: string
}

export const notifications: NotificationItem[] = [
  { id: 'nt_1', title: 'Payment failed', description: 'Urban Sole subscription payment failed — retry scheduled for tomorrow.', type: 'billing', read: false, date: '2026-07-05T08:12:00' },
  { id: 'nt_2', title: 'New seller signup', description: 'Zainab Bello started a trial for Little Wonders.', type: 'seller', read: false, date: '2026-07-04T21:00:00' },
  { id: 'nt_3', title: 'Store suspended', description: 'Bloom Botanicals was auto-suspended after 3 failed payments.', type: 'billing', read: true, date: '2026-07-03T15:22:00' },
  { id: 'nt_4', title: 'Large order placed', description: 'Lagos Leather Co received an order worth ₦68,000.', type: 'order', read: true, date: '2026-07-03T09:41:00' },
  { id: 'nt_5', title: 'Backend deploy complete', description: 'Notification service redeployed successfully on Vercel.', type: 'system', read: true, date: '2026-07-01T12:00:00' },
]

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const overviewStats = {
  totalSellers: sellers.length,
  activeSellers: sellers.filter((s) => s.status === 'active').length,
  mrr: sellers.reduce((sum, s) => sum + s.mrr, 0),
  totalOrders: sellers.reduce((sum, s) => sum + s.orders, 0),
  churnRate: 3.2,
  trialSellers: sellers.filter((s) => s.status === 'trial').length,
}
