'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Receipt, Trash2, X } from 'lucide-react'
import {
  EXPENSE_CATEGORIES,
  expenseTotalByCategory,
  formatMoney,
  totalExpenses,
  uid,
  type BusinessData,
  type Expense,
  type ExpenseCategory,
} from '@/lib/business'
import { Button, Field, NumberField, SectionCard, SectionHeading, Select, TextInput, Bar } from './ui'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: 'Ingredients',
  packaging: 'Packaging',
  gas: 'Gas',
  equipment: 'Equipment',
  marketing: 'Marketing',
  other: 'Other',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ingredients: 'bg-gold',
  packaging: 'bg-caramel-light',
  gas: 'bg-red-300',
  equipment: 'bg-sage',
  marketing: 'bg-blush',
  other: 'bg-cream/40',
}

interface Draft {
  name: string
  category: ExpenseCategory
  amount: number
  date: string
}

const today = () => new Date().toISOString().slice(0, 10)

function ExpenseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Expense | null
  onSave: (expense: Expense) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(
    initial
      ? { name: initial.name, category: initial.category, amount: initial.amount, date: initial.date }
      : { name: '', category: 'ingredients', amount: 0, date: today() }
  )

  const submit = () => {
    if (!draft.name.trim() || draft.amount <= 0) return
    onSave({
      id: initial?.id ?? uid('exp-'),
      name: draft.name.trim(),
      category: draft.category,
      amount: draft.amount,
      date: draft.date || today(),
    })
  }

  return (
    <SectionCard className="mb-6 border-gold/25">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="display text-xl">
          {initial ? 'Edit expense' : 'New expense'}
        </h3>
        <button
          onClick={onCancel}
          className="text-cream/40 hover:text-gold transition-colors"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Description">
          <TextInput
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Oven gas refill"
            autoFocus
          />
        </Field>
        <Select
          label="Category"
          value={draft.category}
          onChange={(v) => setDraft((d) => ({ ...d, category: v as ExpenseCategory }))}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
        />
        <NumberField
          label="Amount"
          value={draft.amount}
          onValue={(v) => setDraft((d) => ({ ...d, amount: v }))}
          prefix="$"
        />
        <Field label="Date">
          <TextInput
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
        </Field>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={!draft.name.trim() || draft.amount <= 0}>
          {initial ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </SectionCard>
  )
}

export function ExpensesTab({
  data,
  onChange,
  flash,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
  flash?: (msg: string) => void
}) {
  const [editing, setEditing] = useState<Expense | null>(null)
  const [creating, setCreating] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const total = useMemo(() => totalExpenses(data), [data])
  const byCategory = useMemo(() => expenseTotalByCategory(data), [data])
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.total))

  const filtered = useMemo(() => {
    const list = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date))
    if (categoryFilter === 'all') return list
    return list.filter((e) => e.category === categoryFilter)
  }, [data.expenses, categoryFilter])

  const save = (expense: Expense) => {
    const exists = data.expenses.some((e) => e.id === expense.id)
    const expenses = exists
      ? data.expenses.map((e) => (e.id === expense.id ? expense : e))
      : [...data.expenses, expense]
    onChange({ ...data, expenses })
    setEditing(null)
    setCreating(false)
    flash?.(exists ? 'Expense updated.' : 'Expense added.')
  }

  const remove = (id: string) => {
    onChange({ ...data, expenses: data.expenses.filter((e) => e.id !== id) })
    if (editing?.id === id) setEditing(null)
    flash?.('Expense removed.')
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Expense Tracker"
        description="Log everything that costs money — ingredients, packaging, gas, equipment, marketing and more. Totals feed straight into the profit calculator and dashboard."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setCreating(true)
            }}
          >
            <Plus className="w-4 h-4" />
            Add expense
          </Button>
        }
      />

      {(creating || editing) && (
        <ExpenseForm
          initial={editing}
          onSave={save}
          onCancel={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SectionCard>
          <p className="eyebrow mb-2">Total expenses</p>
          <p className="display text-3xl text-gold">{formatMoney(total)}</p>
          <p className="mt-1 text-xs text-cream/45">for the selected period</p>
        </SectionCard>

        <SectionCard className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="eyebrow">By category</h3>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All categories' },
                ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
              ]}
              className="py-2 text-xs sm:w-44"
            />
          </div>
          <ul className="space-y-2.5">
            {byCategory.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-cream/60">{CATEGORY_LABELS[c.category]}</span>
                  <span className="text-cream/80">{formatMoney(c.total)}</span>
                </div>
                <Bar value={c.total} max={maxCategory} className={CATEGORY_COLORS[c.category]} />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {data.expenses.length === 0 ? (
        <SectionCard>
          <Receipt className="w-8 h-8 text-gold/50 mb-3" />
          <p className="text-sm text-cream/40">
            No expenses logged yet. Add your first one above.
          </p>
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-cream/40">No expenses match this category.</p>
        </SectionCard>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="card-surface rounded-xl px-4 py-3.5 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6"
            >
              <span
                className={cn('h-2 w-2 rounded-full flex-shrink-0', CATEGORY_COLORS[e.category])}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{e.name}</p>
                <p className="text-xs text-cream/40">
                  {CATEGORY_LABELS[e.category]} ·{' '}
                  {new Date(`${e.date}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <p className="text-lg font-medium text-cream">{formatMoney(e.amount)}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setCreating(false)
                    setEditing(e)
                  }}
                  className="rounded-full p-2 text-cream/40 hover:text-gold hover:bg-cream/5 transition-colors"
                  aria-label={`Edit ${e.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-full p-2 text-cream/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  aria-label={`Delete ${e.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
