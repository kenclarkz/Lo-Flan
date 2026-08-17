'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Loader2,
  LogOut,
  MessageCircle,
  Phone,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { isAuthed, logout } from '@/lib/admin'
import {
  clearAllOrders,
  fetchOrders,
  getAdminKey,
  getLocalOrders,
  getServerUrl,
  ORDER_STATUSES,
  setAdminKey,
  setServerUrl,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/lib/chat'
import { Button, Field, SectionCard, StatCard, TextInput } from '@/components/business/ui'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'border-amber-400/50 text-amber-300',
  new: 'border-gold/50 text-gold',
  confirmed: 'border-sage/50 text-sage',
  fulfilled: 'border-cream/30 text-cream/70',
  cancelled: 'border-red-400/50 text-red-300',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SourceBadge({ source }: { source: Order['source'] }) {
  const isChat = source === 'chat'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em]',
        isChat ? 'border-sage/40 text-sage' : 'border-gold/40 text-gold'
      )}
    >
      {isChat ? <MessageCircle className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
      {isChat ? 'Chat' : 'Phone'}
    </span>
  )
}

export default function OrdersDashboardPage() {
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [serverUrl, setServerUrlState] = useState('')
  const [adminKey, setAdminKeyState] = useState('')

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/admin')
      return
    }
    setServerUrlState(getServerUrl())
    setAdminKeyState(getAdminKey())
  }, [router])

  const flash = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 4000)
  }, [])

  const handleSave = () => {
    setServerUrl(serverUrl)
    setAdminKey(adminKey)
    flash('Server connection saved.')
  }

  const load = useCallback(
    async (showSpinner = true) => {
      const url = getServerUrl()
      const key = getAdminKey()

      if (showSpinner) setLoading(true)
      setError('')

      const localOrders = getLocalOrders()

      if (!url || !key) {
        // No backend configured — show locally saved orders only
        if (localOrders.length > 0) {
          setOrders(localOrders)
          setLoaded(true)
          flash('Showing orders saved locally in this browser. Phone orders require a server connection — see below.')
        } else {
          setError(
            'No backend is configured yet. Phone orders and server-side chat orders will not appear until you connect a backend.\n\n' +
            '1. Deploy the Lo-Flan backend server and note its public URL.\n' +
            '2. Set the ADMIN_API_KEY environment variable on the server.\n' +
            '3. Enter the Server URL and Admin Key above and press "Save connection", then "Load orders".'
          )
        }
        setLoading(false)
        return
      }

      try {
        const remote = await fetchOrders(url, key)
        // Merge local + remote, deduplicating by id
        const remoteIds = new Set(remote.map((o) => o.id))
        const merged = [...remote, ...localOrders.filter((o) => !remoteIds.has(o.id))]
        setOrders(merged)
        setLoaded(true)
      } catch (err) {
        // Server unavailable — fall back to local orders
        if (localOrders.length > 0) {
          setOrders(localOrders)
          setLoaded(true)
          flash('Server unavailable — showing orders saved locally.')
        } else {
          setError(
            err instanceof Error && err.message === 'unauthorized'
              ? 'The admin key was rejected — check it against ADMIN_API_KEY on the server.'
              : `Could not reach the server at ${url}. Is it running and publicly accessible?`
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [flash]
  )

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const url = getServerUrl()
    const key = getAdminKey()
    try {
      await updateOrderStatus(url, key, id, status)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    } catch {
      setError('Could not update the status.')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Delete all orders and call records? This cannot be undone.')) return
    try {
      await clearAllOrders(getServerUrl(), getAdminKey())
      setOrders([])
      setLoaded(true)
      flash('All records cleared.')
    } catch {
      setError('Could not clear the records.')
    }
  }

  const stats = {
    total: orders.length,
    chat: orders.filter((o) => o.source === 'chat').length,
    phone: orders.filter((o) => o.source === 'phone').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    needsAttention: orders.filter((o) => (o.status === 'new' || o.status === 'pending') && (o.source === 'chat' || o.isOrder)).length,
  }

  const handleLogout = () => {
    logout()
    router.replace('/admin')
  }

  return (
    <main className="min-h-[100svh] px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <Link
              href="/admin/panel"
              className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin panel
            </Link>
            <h1 className="display text-4xl">Orders &amp; Chat</h1>
            <p className="text-sm text-cream/50 mt-1 max-w-2xl">
              Orders from the website chatbot and calls taken by the AI phone
              receptionist, pulled live from the Lo-Flan backend. Approve or deny
              pending orders below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => load(false)} className="px-4 py-2.5" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
            <Button variant="danger" onClick={handleClear} className="px-4 py-2.5" disabled={orders.length === 0}>
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="px-4 py-2.5">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>

        {notice && (
          <div className="mb-6 flex items-center gap-2 text-sm text-cream bg-gold/10 border border-gold/30 rounded-lg px-4 py-3">
            <Check className="w-4 h-4 text-gold flex-shrink-0" />
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-200 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Server connection */}
        <SectionCard className="mb-6">
          <h3 className="eyebrow mb-4">Backend connection</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Field label="Server URL" hint="Optional. Leave blank to use same-origin /api/orders. Set only for a cross-origin backend.">
              <TextInput
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="https://your-backend.example"
              />
            </Field>
            <Field label="Admin key" hint="The ADMIN_API_KEY value set on the server.">
              <TextInput
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKeyState(e.target.value)}
                placeholder="ADMIN_API_KEY"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={handleSave} className="px-6 py-2.5">
              Save connection
            </Button>
            <Button variant="ghost" onClick={() => load()} className="px-6 py-2.5" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Load orders
            </Button>
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total records" value={stats.total} sub="Chat + phone" />
          <StatCard label="Chat orders" value={stats.chat} accent="positive" sub="From the website chatbot" />
          <StatCard label="Phone calls" value={stats.phone} sub="From the AI receptionist" />
          <StatCard label="Pending" value={stats.pending} accent="negative" sub="Awaiting approval" />
          <StatCard label="Needs attention" value={stats.needsAttention} accent="negative" sub="Pending + new orders" />
        </div>

        {!loaded && !loading && orders.length === 0 && (
          <p className="text-sm text-cream/40">
            No records loaded yet. Enter the admin key above and press &ldquo;Load orders&rdquo;. The server URL is optional when the backend is on the same domain.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-10 text-sm text-cream/60">
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
            Loading orders…
          </div>
        )}

        {loaded && orders.length === 0 && !loading && (
          <p className="text-sm text-cream/40">
            No orders or calls yet. When a customer places an order through the
              chatbot or calls the receptionist, it will appear here.
          </p>
        )}

        {orders.length > 0 && (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="card-surface rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <SourceBadge source={order.source} />
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em]',
                      STATUS_STYLES[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                  <span className="text-xs text-cream/40">{formatDate(order.createdAt)}</span>
                  <span className="text-xs text-cream/40 ml-auto truncate">{order.id}</span>
                </div>

                {(order.customerName || order.phone) && (
                  <p className="text-sm text-cream/80 mb-2">
                    {order.customerName && <span className="font-medium">{order.customerName}</span>}
                    {order.customerName && order.phone && <span className="text-cream/40"> · </span>}
                    {order.phone && <span>{order.phone}</span>}
                  </p>
                )}

                {order.items && order.items.length > 0 ? (
                  <ul className="space-y-1.5 mb-3">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-cream/80">
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="text-cream/40"> × {item.quantity}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {(order.deliveryMethod || order.pickupDate || order.deliveryAddress) && (
                  <div className="flex flex-wrap gap-3 mb-3 text-xs text-cream/60">
                    {order.deliveryMethod && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cream/15 px-2.5 py-1">
                        {order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                    )}
                    {order.pickupDate && (
                      <span>Date: {order.pickupDate}</span>
                    )}
                    {order.deliveryAddress && (
                      <span>Address: {order.deliveryAddress}</span>
                    )}
                  </div>
                )}

                {order.message && (
                  <p className="text-xs text-cream/50 mb-1">
                    <span className="eyebrow">Message</span>
                    <br />
                    {order.message}
                  </p>
                )}
                {order.notes && (
                  <p className="text-xs text-cream/50 mb-1">
                    <span className="eyebrow">Notes</span>
                    <br />
                    {order.notes}
                  </p>
                )}
                {order.transcript && (
                  <div className="mb-2 rounded-lg bg-espresso-dark border border-cream/10 px-4 py-3">
                    <p className="eyebrow mb-1.5">Call transcript</p>
                    <p className="text-xs text-cream/55 whitespace-pre-line">{order.transcript}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-cream/50">
                    Status
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className="bg-espresso-dark border border-cream/15 rounded-lg px-3 py-1.5 text-sm text-cream focus:outline-none focus:border-gold"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
