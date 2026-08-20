import type { Metadata, Viewport } from 'next'
import './globals.css'
import { asset, BASE_PATH } from '@/lib/paths'
import { Footer } from '@/components/Footer'
import { SmoothScroll } from '@/components/SmoothScroll'
import { AdminButton } from '@/components/AdminButton'
import { ChatBot } from '@/components/ChatBot'

export const metadata: Metadata = {
  title: {
    default: "Lo's Flan — The Journey of a Perfect Flan",
    template: "%s — Lo's Flan",
  },
  description:
    'A luxury handmade flan bakery. Cinematic storytelling, handcrafted desserts and unforgettable moments — made fresh from simple ingredients.',
  keywords: ['flan', 'bakery', 'caramel flan', 'handmade dessert', 'luxury bakery'],
  icons: { icon: asset('/assets/brand/logo.png'), apple: asset('/assets/brand/logo.png') },
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
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-espresso">
      <head>
        <link rel="manifest" href={asset('/manifest.json')} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lo's Flan" />
        <link rel="apple-touch-icon" href={asset('/assets/brand/logo.png')} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-espresso text-cream">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}",
          }}
        />
        <SmoothScroll />
        <div className="grain" aria-hidden />
        {children}
        <Footer />
        <ChatBot />
        <AdminButton />
      </body>
    </html>
  )
}
