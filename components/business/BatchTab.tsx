'use client'

import { useMemo, useState } from 'react'
import { Calculator, Layers } from 'lucide-react'
import {
  batchCost,
  formatMoney,
  formatNumber,
  type BusinessData,
} from '@/lib/business'
import { Button, NumberField, SectionCard, SectionHeading, Select, StatCard } from './ui'

export function BatchTab({
  data,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
}) {
  const [productId, setProductId] = useState<string>(
    data.products[0]?.id ?? ''
  )
  const [quantity, setQuantity] = useState(12)

  const product = data.products.find((p) => p.id === productId)

  const result = useMemo(
    () =>
      product
        ? batchCost(product, data.ingredients, data.packagingPerFlan, quantity)
        : null,
    [product, data.ingredients, data.packagingPerFlan, quantity]
  )

  const suggested = useMemo(() => {
    if (!result) return []
    return [
      { margin: 50, price: result.fullCostPerFlan / (1 - 0.5) },
      { margin: 60, price: result.fullCostPerFlan / (1 - 0.6) },
      { margin: 70, price: result.fullCostPerFlan / (1 - 0.7) },
      { margin: 80, price: result.fullCostPerFlan / (1 - 0.8) },
    ]
  }, [result])

  const quickTable = useMemo(() => {
    if (!product) return []
    return [1, 2, 5, 10, 20, 50].map((q) =>
      batchCost(product, data.ingredients, data.packagingPerFlan, q)
    )
  }, [product, data.ingredients, data.packagingPerFlan])

  if (data.products.length === 0) {
    return (
      <div>
        <SectionHeading
          eyebrow="Business Suite"
          title="Batch Calculator"
          description="Calculate the ingredient cost of making many flans at once."
        />
        <SectionCard>
          <Layers className="w-8 h-8 text-gold/50 mb-3" />
          <p className="text-sm text-cream/40">
            Create a variation first — the batch calculator works from its recipe cost.
          </p>
        </SectionCard>
      </div>
    )
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Batch Calculator"
        description="Enter how many flans you're making and see the full ingredient cost — it recalculates live with any price, recipe or packaging change."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SectionCard>
          <div className="space-y-4">
            <Select
              label="Variation"
              value={productId}
              onChange={setProductId}
              options={data.products.map((p) => ({
                value: p.id,
                label: `${p.emoji ?? ''} ${p.name}`,
              }))}
            />
            <NumberField
              label="Number of flans"
              value={quantity}
              onValue={(v) => setQuantity(Math.round(v))}
              step={1}
              min={0}
              suffix="flans"
            />
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label="Cost per flan"
            value={formatMoney(result?.fullCostPerFlan ?? 0)}
            sub={
              <>
                {formatMoney(result?.costPerFlan ?? 0)} ingredients +{' '}
                {formatMoney(result?.packagingPerFlan ?? 0)} packaging
              </>
            }
          />
          <StatCard
            label="Total batch cost"
            value={formatMoney(result?.total ?? 0)}
            sub={`${formatNumber(quantity, 0)} flans`}
            accent="gold"
          />
          <StatCard
            label="Cost per slice"
            value={formatMoney(result && product ? result.fullCostPerFlan / (product.slices || 1) : 0)}
            sub={`${product?.slices ?? 0} slices per flan`}
            accent="muted"
          />
          <StatCard
            label="Revenue at list price"
            value={formatMoney((result?.total ?? 0) ? (product?.sellingPrice ?? 0) * quantity : 0)}
            sub={`${formatMoney(product?.sellingPrice ?? 0)} / whole flan`}
            accent="positive"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard>
          <h3 className="eyebrow mb-4">Suggested selling prices</h3>
          <p className="text-sm text-cream/50 mb-4">
            Minimum price per whole flan to hit a target margin on this batch.
          </p>
          <ul className="space-y-2">
            {suggested.map((s) => (
              <li
                key={s.margin}
                className="flex items-center justify-between rounded-lg bg-espresso-dark border border-cream/10 px-4 py-2.5 text-sm"
              >
                <span className="text-cream/60">{s.margin}% margin</span>
                <span className="text-gold font-medium">{formatMoney(s.price)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard>
          <h3 className="eyebrow mb-4">Quick batch sizes</h3>
          <ul className="space-y-2">
            {quickTable.map((b) => (
              <li
                key={b.quantity}
                className="flex items-center justify-between rounded-lg bg-espresso-dark border border-cream/10 px-4 py-2.5 text-sm"
              >
                <span className="text-cream/60">
                  {b.quantity} flan{b.quantity === 1 ? '' : 's'}
                </span>
                <span className="text-cream/80">{formatMoney(b.total)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-cream/35">
        <Calculator className="w-3.5 h-3.5" />
        Packaging cost per flan is set in the Profit &amp; dashboard settings. Change it there
        and every batch updates instantly.
      </p>
    </div>
  )
}
