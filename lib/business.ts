/**
 * Business Suite — client-side cost, pricing and profit toolkit for Lo's Flan.
 *
 * The site is a static export (GitHub Pages) with no server, so all data lives
 * in localStorage under a single key. Every calculation below is a pure
 * function of the `BusinessData` shape, which lets the UI derive everything
 * with useMemo and therefore recalculate automatically whenever prices,
 * quantities, recipes or expenses change.
 */

export const BUSINESS_STORAGE_KEY = 'losflan.business.v1'

export const EXPENSE_CATEGORIES = [
  'ingredients',
  'packaging',
  'gas',
  'equipment',
  'marketing',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export type PeriodKey = 'all' | 'month' | '30d'

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: '30d', label: 'Last 30 days' },
]

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  packageSize: number
  packagePrice: number
  amountPerFlan: number
}

export interface RecipeIngredient {
  ingredientId: string
  amountPerFlan: number
}

export interface VariationProduct {
  id: string
  name: string
  emoji?: string
  sellingPrice: number
  slices: number
  slicePrice: number
  ingredients: RecipeIngredient[]
}

export interface Expense {
  id: string
  name: string
  category: ExpenseCategory
  amount: number
  date: string
}

export interface SalesEntry {
  productId: string
  flansSold: number
  slicesSold: number
}

export interface BusinessData {
  version: number
  ingredients: Ingredient[]
  products: VariationProduct[]
  expenses: Expense[]
  sales: SalesEntry[]
  otherRevenue: number
  otherCost: number
  packagingPerFlan: number
  period: PeriodKey
}

export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

function seedIngredients(): Ingredient[] {
  return [
    { id: 'ing-condensed', name: 'Condensed milk', category: 'Dairy', unit: 'can', packageSize: 1, packagePrice: 2.5, amountPerFlan: 1 },
    { id: 'ing-evap', name: 'Evaporated milk', category: 'Dairy', unit: 'can', packageSize: 1, packagePrice: 1.75, amountPerFlan: 1 },
    { id: 'ing-milk', name: 'Whole milk', category: 'Dairy', unit: 'cup', packageSize: 16, packagePrice: 4, amountPerFlan: 0.5 },
    { id: 'ing-eggs', name: 'Eggs', category: 'Dairy', unit: 'egg', packageSize: 12, packagePrice: 4.2, amountPerFlan: 5 },
    { id: 'ing-sugar', name: 'Sugar', category: 'Pantry', unit: 'cup', packageSize: 10, packagePrice: 4, amountPerFlan: 0.75 },
    { id: 'ing-vanilla', name: 'Vanilla extract', category: 'Flavor', unit: 'tsp', packageSize: 48, packagePrice: 7.5, amountPerFlan: 1 },
    { id: 'ing-coconut', name: 'Shredded coconut', category: 'Topping', unit: 'cup', packageSize: 5, packagePrice: 5, amountPerFlan: 0.25 },
    { id: 'ing-chocolate', name: 'Dark chocolate', category: 'Flavor', unit: 'cup', packageSize: 4, packagePrice: 8, amountPerFlan: 0.75 },
    { id: 'ing-oreo', name: 'Oreo cookies', category: 'Flavor', unit: 'pcs', packageSize: 36, packagePrice: 4.5, amountPerFlan: 6 },
    { id: 'ing-salt', name: 'Salt', category: 'Pantry', unit: 'tsp', packageSize: 96, packagePrice: 1.5, amountPerFlan: 0.5 },
  ]
}

function seedProducts(ingredients: Ingredient[]): VariationProduct[] {
  const byId = (id: string) => ingredients.find((i) => i.id === id)?.id ?? id
  return [
    {
      id: 'prod-original',
      name: 'Original',
      emoji: '🍮',
      sellingPrice: 20,
      slices: 8,
      slicePrice: 3.5,
      ingredients: [
        { ingredientId: byId('ing-condensed'), amountPerFlan: 1 },
        { ingredientId: byId('ing-evap'), amountPerFlan: 1 },
        { ingredientId: byId('ing-milk'), amountPerFlan: 0.5 },
        { ingredientId: byId('ing-eggs'), amountPerFlan: 5 },
        { ingredientId: byId('ing-sugar'), amountPerFlan: 0.75 },
        { ingredientId: byId('ing-vanilla'), amountPerFlan: 1 },
        { ingredientId: byId('ing-salt'), amountPerFlan: 0.5 },
      ],
    },
    {
      id: 'prod-chocolate',
      name: 'Chocolate',
      emoji: '🍫',
      sellingPrice: 26,
      slices: 8,
      slicePrice: 4.5,
      ingredients: [
        { ingredientId: byId('ing-condensed'), amountPerFlan: 1 },
        { ingredientId: byId('ing-evap'), amountPerFlan: 1 },
        { ingredientId: byId('ing-milk'), amountPerFlan: 0.5 },
        { ingredientId: byId('ing-eggs'), amountPerFlan: 5 },
        { ingredientId: byId('ing-sugar'), amountPerFlan: 0.75 },
        { ingredientId: byId('ing-vanilla'), amountPerFlan: 1 },
        { ingredientId: byId('ing-salt'), amountPerFlan: 0.5 },
        { ingredientId: byId('ing-chocolate'), amountPerFlan: 0.75 },
      ],
    },
    {
      id: 'prod-oreo',
      name: 'Oreo',
      emoji: '🍪',
      sellingPrice: 28,
      slices: 8,
      slicePrice: 5,
      ingredients: [
        { ingredientId: byId('ing-condensed'), amountPerFlan: 1 },
        { ingredientId: byId('ing-evap'), amountPerFlan: 1 },
        { ingredientId: byId('ing-milk'), amountPerFlan: 0.5 },
        { ingredientId: byId('ing-eggs'), amountPerFlan: 5 },
        { ingredientId: byId('ing-sugar'), amountPerFlan: 0.75 },
        { ingredientId: byId('ing-vanilla'), amountPerFlan: 1 },
        { ingredientId: byId('ing-salt'), amountPerFlan: 0.5 },
        { ingredientId: byId('ing-oreo'), amountPerFlan: 6 },
      ],
    },
  ]
}

export function seedBusinessData(): BusinessData {
  const ingredients = seedIngredients()
  return {
    version: 1,
    ingredients,
    products: seedProducts(ingredients),
    expenses: [
      { id: uid('exp-'), name: 'Oven gas', category: 'gas', amount: 45, date: new Date().toISOString().slice(0, 10) },
      { id: uid('exp-'), name: 'Flan tins', category: 'packaging', amount: 60, date: new Date().toISOString().slice(0, 10) },
    ],
    sales: [
      { productId: 'prod-original', flansSold: 12, slicesSold: 20 },
      { productId: 'prod-chocolate', flansSold: 6, slicesSold: 10 },
      { productId: 'prod-oreo', flansSold: 4, slicesSold: 8 },
    ],
    otherRevenue: 0,
    otherCost: 0,
    packagingPerFlan: 1.25,
    period: 'all',
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export function loadBusinessData(): BusinessData {
  if (typeof window === 'undefined') return seedBusinessData()
  try {
    const raw = localStorage.getItem(BUSINESS_STORAGE_KEY)
    if (!raw) return seedBusinessData()
    const parsed = JSON.parse(raw) as Partial<BusinessData>
    const seed = seedBusinessData()
    return {
      ...seed,
      ...parsed,
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : seed.ingredients,
      products: Array.isArray(parsed.products) ? parsed.products : seed.products,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seed.expenses,
      sales: Array.isArray(parsed.sales) ? parsed.sales : seed.sales,
      version: seed.version,
    }
  } catch {
    return seedBusinessData()
  }
}

export function saveBusinessData(data: BusinessData) {
  try {
    localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage full — nothing we can do from a helper */
  }
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const money = (digits: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export function formatMoney(value: number, digits = 2): string {
  const v = Number.isFinite(value) ? value : 0
  return money(digits).format(v)
}

export function formatNumber(value: number, digits = 2): string {
  const v = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v)
}

export function formatPercent(value: number, digits = 1): string {
  const v = Number.isFinite(value) ? value : 0
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v)}%`
}

export function safeNum(value: string | number, fallback = 0): number {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : fallback
}

/* ------------------------------------------------------------------ */
/* Ingredient maths                                                    */
/* ------------------------------------------------------------------ */

export function ingredientPricePerUnit(
  ing: Pick<Ingredient, 'packageSize' | 'packagePrice'>
): number {
  return ing.packageSize > 0 ? ing.packagePrice / ing.packageSize : 0
}

export function ingredientCostPerFlan(
  ing: Pick<Ingredient, 'packageSize' | 'packagePrice' | 'amountPerFlan'>
): number {
  return ingredientPricePerUnit(ing) * ing.amountPerFlan
}

/* ------------------------------------------------------------------ */
/* Product maths                                                       */
/* ------------------------------------------------------------------ */

export function productCostPerFlan(
  product: VariationProduct,
  ingredients: Ingredient[]
): number {
  const map = new Map(ingredients.map((i) => [i.id, i]))
  return product.ingredients.reduce((sum, r) => {
    const ing = map.get(r.ingredientId)
    return sum + (ing ? ingredientPricePerUnit(ing) * r.amountPerFlan : 0)
  }, 0)
}

export function productFullCostPerFlan(
  product: VariationProduct,
  ingredients: Ingredient[],
  packagingPerFlan: number
): number {
  return productCostPerFlan(product, ingredients) + packagingPerFlan
}

export function productProfitPerFlan(
  product: VariationProduct,
  ingredients: Ingredient[],
  packagingPerFlan: number
): number {
  return product.sellingPrice - productFullCostPerFlan(product, ingredients, packagingPerFlan)
}

export function productMarginPercent(
  product: VariationProduct,
  ingredients: Ingredient[],
  packagingPerFlan: number
): number {
  return product.sellingPrice > 0
    ? (productProfitPerFlan(product, ingredients, packagingPerFlan) / product.sellingPrice) * 100
    : 0
}

/* ------------------------------------------------------------------ */
/* Batch maths                                                         */
/* ------------------------------------------------------------------ */

export interface BatchResult {
  costPerFlan: number
  packagingPerFlan: number
  fullCostPerFlan: number
  quantity: number
  total: number
}

export function batchCost(
  product: VariationProduct,
  ingredients: Ingredient[],
  packagingPerFlan: number,
  quantity: number
): BatchResult {
  const base = productCostPerFlan(product, ingredients)
  const full = base + packagingPerFlan
  return {
    costPerFlan: base,
    packagingPerFlan,
    fullCostPerFlan: full,
    quantity: Math.max(0, quantity),
    total: full * Math.max(0, quantity),
  }
}

/* ------------------------------------------------------------------ */
/* Slice maths                                                         */
/* ------------------------------------------------------------------ */

export function sliceCost(costPerFlan: number, slices: number): number {
  return slices > 0 ? costPerFlan / slices : 0
}

export function sliceProfit(
  slicesSold: number,
  slicePrice: number,
  costPerSlice: number
): number {
  return slicesSold * (slicePrice - costPerSlice)
}

/* ------------------------------------------------------------------ */
/* Expenses                                                            */
/* ------------------------------------------------------------------ */

export function expenseInPeriod(expense: Expense, period: PeriodKey, now: Date): boolean {
  if (period === 'all') return true
  const d = new Date(`${expense.date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  if (period === 'month') {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    )
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 30)
  return d >= cutoff
}

export function totalExpenses(data: BusinessData, now = new Date()): number {
  return data.expenses
    .filter((e) => expenseInPeriod(e, data.period, now))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function expenseTotalByCategory(
  data: BusinessData,
  now = new Date()
): { category: ExpenseCategory; total: number }[] {
  const totals = new Map<ExpenseCategory, number>()
  data.expenses
    .filter((e) => expenseInPeriod(e, data.period, now))
    .forEach((e) => {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount)
    })
  return EXPENSE_CATEGORIES.map((c) => ({ category: c, total: totals.get(c) ?? 0 }))
}

/* ------------------------------------------------------------------ */
/* Sales + profit                                                      */
/* ------------------------------------------------------------------ */

export interface SalesAggregate {
  flansSold: number
  slicesSold: number
  productsSold: number
  wholeRevenue: number
  sliceRevenue: number
  otherRevenue: number
  totalRevenue: number
  productionCost: number
  grossProfit: number
  grossMarginPercent: number
  expenses: number
  netProfit: number
  netMarginPercent: number
}

export interface PerProductProfit {
  product: VariationProduct
  costPerFlan: number
  flansSold: number
  slicesSold: number
  wholeRevenue: number
  sliceRevenue: number
  totalRevenue: number
  totalCost: number
  profit: number
  marginPercent: number
}

export function aggregateSales(data: BusinessData, now = new Date()): SalesAggregate {
  const map = new Map(data.products.map((p) => [p.id, p]))
  const ing = data.ingredients

  let flansSold = 0
  let slicesSold = 0
  let wholeRevenue = 0
  let sliceRevenue = 0
  let productionCost = 0

  for (const s of data.sales) {
    const product = map.get(s.productId)
    if (!product) continue
    const costPerFlan = productFullCostPerFlan(product, ing, data.packagingPerFlan)
    flansSold += s.flansSold
    slicesSold += s.slicesSold
    wholeRevenue += s.flansSold * product.sellingPrice
    sliceRevenue += s.slicesSold * product.slicePrice
    productionCost += s.flansSold * costPerFlan
    productionCost += s.slicesSold * sliceCost(costPerFlan, product.slices)
  }

  const expenses = totalExpenses(data, now)
  const totalRevenue = wholeRevenue + sliceRevenue + data.otherRevenue
  const grossProfit = totalRevenue - productionCost
  const netProfit = grossProfit - expenses

  return {
    flansSold,
    slicesSold,
    productsSold: flansSold + slicesSold,
    wholeRevenue,
    sliceRevenue,
    otherRevenue: data.otherRevenue,
    totalRevenue,
    productionCost,
    grossProfit,
    grossMarginPercent: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    expenses,
    netProfit,
    netMarginPercent: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  }
}

export function perProductProfits(data: BusinessData): PerProductProfit[] {
  const map = new Map(data.products.map((p) => [p.id, p]))
  const ing = data.ingredients
  const byProduct = new Map<string, { flans: number; slices: number }>()

  for (const s of data.sales) {
    const cur = byProduct.get(s.productId) ?? { flans: 0, slices: 0 }
    cur.flans += s.flansSold
    cur.slices += s.slicesSold
    byProduct.set(s.productId, cur)
  }

  return data.products.map((product) => {
    const sold = byProduct.get(product.id) ?? { flans: 0, slices: 0 }
    const costPerFlan = productFullCostPerFlan(product, ing, data.packagingPerFlan)
    const costPerSlice = sliceCost(costPerFlan, product.slices)
    const wholeRevenue = sold.flans * product.sellingPrice
    const sliceRevenue = sold.slices * product.slicePrice
    const totalRevenue = wholeRevenue + sliceRevenue
    const totalCost = sold.flans * costPerFlan + sold.slices * costPerSlice
    const profit = totalRevenue - totalCost
    return {
      product,
      costPerFlan,
      flansSold: sold.flans,
      slicesSold: sold.slices,
      wholeRevenue,
      sliceRevenue,
      totalRevenue,
      totalCost,
      profit,
      marginPercent: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
    }
  })
}

export function mostProfitable(data: BusinessData, top = 3): PerProductProfit[] {
  return perProductProfits(data)
    .filter((p) => p.totalRevenue > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, top)
}
