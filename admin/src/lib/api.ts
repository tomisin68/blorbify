import { auth } from '@/lib/firebase'

function getBackendBaseUrl() {
  const configured = import.meta.env.VITE_BACKEND_API_BASE_URL as string | undefined
  return (configured || '/api').replace(/\/+$/g, '')
}

async function parseResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text()
  let data: { success?: boolean; data?: T; message?: string } = {}
  let parseFailed = false

  if (rawText) {
    try {
      data = JSON.parse(rawText)
    } catch {
      parseFailed = true
    }
  }

  if (!response.ok || parseFailed) {
    throw new Error(
      parseFailed
        ? 'Unexpected response from the backend — check VITE_BACKEND_API_BASE_URL.'
        : data?.message || `Request failed with status ${response.status}.`
    )
  }

  return data.data as T
}

async function adminRequest<T>(path: string): Promise<T> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('You need to sign in before calling the backend.')
  }

  const token = await user.getIdToken()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${getBackendBaseUrl()}${normalizedPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return parseResponse<T>(response)
}

async function publicRequest<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${getBackendBaseUrl()}${normalizedPath}`)
  return parseResponse<T>(response)
}

export type AdminSeller = {
  id: string
  storeName: string
  storeSlug: string
  ownerName: string
  email: string
  plan: 'starter' | 'growth' | 'pro' | null
  planName: string
  status: 'active' | 'trial' | 'past_due'
  mrrNaira: number
  orders: number
  joined: string | null
}

export type AdminOverview = {
  totalSellers: number
  activeSellers: number
  trialSellers: number
  mrrNaira: number
  totalOrders: number
  planDistribution: { plan: string; value: number }[]
  revenueByMonth: { month: string; mrr: number; signups: number }[]
}

export type AdminOrder = {
  id: string
  storeName: string
  customer: string
  amount: number
  status: string
  date: string | null
}

export type AdminNotification = {
  id: string
  title: string
  description: string
  type: string
  status: string
  date: string | null
}

export function fetchAdminOverview() {
  return adminRequest<AdminOverview>('/admin/overview')
}

export function fetchAdminSellers() {
  return adminRequest<AdminSeller[]>('/admin/sellers')
}

export function fetchAdminOrders(limit = 100) {
  return adminRequest<AdminOrder[]>(`/admin/orders?limit=${limit}`)
}

export function fetchAdminNotifications(limit = 50) {
  return adminRequest<AdminNotification[]>(`/admin/notifications?limit=${limit}`)
}

export type SubscriptionPlan = {
  id: string
  name: string
  amountNaira: number
  interval: string
  description: string
}

export function fetchSubscriptionPlans() {
  return publicRequest<{ plans: SubscriptionPlan[] }>('/payments/plans')
}
