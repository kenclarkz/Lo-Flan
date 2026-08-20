/** @type {import('next').NextConfig} */
const isApp = process.env.BUILD_TARGET === 'app'
const basePath = isApp
  ? ''
  : (process.env.NEXT_PUBLIC_BASE_PATH ?? '/Lo-Flan').replace(/\/+$/, '')

if (!isApp && !process.env.NEXT_PUBLIC_SERVER_URL) {
  console.warn(
    '\n⚠  NEXT_PUBLIC_SERVER_URL is not set.\n' +
    '   Chat orders will POST to the same origin (no backend on GitHub Pages).\n' +
    '   Set it as a repository secret → Settings → Secrets and variables → Actions.\n'
  )
}

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  reactStrictMode: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    return config
  },
}

export default nextConfig
