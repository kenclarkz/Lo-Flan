/**
 * Product catalog for Lo's Flan.
 *
 * To add a new product, append one object to `products` below.
 * Drop a matching image into `/public/assets/products/<id>.png` (or run
 * `node tools/generate-product-images.mjs` to create a placeholder SVG).
 *
 * Optional future-proof fields you can add per product:
 *   - discount, compareAt   -> sale pricing
 *   - available             -> inventory availability
 *   - dietary               -> labels such as "gluten-free"
 *   - prepDays              -> lead time for catering orders
 */

export type CategoryId =
  | 'all'
  | 'classic'
  | 'specialty'
  | 'seasonal'
  | 'party'
  | 'gift'

export interface Category {
  id: CategoryId
  label: string
  description: string
}

export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  /** base price in USD (whole dollars) */
  price: number
  compareAt?: number
  category: Exclude<CategoryId, 'all'>
  sizes: string[]
  sizePrice?: Partial<Record<string, number>>
  image: string
  ingredients: string[]
  featured?: boolean
  seasonal?: boolean
  isNew?: boolean
  badge?: string
  rating?: number
  allergens?: string[]
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', description: 'Everything we make' },
  {
    id: 'classic',
    label: 'Classic Flans',
    description: 'The originals — silky, golden, timeless.',
  },
  {
    id: 'specialty',
    label: 'Specialty Flans',
    description: 'Modern interpretations, serious flavour.',
  },
  {
    id: 'seasonal',
    label: 'Seasonal Flavors',
    description: 'Here for a moment. Gone soon.',
  },
  {
    id: 'party',
    label: 'Party Sizes',
    description: 'Crowd-pleasers for every celebration.',
  },
  {
    id: 'gift',
    label: 'Gift Boxes',
    description: 'Beautifully boxed, ready to share.',
  },
]

export const products: Product[] = [
  {
    id: 'classic-flan',
    name: 'Classic Caramel Flan',
    tagline: 'The one that started it all.',
    description:
      'Traditional creamy custard baked over a layer of deeply caramelised sugar. Silky, glossy and quietly perfect.',
    price: 35,
    category: 'classic',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    sizePrice: { 'Small (6")': 28, 'Medium (9")': 35, 'Large (11")': 48 },
    image: '/assets/products/classic-flan.svg',
    ingredients: ['Eggs', 'Whole Milk', 'Vanilla', 'Golden Sugar'],
    featured: true,
    badge: 'Best Seller',
    rating: 4.9,
    allergens: ['Egg', 'Milk'],
  },
  {
    id: 'vanilla-flan',
    name: 'Tahitian Vanilla Bean Flan',
    tagline: 'True vanilla, speckled and fragrant.',
    description:
      'Slow-steeped Tahitian vanilla beans folded into a whisper-light custard, crowned with burnt amber caramel.',
    price: 42,
    category: 'classic',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/vanilla-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Tahitian Vanilla', 'Cream', 'Sugar'],
    featured: true,
    rating: 5.0,
    allergens: ['Egg', 'Milk'],
  },
  {
    id: 'coffee-flan',
    name: 'Cold Brew Caramel Flan',
    tagline: 'For the espresso obsessed.',
    description:
      'Single-origin cold brew, steeped for 18 hours, balanced by a whisper of salted caramel.',
    price: 44,
    category: 'specialty',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/coffee-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Cold Brew', 'Salted Caramel', 'Sugar'],
    rating: 4.8,
    allergens: ['Egg', 'Milk'],
  },
  {
    id: 'chocolate-flan',
    name: 'Belgian Chocolate Flan',
    tagline: 'Dark, velvety, indulgent.',
    description:
      '72% single-origin chocolate melted into the custard, finished with a mirror-gloss caramel glaze.',
    price: 48,
    category: 'specialty',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/chocolate-flan.svg',
    ingredients: ['Eggs', 'Milk', '72% Chocolate', 'Cream', 'Caramel'],
    featured: true,
    badge: 'Indulgent',
    rating: 4.9,
    allergens: ['Egg', 'Milk', 'Soy'],
  },
  {
    id: 'mango-flan',
    name: 'Mango Passion Flan',
    tagline: 'Sunshine in custard form.',
    description:
      'Ripe Alphonso mango purée swirled through the custard with a passionfruit drizzle. Only in season.',
    price: 46,
    category: 'seasonal',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/mango-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Alphonso Mango', 'Passionfruit', 'Sugar'],
    seasonal: true,
    rating: 4.8,
    allergens: ['Egg', 'Milk'],
  },
  {
    id: 'matcha-flan',
    name: 'Ceremonial Matcha Flan',
    tagline: 'Earthy, elegant, energising.',
    description:
      'Uji ceremonial matcha whisked into a delicate custard over a hint of white chocolate caramel.',
    price: 45,
    category: 'seasonal',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/matcha-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Ceremonial Matcha', 'White Chocolate', 'Sugar'],
    seasonal: true,
    rating: 4.7,
    allergens: ['Egg', 'Milk', 'Soy'],
  },
  {
    id: 'hazelnut-flan',
    name: 'Toasted Hazelnut Flan',
    tagline: 'New — roasted, buttery, nutty.',
    description:
      'Double-roasted hazelnuts ground into the custard and scattered over a gianduja caramel.',
    price: 47,
    category: 'specialty',
    sizes: ['Small (6")', 'Medium (9")', 'Large (11")'],
    image: '/assets/products/hazelnut-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Hazelnut', 'Gianduja', 'Caramel'],
    isNew: true,
    rating: 4.9,
    allergens: ['Egg', 'Milk', 'Tree Nuts'],
  },
  {
    id: 'party-flan',
    name: 'La Gran Fiesta',
    tagline: 'The centrepiece flan.',
    description:
      'A grand, hand-plated flan crowned with torched caramel shards — built to feed a crowd and steal the table.',
    price: 120,
    category: 'party',
    sizes: ['Serves 16', 'Serves 24'],
    sizePrice: { 'Serves 16': 120, 'Serves 24': 168 },
    image: '/assets/products/party-flan.svg',
    ingredients: ['Eggs', 'Milk', 'Vanilla', 'Caramel', 'Cream'],
    featured: true,
    badge: 'Celebration',
    rating: 5.0,
    allergens: ['Egg', 'Milk'],
  },
  {
    id: 'gift-box',
    name: 'Petit Four Gift Box',
    tagline: 'Six perfect little moments.',
    description:
      'A curated box of miniature flans in rotating flavours, ribboned and ready to gift. Perfect for corporate and celebration orders.',
    price: 65,
    category: 'gift',
    sizes: ['6 pieces', '12 pieces'],
    sizePrice: { '6 pieces': 65, '12 pieces': 115 },
    image: '/assets/products/gift-box.svg',
    ingredients: ['Eggs', 'Milk', 'Seasonal Flavours', 'Caramel'],
    rating: 4.8,
    allergens: ['Egg', 'Milk', 'Tree Nuts (varies)'],
  },
]

export const getProduct = (id: string) => products.find((p) => p.id === id)

export const getFeatured = () => products.filter((p) => p.featured)

export const getSeasonal = () => products.filter((p) => p.seasonal)

export const getCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id)

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
