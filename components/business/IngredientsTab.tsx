'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import {
  ingredientCostPerFlan,
  ingredientPricePerUnit,
  formatMoney,
  formatNumber,
  uid,
  type BusinessData,
  type Ingredient,
} from '@/lib/business'
import { Button, Field, NumberField, SectionCard, SectionHeading, Select, TextInput } from './ui'

const CATEGORIES = ['Dairy', 'Pantry', 'Flavor', 'Topping', 'Packaging', 'Other']

type Draft = Omit<Ingredient, 'id'>

const emptyDraft: Draft = {
  name: '',
  category: 'Dairy',
  unit: 'unit',
  packageSize: 1,
  packagePrice: 0,
  amountPerFlan: 1,
}

function IngredientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Ingredient | null
  onSave: (ingredient: Ingredient) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(
    initial
      ? { ...initial }
      : emptyDraft
  )
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const pricePerUnit = ingredientPricePerUnit(draft)
  const costPerFlan = ingredientCostPerFlan(draft)

  const submit = () => {
    if (!draft.name.trim()) return
    onSave({ ...draft, id: initial?.id ?? uid('ing-'), name: draft.name.trim() })
  }

  return (
    <SectionCard className="mb-6 border-gold/25">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="display text-xl">
          {initial ? 'Edit ingredient' : 'New ingredient'}
        </h3>
        <button
          onClick={onCancel}
          className="text-cream/40 hover:text-gold transition-colors"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <TextInput
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Condensed milk"
            aria-label="Ingredient name"
            autoFocus
          />
        </div>
        <Select
          label="Category"
          value={draft.category}
          onChange={(v) => set('category', v)}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <TextInput
          value={draft.unit}
          onChange={(e) => set('unit', e.target.value)}
          placeholder="unit (can, cup, tsp, oz…)"
          aria-label="Unit"
        />
        <NumberField
          label="Package size (units)"
          value={draft.packageSize}
          onValue={(v) => set('packageSize', v)}
          step={0.01}
          min={0}
          suffix={draft.unit || 'unit'}
        />
        <NumberField
          label="Package price"
          value={draft.packagePrice}
          onValue={(v) => set('packagePrice', v)}
          step={0.01}
          prefix="$"
        />
        <NumberField
          label="Amount used per flan"
          value={draft.amountPerFlan}
          onValue={(v) => set('amountPerFlan', v)}
          step={0.01}
          suffix={draft.unit || 'unit'}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-cream/60">
          Price per {draft.unit || 'unit'}:{' '}
          <span className="text-gold font-medium">{formatMoney(pricePerUnit)}</span>
          {' · '}Cost per flan:{' '}
          <span className="text-gold font-medium">{formatMoney(costPerFlan)}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={!draft.name.trim()}
          >
            {initial ? 'Save changes' : 'Add ingredient'}
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}

export function IngredientsTab({
  data,
  onChange,
  flash,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
  flash?: (msg: string) => void
}) {
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.ingredients
    return data.ingredients.filter((i) =>
      `${i.name} ${i.category} ${i.unit}`.toLowerCase().includes(q)
    )
  }, [data.ingredients, query])

  const totalCostPerFlan = useMemo(
    () => data.ingredients.reduce((sum, i) => sum + ingredientCostPerFlan(i), 0),
    [data.ingredients]
  )

  const save = (ingredient: Ingredient) => {
    const exists = data.ingredients.some((i) => i.id === ingredient.id)
    const ingredients = exists
      ? data.ingredients.map((i) => (i.id === ingredient.id ? ingredient : i))
      : [...data.ingredients, ingredient]
    onChange({ ...data, ingredients })
    setEditing(null)
    setCreating(false)
    flash?.(exists ? 'Ingredient updated.' : 'Ingredient added.')
  }

  const remove = (id: string) => {
    const ingredients = data.ingredients.filter((i) => i.id !== id)
    const products = data.products.map((p) => ({
      ...p,
      ingredients: p.ingredients.filter((r) => r.ingredientId !== id),
    }))
    onChange({ ...data, ingredients, products })
    if (editing?.id === id) setEditing(null)
    flash?.('Ingredient removed.')
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Ingredient Manager"
        description="Track what each ingredient costs per package and per flan. The price per unit and cost per flan recalculate automatically as you type."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setCreating(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add ingredient
          </Button>
        }
      />

      {(creating || editing) && (
        <IngredientForm
          initial={editing}
          onSave={save}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-cream/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients…"
            className="w-full pl-10 pr-3.5 py-2.5 bg-espresso-dark border border-cream/15 rounded-lg text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>
        <p className="text-sm text-cream/60">
          {data.ingredients.length} ingredient{data.ingredients.length === 1 ? '' : 's'}
          {' · '}
          <span className="text-gold">Cost per flan (all): {formatMoney(totalCostPerFlan)}</span>
        </p>
      </div>

      {data.ingredients.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-cream/40">
            No ingredients yet. Add your first one to start tracking costs.
          </p>
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-cream/40">No ingredients match “{query}”.</p>
        </SectionCard>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((ing) => {
            const perUnit = ingredientPricePerUnit(ing)
            const perFlan = ingredientCostPerFlan(ing)
            return (
              <li
                key={ing.id}
                className="card-surface rounded-xl px-4 py-3.5 sm:px-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{ing.name}</p>
                  <p className="text-xs text-cream/40 capitalize">
                    {ing.category} · {ing.unit}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4 lg:flex lg:items-center lg:gap-8">
                  <div>
                    <p className="eyebrow mb-0.5">Package</p>
                    <p className="text-cream/70">
                      {formatNumber(ing.packageSize, 2)} {ing.unit} @{' '}
                      {formatMoney(ing.packagePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Per {ing.unit}</p>
                    <p className="text-cream/70">{formatMoney(perUnit)}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Per flan</p>
                    <p className="text-cream/70">
                      {formatNumber(ing.amountPerFlan, 2)} {ing.unit}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-0.5">Cost / flan</p>
                    <p className="text-gold font-medium">{formatMoney(perFlan)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 lg:justify-end">
                  <button
                    onClick={() => {
                      setCreating(false)
                      setEditing(ing)
                    }}
                    className="rounded-full p-2 text-cream/40 hover:text-gold hover:bg-cream/5 transition-colors"
                    aria-label={`Edit ${ing.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(ing.id)}
                    className="rounded-full p-2 text-cream/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label={`Delete ${ing.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-4 text-xs text-cream/35">
        Tip: a package size of 1 can with a per-can price means “price per can”.
        Anything that is used in a flan will automatically feed into variations,
        batch and profit calculations.
      </p>
    </div>
  )
}
