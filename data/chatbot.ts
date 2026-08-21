/**
 * Lo-Flan chatbot knowledge base.
 *
 * This file is the single source of truth for what the built-in website chat
 * assistant knows. It runs entirely in the browser (static export), so:
 *
 *   - No API key, no external AI service, and no server are needed.
 *   - The assistant only ever answers from the facts below — it never
 *     invents prices, products, hours, or policies.
 *
 * To update the assistant's knowledge, edit this file and redeploy. Prices,
 * product info, and business hours are pulled from `data/products.ts` and
 * `data/site.ts` so the chatbot always matches the website.
 */

import { menu } from './products'
import { site } from './site'

export interface ProductInfo {
  id: string
  name: string
  price: number
  description: string
  size: string
  ingredients: string[]
  allergens: string[]
  /** Extra words/phrases visitors might use to find this flan. */
  keywords: string[]
}

export interface TopicIntent {
  id: string
  /** Words/phrases that should trigger this topic. */
  keywords: string[]
  answer: string
}

export interface FaqEntry {
  id: string
  question: string
  keywords: string[]
  answer: string
}

export interface ChatbotKnowledge {
  businessName: string
  description: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  messenger: string
  hoursText: string
  ordering: string
  pickup: string
  delivery: string
  leadTime: string
  catering: string
  wholesale: string
  promotions: string
  products: ProductInfo[]
  topics: TopicIntent[]
  faqs: FaqEntry[]
  fallback: string
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export const products: ProductInfo[] = menu.map((product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  description: product.description,
  size: sizeFor(product.id),
  ingredients: baseIngredientsFor(product.id),
  allergens: baseAllergensFor(product.id),
  keywords: productKeywordsFor(product.id),
}))

// Ingredients, allergens, sizes and keywords are kept here so they stay easy
// to edit. They are intentionally conservative — grounded in the menu
// descriptions — and can be refined by the owner without touching any code.

function sizeFor(id: string): string {
  switch (id) {
    case 'original-slice':
    case 'cheese-slice':
    case 'coconut-slice':
      return 'Single slice'
    case 'choco-mini':
      return 'Personal mini flan'
    default:
      return 'Whole flan · serves about 8'
  }
}

function baseIngredientsFor(id: string): string[] {
  const base = ['milk', 'cream', 'eggs', 'sugar', 'caramel']
  switch (id) {
    case 'coconut':
    case 'coconut-slice':
      return [...base, 'coconut']
    case 'chocoflan':
    case 'choco-mini':
      return [...base, 'chocolate', 'cocoa']
    case 'cheese-slice':
      return [...base, 'cream cheese']
    case 'vanilla':
    case 'original-slice':
    default:
      return [...base, 'Tahitian vanilla bean']
  }
}

function baseAllergensFor(id: string): string[] {
  const base = ['milk', 'cream', 'eggs']
  if (id === 'coconut' || id === 'coconut-slice') return [...base, 'coconut']
  if (id === 'cheese-slice') return [...base, 'cream cheese']
  return base
}

function productKeywordsFor(id: string): string[] {
  switch (id) {
    case 'coconut':
      return ['coconut', 'coco', 'tropical']
    case 'coconut-slice':
      return ['coconut', 'coco', 'tropical', 'slice', 'slices', 'single slice']
    case 'chocoflan':
      return ['chocolate', 'choco', 'chocoflan', 'chocolate flan', 'cocoa', 'dark']
    case 'choco-mini':
      return ['chocolate', 'choco', 'mini', 'personal', 'single', 'small', 'little']
    case 'cheese-slice':
      return ['cheese', 'cheesecake', 'cream cheese', 'slice', 'slices', 'single slice']
    case 'vanilla':
    case 'original-slice':
    default:
      return ['vanilla', 'classic', 'original', 'tahitian', 'custard', 'slice', 'slices', 'single slice']
  }
}

/* ------------------------------------------------------------------ */
/* Business facts                                                     */
/* ------------------------------------------------------------------ */

export const businessFacts = {
  businessName: site.name,
  description: 'a small, luxury handmade flan bakery in Santa Barbara, California',
  tagline: site.tagline,
  address: site.address,
  phone: site.phone,
  email: site.email,
  website: 'https://kenclarkz.github.io/Lo-Flan/',
  messenger: site.messenger,
  hoursText: site.hours.map((h) => `${h.day}: ${h.time}`).join(' · '),
  ordering:
    'You can order through the "Order Now" button on our website (opens Facebook Messenger at m.me/losflan), or by calling us at ' +
    site.phone +
    '.',
  pickup: 'Pickup is available at the bakery during business hours.',
  delivery: 'Sorry, we don\'t offer delivery — pickup only! You can pick up your order at the bakery during business hours.',
  leadTime: 'Orders are best placed at least a day in advance.',
  catering:
    'We build custom flan towers and dessert tables for weddings, corporate events, and birthdays. Minimum 48 hours notice, serves 12-200+ guests, with delivery and setup available and dietary accommodations offered. Request a quote through our contact page.',
  wholesale:
    'We stock Lo\'s Flan in cafés, restaurants, and specialty shops. Wholesale includes volume pricing tiers, weekly fresh delivery, marketing support and POS, and exclusive seasonal access. Reach out through the contact page to become a partner.',
  promotions:
    "We don't have any active promotions listed right now. For the latest deals and seasonal offers, check our menu page, message us on Messenger, or call us.",
}

const menuSummary = products
  .map((p) => `${p.name} — ${formatPrice(p.price)} (${p.size})`)
  .join(', ')

const menuWithDescriptions = products
  .map((p) => `${p.name} (${formatPrice(p.price)}): ${p.description}`)
  .join(' · ')

/* ------------------------------------------------------------------ */
/* Topic intents                                                       */
/* ------------------------------------------------------------------ */

export const topics: TopicIntent[] = [
  {
    id: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'howdy', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening', 'yo'],
    answer:
      "Hello! I'm the Lo's Flan assistant. Ask me about our menu, prices, hours, or how to order — I'm happy to help.",
  },
  {
    id: 'hours',
    keywords: [
      'hours',
      'open',
      'close',
      'closed',
      'business hours',
      'what time',
      'when are you open',
      'when do you open',
      'when do you close',
      'what time do you open',
      'what time do you close',
      'operating hours',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
      'weekend',
      'weekdays',
      'today',
    ],
    answer: `Here are our hours: ${businessFacts.hoursText}.`,
  },
  {
    id: 'location',
    keywords: [
      'where are you',
      'where are you located',
      'address',
      'location',
      'located',
      'directions',
      'how do i get there',
      'your address',
      'find you',
      'where is the bakery',
    ],
    answer: `You'll find us at ${businessFacts.address}.`,
  },
  {
    id: 'contact',
    keywords: [
      'phone',
      'call',
      'email',
      'contact',
      'reach you',
      'get in touch',
      'number',
      'telephone',
      'text',
      'message you',
      'email address',
      'how can i reach you',
    ],
    answer: `You can reach us by phone at ${businessFacts.phone} or by email at ${businessFacts.email}. We typically reply within 24 hours.`,
  },
  {
    id: 'delivery',
    keywords: [
      'delivery',
      'deliver',
      'deliveries',
      'ship',
      'shipping',
      'do you deliver',
      'how much is delivery',
      'how much does delivery cost',
      'how much do you charge for delivery',
      'how much is shipping',
      'delivery cost',
      'delivery fee',
      'home delivery',
      'deliver to',
      'do you ship',
      'delivery options',
    ],
    answer: `${businessFacts.delivery} ${businessFacts.leadTime}`,
  },
  {
    id: 'pickup',
    keywords: ['pickup', 'pick up', 'pick-up', 'takeout', 'take out', 'in store', 'collect my order', 'grab my order'],
    answer: `${businessFacts.pickup} ${businessFacts.leadTime}`,
  },
  {
    id: 'ordering',
    keywords: [
      'order',
      'ordering',
      'order now',
      'place an order',
      'buy',
      'purchase',
      'how do i order',
      'how to order',
      'want to order',
      'would like to order',
      'i would like to order',
      'id like to order',
      'i want to order',
      'want to buy',
      'i want to buy',
      'would like to buy',
      'id like to buy',
      'like to buy',
      'want to get',
      'gonna order',
      'can i order',
      'preorder',
      'pre-order',
      'reserve',
      'messenger',
    ],
    answer: `You can order right here in the chat — just tell me what you'd like! You can also order through the "Order Now" button (opens Facebook Messenger) or by calling us at ${site.phone}.`,
  },
  {
    id: 'order_status',
    keywords: [
      'order status',
      'track my order',
      'track my',
      'track it',
      'track',
      'tracking',
      'where is my order',
      'lost my order',
      'order update',
      'cancel my order',
      'status of my order',
    ],
    answer:
      'Orders are confirmed directly by the owner. For an update on an existing order, please call us at ' +
      businessFacts.phone +
      ' or email ' +
      businessFacts.email +
      '.',
  },
  {
    id: 'menu',
    keywords: [
      'menu',
      'flavors',
      'flavours',
      'options',
      'what do you sell',
      'products',
      'varieties',
      'kinds',
      'choices',
      'what do you have',
      'what do you offer',
      'flavor list',
      'available',
      'flan',
      'flans',
    ],
    answer: `We make ${menuWithDescriptions}. You can see the full menu on our site.`,
  },
  {
    id: 'prices',
    keywords: [
      'price',
      'prices',
      'cost',
      'costs',
      'how much',
      'what does it cost',
      'pricing',
      'charge',
      'how expensive',
      'what is the price',
      'whats the price',
      'how much is a flan',
      'how much are your flans',
    ],
    answer: `Here's what we have: ${menuSummary}.`,
  },
  {
    id: 'ingredients',
    keywords: [
      'ingredients',
      'what is in it',
      'whats in it',
      'made of',
      'made with',
      'contains',
      'recipe',
      'what is inside',
      'what goes in',
      'how do you make it',
    ],
    answer:
      'Our flans are made with simple ingredients — no stabilizers, no artificial flavors. For a specific flan, tell me which one and I can list its ingredients.',
  },
  {
    id: 'allergens',
    keywords: [
      'allergen',
      'allergens',
      'allergy',
      'allergies',
      'dairy',
      'lactose',
      'gluten',
      'gluten free',
      'gluten-free',
      'nuts',
      'nut allergy',
      'vegan',
      'plant based',
      'plant-based',
      'soy',
      'egg allergy',
      'milk allergy',
    ],
    answer:
      'All of our flans contain milk, cream, and eggs. Tell me which flan you\'re asking about and I can list its allergens. For any serious allergy, please let us know when you order and the owner will confirm the details with you.',
  },
  {
    id: 'sizes',
    keywords: [
      'size',
      'sizes',
      'what size',
      'what sizes',
      'how big are',
      'how large',
      'large',
      'small',
      'whole flan',
      'half flan',
      'slice',
      'slices',
      'serving',
      'servings',
      'serves',
      'how big',
      'how many people',
      'feed a crowd',
    ],
    answer: `Our whole flans (${products
      .filter((p) => p.size.startsWith('Whole'))
      .map((p) => p.name)
      .join(', ')}) each serve about 8. We also sell slices of our original and coconut flans, plus a mini personal choco flan. For larger quantities, ask us when you order and the owner will confirm what's available.`,
  },
  {
    id: 'catering',
    keywords: [
      'cater',
      'catering',
      'event',
      'events',
      'wedding',
      'weddings',
      'party',
      'parties',
      'party of',
      'for a party',
      'corporate',
      'bulk',
      'large order',
      'large quantity',
      'tower',
      'dessert table',
      'celebration',
      'function',
    ],
    answer: `${businessFacts.catering}`,
  },
  {
    id: 'wholesale',
    keywords: [
      'wholesale',
      'partner',
      'partnership',
      'stock our',
      'stock your',
      'cafe',
      'café',
      'restaurant',
      'specialty shop',
      'retail',
      'distributor',
      'supplier',
      'resell',
      'carry your flans',
    ],
    answer: `${businessFacts.wholesale}`,
  },
  {
    id: 'promotions',
    keywords: [
      'promotion',
      'promo',
      'promotions',
      'deal',
      'deals',
      'discount',
      'discounts',
      'sale',
      'sales',
      'coupon',
      'coupons',
      'offer',
      'offers',
      'special',
      'specials',
      'cheaper',
      'giveaway',
    ],
    answer: `${businessFacts.promotions}`,
  },
  {
    id: 'recommend',
    keywords: [
      'recommend',
      'recommendation',
      'suggest',
      'best seller',
      'most popular',
      'favorite',
      'favourite',
      'popular',
      'which one',
      'what should i try',
      'whats good',
      'what is good',
      'which flan',
    ],
    answer:
      'It depends on your taste! Our Vanilla Flan is the silky classic, the Coconut Flan is tropical and creamy, and the Chocoflan is rich and indulgent. They are all handmade in small batches.',
  },
  {
    id: 'human',
    keywords: [
      'are you a robot',
      'are you real',
      'are you human',
      'who are you',
      'what are you',
      'are you ai',
      'is this a bot',
      'are you a bot',
      'artificial intelligence',
      'is there a human',
      'is anyone there',
    ],
    answer:
      "I'm the Lo's Flan assistant, a built-in chat helper that answers from our menu and business info. For anything that needs a human — special requests, allergies, or order details — the owner will follow up with you.",
  },
  {
    id: 'help',
    keywords: [
      'help',
      'what can you do',
      'what do you know',
      'what can you tell me',
      'capabilities',
      'how do i use this',
      'what can you help with',
      'how does this work',
      'what questions can i ask',
    ],
    answer:
      'I can answer questions about our flans (flavors, prices, ingredients, allergens), ordering and pickup, business hours, contact info, catering, and wholesale. Just ask!',
  },
  {
    id: 'thanks',
    keywords: ['thank', 'thanks', 'thank you', 'appreciate', 'that helps', 'awesome', 'great', 'perfect'],
    answer: "You're welcome! Is there anything else I can help you with?",
  },
  {
    id: 'bye',
    keywords: ['bye', 'goodbye', 'good bye', 'see you', 'see ya', 'later', 'farewell'],
    answer: "Thanks for chatting with Lo's Flan! We look forward to seeing you. ¡Hasta luego!",
  },
  {
    id: 'complaint',
    keywords: ['complaint', 'complaints', 'unhappy', 'issue with my order', 'problem with my order', 'refund', 'wanted to speak'],
    answer:
      "I'm sorry to hear that — I want to make it right. Please call us at " +
      businessFacts.phone +
      ' or email ' +
      businessFacts.email +
      ' and the owner will personally take care of it.',
  },
]

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export const faqs: FaqEntry[] = [
  {
    id: 'storage',
    question: 'How should I store my flan?',
    keywords: ['store', 'storage', 'keep', 'refrigerat', 'fridge', 'leftover', 'how long does it last'],
    answer:
      'Flans are best enjoyed chilled. Keep yours refrigerated and serve it cold straight from the fridge.',
  },
  {
    id: 'gluten_free',
    question: 'Is the flan gluten-free?',
    keywords: ['gluten', 'gluten free', 'gluten-free', 'celiac', 'wheat'],
    answer:
      'Our flans are made with simple, gluten-free ingredients (no wheat or flour in the custard), but they do contain milk, cream, and eggs. If you have celiac or a serious allergy, please confirm with us when you order.',
  },
  {
    id: 'vegan',
    question: 'Is the flan vegan?',
    keywords: ['vegan', 'plant based', 'plant-based', 'dairy free', 'dairy-free', 'egg free', 'egg-free'],
    answer:
      "Our flans contain milk, cream, and eggs, so they aren't vegan. We do offer dietary accommodations for catering events — reach out through the contact page to discuss options.",
  },
  {
    id: 'advance_notice',
    question: 'How far in advance should I order?',
    keywords: ['advance', 'how far ahead', 'notice', 'last minute', 'how early'],
    answer:
      'Orders are best placed at least a day in advance so we can make everything fresh for you.',
  },
  {
    id: 'freshness',
    question: 'Do you make everything fresh?',
    keywords: ['fresh', 'freshly', 'handmade', 'made to order', 'made-to-order', 'small batch', 'hand-poured', 'hand-torched'],
    answer:
      'Yes — every flan is hand-poured, hand-torched, and hand-packed in small batches, made with simple ingredients and no shortcuts.',
  },
  {
    id: 'slices',
    question: 'Can I order slices?',
    keywords: ['slice', 'slices', 'single slice', 'individual'],
    answer:
      'Yes! We sell single slices of our original and coconut flans, plus a mini personal choco flan. Check our menu page for the full selection.',
  },
]

/* ------------------------------------------------------------------ */
/* Assembled knowledge object                                          */
/* ------------------------------------------------------------------ */

export const chatbotKnowledge: ChatbotKnowledge = {
  ...businessFacts,
  products,
  topics,
  faqs,
  fallback:
    "I'm sorry, I don't have an answer for that one. I'm a built-in assistant, so I can only share what I know about Lo's Flan. For anything else, please call us at " +
    businessFacts.phone +
    ', email ' +
    businessFacts.email +
    ", or use the 'Order Now' button — the owner will follow up with you."
}
