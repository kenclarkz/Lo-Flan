import type { Metadata, Viewport } from 'next'
import './globals.css'
import { asset, BASE_PATH } from '@/lib/paths'
import { Footer } from '@/components/Footer'
import { SmoothScroll } from '@/components/SmoothScroll'

export const metadata: Metadata = {
  title: {
    default: "Lo's Flan — The Journey of a Perfect Flan",
    template: "%s — Lo's Flan",
  },
  description:
    'A luxury handmade flan bakery. Cinematic storytelling, handcrafted desserts and unforgettable moments — made fresh from simple ingredients.',
  keywords: ['flan', 'bakery', 'caramel flan', 'handmade dessert', 'luxury bakery'],
  icons: { icon: asset('/assets/brand/logo.png') },
  openGraph: {
    title: "Lo's Flan — The Journey of a Perfect Flan",
    description:
      'A luxury handmade flan bakery. Cinematic storytelling, handcrafted desserts and unforgettable moments.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || ''}${asset('/assets/brand/logo.png')}`],
  },
}

export const viewport: Viewport = {
  themeColor: '#1B120C',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-espresso">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-espresso text-cream">
        <SmoothScroll />
        <div className="grain" aria-hidden />
        {children}
        <Footer />
      </body>
    </html>
  )
}
