/**
 * GitHub Pages serves this project from `https://kenclarkz.github.io/Lo-Flan/`,
 * so every asset/link must be prefixed with the repo base path. Next's Link and
 * Image components handle this automatically via `basePath`; this helper does
 * the same for raw asset URLs passed to three.js loaders, <img>, fetch, etc.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '/Lo-Flan').replace(/\/+$/, '')

export function asset(path: string): string {
  if (!path) return path
  const clean = path.startsWith('/') ? path : `/${path}`
  return clean.startsWith(BASE_PATH) ? clean : `${BASE_PATH}${clean}`
}
