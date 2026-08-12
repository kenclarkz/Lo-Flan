/**
 * Client-side admin helpers: login/session plus a small IndexedDB-backed
 * video library used to swap the main-page scroll video without redeploying.
 *
 * The site is a static export (GitHub Pages), so there is no server to
 * authenticate against or store files in. The session lives in sessionStorage
 * and uploaded videos live in IndexedDB, keyed per browser.
 */

export const ADMIN_USER = 'kenny'
export const ADMIN_PASSWORD = 'qwerty'

const SESSION_KEY = 'losflan.admin.session'
const LIBRARY_KEY = 'losflan.admin.library'
const SCROLL_KEY = 'losflan.admin.scrollVideo'

const DB_NAME = 'losflan-admin'
const DB_VERSION = 1
const STORE = 'videos'

export type VideoMeta = {
  id: string
  name: string
  size: number
  mime: string
  addedAt: number
}

export type ScrollSelection = {
  desktop?: string
  mobile?: string
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export function login(username: string, password: string): boolean {
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) return false
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    localStorage.setItem(SESSION_KEY, '1')
  }
  return true
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function isAuthed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return (
      sessionStorage.getItem(SESSION_KEY) === '1' ||
      localStorage.getItem(SESSION_KEY) === '1'
    )
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* IndexedDB video blobs                                               */
/* ------------------------------------------------------------------ */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveVideoBlob(blob: File | Blob): Promise<VideoMeta> {
  const id = `video-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const file = blob as File
  const meta: VideoMeta = {
    id,
    name: file.name || `video-${new Date().toISOString()}`,
    size: blob.size,
    mime: blob.type || 'video/mp4',
    addedAt: Date.now(),
  }

  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  const library = getLibrary()
  library.push(meta)
  setLibrary(library)
  return meta
}

export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDb()
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    /* the blob may already be gone — metadata cleanup still proceeds */
  }

  setLibrary(getLibrary().filter((m) => m.id !== id))

  const sel = getScrollSelection()
  const next: ScrollSelection = {}
  if (sel.desktop !== id) next.desktop = sel.desktop
  if (sel.mobile !== id) next.mobile = sel.mobile
  setScrollSelection(next)
}

/* ------------------------------------------------------------------ */
/* Library metadata + scroll selection (localStorage)                  */
/* ------------------------------------------------------------------ */

export function getLibrary(): VideoMeta[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    const parsed = raw ? (JSON.parse(raw) as VideoMeta[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setLibrary(library: VideoMeta[]) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library))
  } catch {
    /* storage full — nothing we can do from a helper */
  }
}

export function getScrollSelection(): ScrollSelection {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SCROLL_KEY)
    const parsed = raw ? (JSON.parse(raw) as ScrollSelection) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function setScrollSelection(sel: ScrollSelection) {
  try {
    localStorage.setItem(SCROLL_KEY, JSON.stringify(sel))
  } catch {
    /* storage full — nothing we can do from a helper */
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}
