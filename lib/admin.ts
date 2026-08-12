/**
 * Client-side admin helpers: login/session plus a GitHub-backed video library
 * used to swap the main-page scroll video.
 *
 * The site is a static export (GitHub Pages) with no backend, so uploaded
 * videos are written straight into the GitHub repo through the Contents API
 * and served back to visitors via raw.githubusercontent.com. Nothing is kept
 * in browser storage — the repo is the single source of truth.
 */

export const ADMIN_USER = 'kenny'
export const ADMIN_PASSWORD = 'qwerty'

export const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'kenclarkz'
export const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Lo-Flan'
export const GITHUB_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main'

/** Repo directory that holds uploaded scroll videos (served from /public). */
export const VIDEO_DIR = 'public/assets/video/custom'
/** Repo file that records the video library + desktop/mobile selection. */
export const SCROLL_FILE = 'data/scroll-video.json'

export const VIDEO_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${VIDEO_DIR}`
export const SCROLL_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${SCROLL_FILE}`

const SESSION_KEY = 'losflan.admin.session'
const TOKEN_KEY = 'losflan.admin.token'

export type VideoMeta = {
  id: string
  name: string
  file: string
  size: number
  mime: string
  addedAt: number
  sha?: string
}

export type ScrollVideoConfig = {
  videos: VideoMeta[]
  desktop?: string
  mobile?: string
  updatedAt: number
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
/* GitHub token (the only thing left in browser storage)               */
/* ------------------------------------------------------------------ */

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim())
  } catch {
    /* storage full — nothing we can do from a helper */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* GitHub API plumbing                                                 */
/* ------------------------------------------------------------------ */

async function ghRequest(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  if (!token) {
    throw new Error('No GitHub token configured — add it in the admin panel first.')
  }
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  })
}

async function githubError(resp: Response): Promise<string> {
  try {
    const data = await resp.json()
    if (data && typeof data.message === 'string') {
      return `GitHub: ${data.message}`
    }
  } catch {
    /* not JSON */
  }
  return `GitHub request failed (${resp.status})`
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

/* Base64 helpers (browser-safe, unicode-aware) */

function toBase64(str: string): string {
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(str)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin)
  }
  return Buffer.from(str, 'utf-8').toString('base64')
}

function fromBase64(b64: string): string {
  if (typeof atob === 'function') {
    const bin = atob(b64.replace(/\s/g, ''))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  }
  return Buffer.from(b64, 'base64').toString('utf-8')
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      resolve(data.slice(data.indexOf(',') + 1).replace(/\s/g, ''))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/* Contents API file operations */

async function getFileContent(
  path: string
): Promise<{ content: string; sha?: string } | null> {
  const resp = await ghRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodePath(path)}`
  )
  if (resp.status === 404) return null
  if (!resp.ok) throw new Error(await githubError(resp))
  const data = await resp.json()
  return {
    content: data.content ? fromBase64(data.content) : '',
    sha: data.sha,
  }
}

async function putFile(
  path: string,
  message: string,
  content: string,
  sha?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content,
    branch: GITHUB_BRANCH,
  }
  if (sha) body.sha = sha
  const resp = await ghRequest(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodePath(path)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  )
  if (!resp.ok) throw new Error(await githubError(resp))
}

async function deleteFile(path: string, sha?: string): Promise<void> {
  const attempt = async (s: string | undefined) => {
    const resp = await ghRequest(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodePath(path)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Remove ${path.split('/').pop()}`,
          sha: s,
          branch: GITHUB_BRANCH,
        }),
      }
    )
    if (resp.status === 404) return
    if (!resp.ok) throw new Error(await githubError(resp))
  }
  try {
    await attempt(sha)
  } catch {
    // Stale blob sha (e.g. force-pushed) — re-fetch and retry once.
    const file = await getFileContent(path)
    if (file?.sha) await attempt(file.sha)
  }
}

/* ------------------------------------------------------------------ */
/* Scroll video config (single committed JSON = source of truth)       */
/* ------------------------------------------------------------------ */

const EMPTY_CONFIG: ScrollVideoConfig = { videos: [], updatedAt: 0 }

function normalizeConfig(parsed: unknown): ScrollVideoConfig {
  if (!parsed || typeof parsed !== 'object') return { ...EMPTY_CONFIG }
  const p = parsed as Record<string, unknown>
  return {
    videos: Array.isArray(p.videos) ? (p.videos as VideoMeta[]) : [],
    desktop: typeof p.desktop === 'string' ? p.desktop : undefined,
    mobile: typeof p.mobile === 'string' ? p.mobile : undefined,
    updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
  }
}

/** Fresh read through the API — used by the admin panel. Requires a token. */
export async function getPanelConfig(): Promise<ScrollVideoConfig> {
  const file = await getFileContent(SCROLL_FILE)
  if (!file) return { ...EMPTY_CONFIG }
  try {
    return normalizeConfig(JSON.parse(file.content))
  } catch {
    return { ...EMPTY_CONFIG }
  }
}

/** Commits the config back to the repo. Requires a token. */
export async function setScrollConfig(cfg: ScrollVideoConfig): Promise<void> {
  const current = await getFileContent(SCROLL_FILE)
  const next = { ...cfg, updatedAt: Date.now() }
  await putFile(
    SCROLL_FILE,
    'Update homepage scroll video config',
    toBase64(JSON.stringify(next, null, 2)),
    current?.sha
  )
}

/** Public read for the homepage — no token needed, served via raw CDN. */
export async function getScrollConfig(): Promise<ScrollVideoConfig> {
  try {
    const resp = await fetch(SCROLL_RAW_URL, { cache: 'no-store' })
    if (!resp.ok) return { ...EMPTY_CONFIG }
    return normalizeConfig(await resp.json())
  } catch {
    return { ...EMPTY_CONFIG }
  }
}

/** Raw CDN URL for a committed scroll video (works the moment the push lands). */
export function scrollVideoUrl(fileName: string): string {
  return `${VIDEO_RAW_BASE}/${encodeURIComponent(fileName)}`
}

/* ------------------------------------------------------------------ */
/* Video upload / delete                                               */
/* ------------------------------------------------------------------ */

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-m4v': 'm4v',
  'video/x-matroska': 'mkv',
  'video/ogg': 'ogv',
}

function extensionFor(file: File): string {
  const match = file.name.toLowerCase().match(/\.([a-z0-9]{2,5})$/)
  if (match) return match[1]
  return EXT_BY_MIME[file.type] ?? 'mp4'
}

function buildMeta(file: File): VideoMeta {
  const ext = extensionFor(file)
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    name: file.name || `${id}.${ext}`,
    file: `${id}.${ext}`,
    size: file.size,
    mime: file.type || 'video/mp4',
    addedAt: Date.now(),
  }
}

/**
 * Commits the video file to `public/assets/video/custom/` and records it in
 * the scroll-video config. The blob is never stored in the browser.
 */
export async function saveVideo(file: File): Promise<VideoMeta> {
  const meta = buildMeta(file)
  const content = await fileToBase64(file)
  await putFile(
    `${VIDEO_DIR}/${meta.file}`,
    `Upload scroll video: ${meta.file}`,
    content
  )
  const cfg = await getPanelConfig()
  cfg.videos = [...cfg.videos.filter((v) => v.id !== meta.id), meta]
  await setScrollConfig(cfg)
  return meta
}

/**
 * Deletes the video file from the repo and drops it (plus any scroll
 * selection pointing at it) from the config.
 */
export async function deleteVideo(id: string): Promise<void> {
  const cfg = await getPanelConfig()
  const meta = cfg.videos.find((v) => v.id === id)
  if (meta) await deleteFile(`${VIDEO_DIR}/${meta.file}`, meta.sha)

  const next: ScrollVideoConfig = {
    videos: cfg.videos.filter((v) => v.id !== id),
    updatedAt: Date.now(),
  }
  if (meta) {
    if (cfg.desktop === meta.file) next.desktop = undefined
    if (cfg.mobile === meta.file) next.mobile = undefined
  }
  await setScrollConfig(next)
}

export async function verifyToken(): Promise<boolean> {
  try {
    const resp = await ghRequest('/user')
    return resp.ok
  } catch {
    return false
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}
