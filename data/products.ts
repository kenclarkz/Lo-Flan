import { asset } from '@/lib/paths'

export interface MenuProduct {
  id: string
  name: string
  tagline: string
  description: string
  price: number
  video: string
  fallbackVideo: string
  poster: string
}

export const menu: MenuProduct[] = [
  {
    id: 'vanilla',
    name: 'Vanilla Flan',
    tagline: 'Silky · Fragrant · Classic',
    description:
      'Tahitian vanilla bean custard folded into a whisper-light flan, crowned with burnt amber caramel.',
    price: 20,
    video: asset('/assets/video/vanillaflan.mp4'),
    fallbackVideo: asset('/assets/video/flanvideo.mp4'),
    poster: asset('/assets/video/flanvideo-poster.jpg'),
  },
  {
    id: 'coconut',
    name: 'Coconut Flan',
    tagline: 'Tropical · Creamy · Golden',
    description:
      'Velvety coconut custard with a toasted coconut finish over soft, golden caramel.',
    price: 25,
    video: asset('/assets/video/coconutflan.mp4'),
    fallbackVideo: asset('/assets/video/3416428052367618.mp4'),
    poster: asset('/assets/video/3416428052367618-poster.jpg'),
  },
  {
    id: 'chocoflan',
    name: 'Chocoflan',
    tagline: 'Rich · Dark · Indulgent',
    description:
      'Chocolate custard layered over caramel in one unforgettable dessert.',
    price: 30,
    video: asset('/assets/video/chocoflan.mp4'),
    fallbackVideo: asset('/assets/video/flanvideo.mp4'),
    poster: asset('/assets/video/flanvideo-poster.jpg'),
  },
]

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
