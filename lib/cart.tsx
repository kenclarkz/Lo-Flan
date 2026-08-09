'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  size: string
  quantity: number
  image?: string
}

export interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  remove: (id: string, size: string) => void
  updateQty: (id: string, size: string, quantity: number) => void
  clear: () => void
  open: boolean
  setOpen: (open: boolean) => void
  toast: string | null
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'los-flan-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      /* ignore corrupted storage */
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore quota errors */
    }
  }, [items])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }, [])

  const add = useCallback<CartContextValue['add']>(
    (item) => {
      const quantity = item.quantity ?? 1
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.id === item.id && i.size === item.size
        )
        if (existing) {
          return prev.map((i) =>
            i.id === item.id && i.size === item.size
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        }
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            size: item.size,
            image: item.image,
            quantity,
          },
        ]
      })
      showToast(`${item.name} added to your order`)
      setOpen(true)
    },
    [showToast]
  )

  const remove = useCallback<CartContextValue['remove']>((id, size) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.size === size)))
  }, [])

  const updateQty = useCallback<CartContextValue['updateQty']>(
    (id, size, quantity) => {
      if (quantity <= 0) {
        remove(id, size)
        return
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === id && i.size === size ? { ...i, quantity } : i
        )
      )
    },
    [remove]
  )

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      remove,
      updateQty,
      clear,
      open,
      setOpen,
      toast,
    }),
    [items, add, remove, updateQty, clear, open, toast]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}
