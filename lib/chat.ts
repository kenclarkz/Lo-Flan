/**
 * Client helpers for the Lo-Flan admin Orders dashboard.
 *
 * The website chat bot is fully built-in (see `lib/chatbot.ts` and
 * `data/chatbot.ts`) and does not need a server. Chat order submission,
 * however, POSTs to `/api/orders` on the same origin by default — no
 * configuration is needed when the backend is hosted on the same domain.
 *
 * To point at a cross-origin backend, set `NEXT_PUBLIC_SERVER_URL` at
 * build time or override it per-browser from the admin panel's "Backend
 * connection" section. Both are optional.
 */

export const SERVER_URL_KEY = 'losflan.admin.serverUrl'
export const ADMIN_KEY_KEY = 'losflan.admin.adminKey'

function envServerUrl(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/+$/, '')
}

/**
 * Returns the backend base URL for the orders API.
 *
 * When nothing is configured the string is empty — callers should treat
 * this as "same origin" and POST to `/api/orders` directly (relative URL).
 * Set `NEXT_PUBLIC_SERVER_URL` or use the admin panel to override for
 * cross-origin backends.
 */
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

export const ORDER_STATUSES = ['pending', 'new', 'confirmed', 'fulfilled', 'cancelled'] as const
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
  deliveryMethod?: string
  deliveryAddress?: string
  pickupDate?: string
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

/* ------------------------------------------------------------------ */
/* Public: submit a chat order (no admin key needed)                   */
/* ------------------------------------------------------------------ */

export interface ChatOrderSubmission {
  items: OrderItem[]
  customerName: string
  phone?: string
  deliveryMethod?: string
  deliveryAddress?: string
  pickupDate?: string
  notes?: string
}

const LOCAL_ORDERS_KEY = 'losflan.orders.local'

function loadLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders))
  } catch {
    /* storage unavailable */
  }
}

export function getLocalOrders(): Order[] {
  return loadLocalOrders()
}

export class OrderSubmissionError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public serverError?: string,
  ) {
    super(message)
    this.name = 'OrderSubmissionError'
  }
}

/**
 * Try the backend first; if the server is unreachable (network error),
 * persist the order locally so static (GitHub Pages) deployments still work.
 *
 * Backend validation errors (4xx) are thrown as `OrderSubmissionError` so
 * the caller knows the order was *rejected* and must not display "submitted".
 */
export async function submitChatOrder(
  serverUrl: string,
  submission: ChatOrderSubmission
): Promise<Order> {
  if (!Array.isArray(submission.items) || submission.items.length === 0) {
    throw new OrderSubmissionError('items_required', 400, 'items_required')
  }

  const base = serverUrl || ''
  const url = `${base}/api/orders`

  if (!base) {
    console.warn(
      '[order] No server URL configured — posting to same origin. ' +
      'If the backend is on a different domain, set NEXT_PUBLIC_SERVER_URL ' +
      'at build time or in the admin panel.'
    )
  }
  console.log(`[order] POST ${url}`, submission)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })
  } catch (err) {
    console.warn('[order] backend unavailable, saving locally:', err)
    return saveLocalOrder(submission)
  }

  const bodyText = await res.text()
  console.log(`[order] response ${res.status}`, bodyText)

  if (res.ok) {
    const body = JSON.parse(bodyText) as { order?: Order }
    if (body.order) return body.order
  }

  // Backend returned an error (e.g. 400 items_required) — propagate it so
  // the UI does NOT show "submitted".
  let serverError: string | undefined
  try {
    const parsed = JSON.parse(bodyText) as { error?: string }
    serverError = parsed.error
  } catch {
    /* non-JSON error body */
  }
  throw new OrderSubmissionError(
    serverError ?? `backend_error_${res.status}`,
    res.status,
    serverError,
  )
}

function saveLocalOrder(submission: ChatOrderSubmission): Order {
  const record: Order = {
    id: `local-${Date.now().toString(36)}`,
    source: 'chat',
    status: 'pending',
    createdAt: new Date().toISOString(),
    customerName: submission.customerName,
    phone: submission.phone,
    items: submission.items,
    deliveryMethod: submission.deliveryMethod,
    deliveryAddress: submission.deliveryAddress,
    pickupDate: submission.pickupDate,
    notes: submission.notes,
  }
  const orders = loadLocalOrders()
  orders.push(record)
  saveLocalOrders(orders)
  console.log('[order] saved locally as', record.id)
  return record
}
