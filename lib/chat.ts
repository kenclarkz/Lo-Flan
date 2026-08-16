/**
 * Client helpers for the Lo-Flan admin Orders dashboard.
 *
 * The website chat bot is fully built-in (see `lib/chatbot.ts` and
 * `data/chatbot.ts`) and does not need a server. The admin orders dashboard,
 * however, talks to the small Node backend (`server/`) that also runs the
 * phone receptionist. The server URL can be baked in at build time via
 * `NEXT_PUBLIC_SERVER_URL` and overridden per-browser from the admin panel.
 */

export const SERVER_URL_KEY = 'losflan.admin.serverUrl'
export const ADMIN_KEY_KEY = 'losflan.admin.adminKey'

function envServerUrl(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/+$/, '')
}

export function getServerUrl(): string {
  if (typeof window === 'undefined') return envServerUrl()
  try {
    return localStorage.getItem(SERVER_URL_KEY) ?? envServerUrl()
  } catch {
    return envServerUrl()
  }
}

export function setServerUrl(url: string) {
  try {
    const trimmed = url.trim().replace(/\/+$/, '')
    if (trimmed) localStorage.setItem(SERVER_URL_KEY, trimmed)
    else localStorage.removeItem(SERVER_URL_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function getAdminKey(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(ADMIN_KEY_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setAdminKey(key: string) {
  try {
    const trimmed = key.trim()
    if (trimmed) localStorage.setItem(ADMIN_KEY_KEY, trimmed)
    else localStorage.removeItem(ADMIN_KEY_KEY)
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Admin orders API                                                    */
/* ------------------------------------------------------------------ */

export const ORDER_STATUSES = ['new', 'confirmed', 'fulfilled', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type OrderSource = 'chat' | 'phone'

export interface OrderItem {
  name: string
  quantity: number
}

export interface Order {
  id: string
  source: OrderSource
  status: OrderStatus
  createdAt: string
  customerName?: string
  phone?: string
  items?: OrderItem[]
  notes?: string
  message?: string
  callSid?: string
  conversationId?: string
  transcript?: string
  isOrder?: boolean
}

function adminHeaders(adminKey: string): Record<string, string> {
  return { 'x-admin-key': adminKey }
}

async function adminFetch(
  serverUrl: string,
  adminKey: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(`${serverUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...adminHeaders(adminKey),
    },
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`orders_http_${res.status}`)
  return res
}

export async function fetchOrders(serverUrl: string, adminKey: string): Promise<Order[]> {
  const res = await adminFetch(serverUrl, adminKey, '/api/orders')
  const body = (await res.json()) as { orders?: Order[] }
  return body.orders ?? []
}

export async function updateOrderStatus(
  serverUrl: string,
  adminKey: string,
  id: string,
  status: OrderStatus
): Promise<void> {
  await adminFetch(serverUrl, adminKey, `/api/orders/${id}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export async function clearAllOrders(serverUrl: string, adminKey: string): Promise<void> {
  await adminFetch(serverUrl, adminKey, '/api/orders/clear', { method: 'POST' })
}
