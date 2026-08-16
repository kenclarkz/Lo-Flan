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
  {
    id: 'original-slice',
    name: 'Original Slice',
    tagline: 'Silky · Caramel · Classic',
    description:
      'A single, silky slice of our classic vanilla flan, crowned with burnt amber caramel.',
    price: 5,
    video: asset('/assets/video/vanillaflan.mp4'),
    fallbackVideo: asset('/assets/video/flanvideo.mp4'),
    poster: asset('/assets/video/flanvideo-poster.jpg'),
  },
  {
    id: 'cheese-slice',
    name: 'Cheese Slice',
    tagline: 'Creamy · Rich · Indulgent',
    description:
      'A creamy slice of cheesecake-style flan baked with a soft, golden caramel top.',
    price: 6,
    video: asset('/assets/video/flanvideo.mp4'),
    fallbackVideo: asset('/assets/video/flanvideo-h264.mp4'),
    poster: asset('/assets/video/flanvideo-poster.jpg'),
  },
  {
    id: 'coconut-slice',
    name: 'Coconut Slice',
    tagline: 'Tropical · Creamy · Toasted',
    description:
      'A single slice of velvety coconut custard with a toasted coconut finish over soft caramel.',
    price: 6,
    video: asset('/assets/video/coconutflan.mp4'),
    fallbackVideo: asset('/assets/video/3416428052367618.mp4'),
    poster: asset('/assets/video/3416428052367618-poster.jpg'),
  },
  {
    id: 'choco-mini',
    name: 'Flan Choco Mini Personal',
    tagline: 'Rich · Dark · Mini',
    description:
      'A personal mini chocolate flan — dark cocoa custard over caramel in one indulgent little portion.',
    price: 8,
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
