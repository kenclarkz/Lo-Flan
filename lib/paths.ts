/**
 * GitHub Pages serves this project from `https://kenclarkz.github.io/Lo-Flan/`,
 * so every asset/link must be prefixed with the repo base path. When running as
 * a Capacitor app or with BUILD_TARGET=app, the base path is empty since assets
 * are served from the root.
 */

const isApp = typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
   window.location.hostname === 'localhost' && window.location.port === '')

export const BASE_PATH = isApp
  ? ''
  : (process.env.NEXT_PUBLIC_BASE_PATH ?? '/Lo-Flan').replace(/\/+$/, '')

export function asset(path: string): string {
  if (!path) return path
  const clean = path.startsWith('/') ? path : `/${path}`
  if (!BASE_PATH) return clean
  return clean.startsWith(BASE_PATH) ? clean : `${BASE_PATH}${clean}`
}
