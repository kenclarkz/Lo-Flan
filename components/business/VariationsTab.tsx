'use client'

import { useMemo, useState } from 'react'
import { Boxes, Copy, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  formatMoney,
  formatPercent,
  productCostPerFlan,
  productFullCostPerFlan,
  productMarginPercent,
  productProfitPerFlan,
  sliceCost,
  uid,
  type BusinessData,
  type RecipeIngredient,
  type VariationProduct,
} from '@/lib/business'
import { Button, Field, NumberField, SectionCard, SectionHeading, Select, TextInput } from './ui'

interface ProductDraft {
  name: string
  emoji: string
  sellingPrice: number
  slices: number
  slicePrice: number
  ingredients: RecipeIngredient[]
}

function emptyDraft(): ProductDraft {
  return {
    name: '',
    emoji: '🍮',
    sellingPrice: 0,
    slices: 8,
    slicePrice: 0,
    ingredients: [],
  }
}

function ProductForm({
  data,
  initial,
  onSave,
  onCancel,
}: {
  data: BusinessData
  initial: VariationProduct | null
  onSave: (product: VariationProduct) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<ProductDraft>(
    initial
      ? {
          name: initial.name,
          emoji: initial.emoji ?? '🍮',
          sellingPrice: initial.sellingPrice,
          slices: initial.slices,
          slicePrice: initial.slicePrice,
          ingredients: initial.ingredients.map((r) => ({ ...r })),
        }
      : emptyDraft()
  )
  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const copyFrom = (productId: string) => {
    const source = data.products.find((p) => p.id === productId)
    if (!source) return
    setDraft((d) => ({
      ...d,
      emoji: source.emoji ?? d.emoji,
      slices: source.slices,
      slicePrice: source.slicePrice,
      ingredients: source.ingredients.map((r) => ({ ...r })),
    }))
  }

  const setIngredient = (index: number, patch: Partial<RecipeIngredient>) => {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }))
  }

  const removeIngredient = (index: number) => {
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.filter((_, i) => i !== index),
    }))
  }

  const addIngredient = () => {
    const first = data.ingredients[0]
    if (!first) return
    setDraft((d) => ({
      ...d,
      ingredients: [...d.ingredients, { ingredientId: first.id, amountPerFlan: 1 }],
    }))
  }

  const costPerFlan = productCostPerFlan(draft as VariationProduct, data.ingredients)
  const fullCostPerFlan = costPerFlan + data.packagingPerFlan

  const submit = () => {
    if (!draft.name.trim()) return
    onSave({
      id: initial?.id ?? uid('prod-'),
      name: draft.name.trim(),
      emoji: draft.emoji.trim() || '🍮',
      sellingPrice: draft.sellingPrice,
      slices: draft.slices > 0 ? draft.slices : 8,
      slicePrice: draft.slicePrice,
      ingredients: draft.ingredients,
    })
  }

  const ingredientOptions = [
    { value: '', label: '— select —' },
    ...data.ingredients.map((i) => ({
      value: i.id,
      label: `${i.name} (${formatMoney(costOfIngredientPerFlan(i.id))} / flan)`,
    })),
  ]

  function costOfIngredientPerFlan(id: string): number {
    const ing = data.ingredients.find((x) => x.id === id)
    if (!ing) return 0
    return (ing.packagePrice / (ing.packageSize || 1)) * ing.amountPerFlan
  }

  return (
    <SectionCard className="mb-6 border-gold/25">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="display text-xl">
          {initial ? 'Edit variation' : 'New variation'}
        </h3>
        <button
          onClick={onCancel}
          className="text-cream/40 hover:text-gold transition-colors"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!initial && data.products.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-cream/50">Start from:</span>
          {data.products.map((p) => (
            <button
              key={p.id}
              onClick={() => copyFrom(p.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5 text-xs text-cream/70 hover:border-gold hover:text-gold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name">
          <TextInput
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Oreo"
            autoFocus
          />
        </Field>
        <Field label="Emoji">
          <TextInput
            value={draft.emoji}
            onChange={(e) => set('emoji', e.target.value)}
            placeholder="🍮"
          />
        </Field>
        <NumberField
          label="Whole flan price"
          value={draft.sellingPrice}
          onValue={(v) => set('sellingPrice', v)}
          prefix="$"
        />
        <NumberField
          label="Slice price"
          value={draft.slicePrice}
          onValue={(v) => set('slicePrice', v)}
          prefix="$"
        />
        <NumberField
          label="Slices per flan"
          value={draft.slices}
          onValue={(v) => set('slices', v)}
          step={1}
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow">Recipe — per flan</p>
          <button
            onClick={addIngredient}
            disabled={data.ingredients.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5 text-xs text-cream/70 hover:border-gold hover:text-gold disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add ingredient
          </button>
        </div>

        {data.ingredients.length === 0 ? (
          <p className="text-sm text-cream/40">
            Add ingredients in the Ingredient Manager first.
          </p>
        ) : draft.ingredients.length === 0 ? (
          <p className="text-sm text-cream/40">
            No ingredients yet. Add one above (or copy an existing variation).
          </p>
        ) : (
          <ul className="space-y-2">
            {draft.ingredients.map((row, i) => {
              const ing = data.ingredients.find((x) => x.id === row.ingredientId)
              const rowCost = ing
                ? (ing.packagePrice / (ing.packageSize || 1)) * row.amountPerFlan
                : 0
              return (
                <li
                  key={i}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_8rem_6rem_auto] sm:items-center rounded-lg bg-espresso-dark border border-cream/10 px-3 py-2.5"
                >
                  <Select
                    value={row.ingredientId}
                    onChange={(v) => setIngredient(i, { ingredientId: v })}
                    options={ingredientOptions}
                  />
                  <NumberField
                    value={row.amountPerFlan}
                    onValue={(v) => setIngredient(i, { amountPerFlan: v })}
                    step={0.01}
                    suffix={ing?.unit ?? 'unit'}
                  />
                  <div className="text-sm text-gold font-medium self-center sm:text-right">
                    {formatMoney(rowCost)}
                  </div>
                  <button
                    onClick={() => removeIngredient(i)}
                    className="justify-self-start sm:justify-self-end rounded-full p-2 text-cream/40 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${ing?.name ?? 'ingredient'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl bg-espresso-dark border border-cream/10 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
        <div>
          <p className="eyebrow mb-0.5">Ingredients / flan</p>
          <p className="text-cream/80">{formatMoney(costPerFlan)}</p>
        </div>
        <div>
          <p className="eyebrow mb-0.5">With packaging</p>
          <p className="text-cream/80">{formatMoney(fullCostPerFlan)}</p>
        </div>
        <div>
          <p className="eyebrow mb-0.5">Profit / flan</p>
          <p className="text-gold font-medium">
            {formatMoney(draft.sellingPrice - fullCostPerFlan)}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-0.5">Margin</p>
          <p className="text-gold font-medium">
            {formatPercent(
              draft.sellingPrice > 0
                ? ((draft.sellingPrice - fullCostPerFlan) / draft.sellingPrice) * 100
                : 0
            )}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-0.5">Cost / slice</p>
          <p className="text-cream/80">
            {formatMoney(sliceCost(fullCostPerFlan, draft.slices))}
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={!draft.name.trim()}>
          {initial ? 'Save changes' : 'Create variation'}
        </Button>
      </div>
    </SectionCard>
  )
}

export function VariationsTab({
  data,
  onChange,
  flash,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
  flash?: (msg: string) => void
}) {
  const [editing, setEditing] = useState<VariationProduct | null>(null)
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => data.products, [data.products])

  const save = (product: VariationProduct) => {
    const exists = data.products.some((p) => p.id === product.id)
    const products = exists
      ? data.products.map((p) => (p.id === product.id ? product : p))
      : [...data.products, product]
    onChange({ ...data, products })
    setEditing(null)
    setCreating(false)
    flash?.(exists ? 'Variation updated.' : 'Variation created.')
  }

  const remove = (id: string) => {
    const products = data.products.filter((p) => p.id !== id)
    const sales = data.sales.filter((s) => s.productId !== id)
    onChange({ ...data, products, sales })
    if (editing?.id === id) setEditing(null)
    flash?.('Variation removed.')
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Product Variations"
        description="Define each flan you sell — Original, Chocolate, Oreo and more. Every variation gets its cost automatically from the ingredients used in its recipe."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setCreating(true)
            }}
          >
            <Plus className="w-4 h-4" />
            New variation
          </Button>
        }
      />

      {(creating || editing) && (
        <ProductForm
          data={data}
          initial={editing}
          onSave={save}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      {rows.length === 0 ? (
        <SectionCard>
          <Boxes className="w-8 h-8 text-gold/50 mb-3" />
          <p className="text-sm text-cream/40">
            No variations yet. Create one to start pricing your flans.
          </p>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((p) => {
            const cost = productFullCostPerFlan(p, data.ingredients, data.packagingPerFlan)
            const profit = productProfitPerFlan(p, data.ingredients, data.packagingPerFlan)
            const margin = productMarginPercent(p, data.ingredients, data.packagingPerFlan)
            const cps = sliceCost(cost, p.slices)
            return (
              <SectionCard key={p.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl">{p.emoji ?? '🍮'}</span>
                    <h3 className="display text-xl truncate">{p.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCreating(false)
                        setEditing(p)
                      }}
                      className="rounded-full p-2 text-cream/40 hover:text-gold hover:bg-cream/5 transition-colors"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded-full p-2 text-cream/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <dl className="space-y-2 text-sm flex-1">
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream/50">Cost per flan</dt>
                    <dd className="text-cream/80">{formatMoney(cost)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream/50">Selling price</dt>
                    <dd className="text-cream/80">{formatMoney(p.sellingPrice)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-cream/10 pt-2">
                    <dt className="text-cream/50">Profit per flan</dt>
                    <dd className={profit >= 0 ? 'text-sage font-medium' : 'text-red-300 font-medium'}>
                      {formatMoney(profit)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream/50">Margin</dt>
                    <dd className="text-gold font-medium">{formatPercent(margin)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream/50">Cost per slice ({p.slices} slices)</dt>
                    <dd className="text-cream/80">{formatMoney(cps)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream/50">Slice profit</dt>
                    <dd className={p.slicePrice - cps >= 0 ? 'text-sage font-medium' : 'text-red-300 font-medium'}>
                      {formatMoney(p.slicePrice - cps)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 pt-3 border-t border-cream/10 text-xs text-cream/40">
                  {p.ingredients.length} ingredient{p.ingredients.length === 1 ? '' : 's'} in recipe
                </p>
              </SectionCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
