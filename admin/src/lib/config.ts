const envEmails = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)
  ?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const ADMIN_EMAILS = envEmails?.length
  ? envEmails
  : ['blorbmart@gmail.com']

export function isAllowedAdmin(email: string | null | undefined) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

const configuredStoreBaseUrl = import.meta.env.VITE_PUBLIC_STORE_BASE_URL as string | undefined
export const PUBLIC_STORE_BASE_URL = (configuredStoreBaseUrl || 'https://blorbify.vercel.app').replace(/\/+$/g, '')

export function getStoreUrl(storeSlug: string) {
  return `${PUBLIC_STORE_BASE_URL}/${storeSlug}`
}
