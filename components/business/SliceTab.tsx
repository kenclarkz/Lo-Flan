'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pizza } from 'lucide-react'
import {
  formatMoney,
  formatNumber,
  productFullCostPerFlan,
  sliceCost,
  sliceProfit,
  type BusinessData,
} from '@/lib/business'
import { NumberField, SectionCard, SectionHeading, Select, StatCard } from './ui'

export function SliceTab({
  data,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
}) {
  const [productId, setProductId] = useState<string>(data.products[0]?.id ?? '')
  const [slices, setSlices] = useState(data.products[0]?.slices ?? 8)
  const [slicePrice, setSlicePrice] = useState(data.products[0]?.slicePrice ?? 0)
  const [slicesSold, setSlicesSold] = useState(10)

  const product = data.products.find((p) => p.id === productId)

  useEffect(() => {
    if (!product && data.products.length > 0) {
      setProductId(data.products[0].id)
      return
    }
    if (!product) return
    setSlices(product.slices || 8)
    setSlicePrice(product.slicePrice)
  }, [product, data.products])

  const fullCostPerFlan = useMemo(
    () =>
      product
        ? productFullCostPerFlan(product, data.ingredients, data.packagingPerFlan)
        : 0,
    [product, data.ingredients, data.packagingPerFlan]
  )

  const costPerSlice = sliceCost(fullCostPerFlan, slices)
  const profitPerSlice = slicePrice - costPerSlice
  const revenue = slicesSold * slicePrice
  const costSold = slicesSold * costPerSlice
  const profit = sliceProfit(slicesSold, slicePrice, costPerSlice)

  if (data.products.length === 0) {
    return (
      <div>
        <SectionHeading
          eyebrow="Business Suite"
          title="Slice Calculator"
          description="Work out the cost, price, revenue and profit of selling flan by the slice."
        />
        <SectionCard>
          <Pizza className="w-8 h-8 text-gold/50 mb-3" />
          <p className="text-sm text-cream/40">
            Create a variation first — the slice calculator builds from its recipe cost.
          </p>
        </SectionCard>
      </div>
    )
  }

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Slice Calculator"
        description="Cost per slice, selling price, revenue and profit — every number recalculates as you change price or portion size."
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
              label="Slices per flan"
              value={slices}
              onValue={(v) => setSlices(Math.max(1, Math.round(v)))}
              step={1}
              min={1}
              suffix="slices"
            />
            <NumberField
              label="Selling price per slice"
              value={slicePrice}
              onValue={setSlicePrice}
              prefix="$"
            />
            <NumberField
              label="Slices sold"
              value={slicesSold}
              onValue={(v) => setSlicesSold(Math.round(v))}
              step={1}
              min={0}
              suffix="slices"
            />
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard
            label="Cost per slice"
            value={formatMoney(costPerSlice)}
            sub={`${formatMoney(fullCostPerFlan)} cost per whole flan / ${slices} slices`}
            accent="muted"
          />
          <StatCard
            label="Profit per slice"
            value={formatMoney(profitPerSlice)}
            sub={`${formatMoney(slicePrice)} price − ${formatMoney(costPerSlice)} cost`}
            accent={profitPerSlice >= 0 ? 'positive' : 'negative'}
          />
          <StatCard
            label="Slice revenue"
            value={formatMoney(revenue)}
            sub={`${formatNumber(slicesSold, 0)} slices × ${formatMoney(slicePrice)}`}
          />
          <StatCard
            label="Slice profit"
            value={formatMoney(profit)}
            sub={`${formatMoney(revenue)} − ${formatMoney(costSold)} cost`}
            accent={profit >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      <SectionCard>
        <h3 className="eyebrow mb-4">Whole flan comparison</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="eyebrow mb-1">Cost per flan</p>
            <p className="display text-xl">{formatMoney(fullCostPerFlan)}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">Whole flan price</p>
            <p className="display text-xl">{formatMoney(product?.sellingPrice ?? 0)}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">Equivalent flans sold</p>
            <p className="display text-xl">{formatNumber(Math.ceil(slicesSold / Math.max(1, slices)), 0)}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-cream/40">
          For comparison: {formatNumber(slicesSold, 0)} slices at {formatMoney(slicePrice)}{' '}
          earns {formatMoney(revenue)}. Selling whole flans at {formatMoney(product?.sellingPrice ?? 0)}{' '}
          would need about {formatNumber(Math.ceil(slicesSold / Math.max(1, slices)), 0)} flan
          {Math.ceil(slicesSold / Math.max(1, slices)) === 1 ? '' : 's'} for similar volume.
        </p>
      </SectionCard>
    </div>
  )
}
