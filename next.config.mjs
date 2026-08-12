/** @type {import('next').NextConfig} */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '/Lo-Flan').replace(/\/+$/, '')

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: `${basePath}/`,
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
