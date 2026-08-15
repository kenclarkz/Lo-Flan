'use client'

import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  aggregateSales,
  formatMoney,
  formatNumber,
  formatPercent,
  perProductProfits,
  PERIOD_OPTIONS,
  type BusinessData,
  type PeriodKey,
} from '@/lib/business'
import { NumberField, SectionCard, SectionHeading, Select, StatCard } from './ui'

export function ProfitTab({
  data,
  onChange,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
}) {
  const summary = useMemo(() => aggregateSales(data), [data])
  const rows = useMemo(() => perProductProfits(data), [data])

  const setSalesEntry = (productId: string, patch: { flansSold?: number; slicesSold?: number }) => {
    onChange({
      ...data,
      sales: data.sales.map((s) =>
        s.productId === productId ? { ...s, ...patch } : s
      ),
    })
  }

  const setProductField = (
    productId: string,
    patch: { sellingPrice?: number; slicePrice?: number }
  ) => {
    onChange({
      ...data,
      products: data.products.map((p) =>
        p.id === productId ? { ...p, ...patch } : p
      ),
    })
  }

  const setPeriod = (period: PeriodKey) => onChange({ ...data, period })

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Profit Calculator"
        description="Enter how much you sell, and see revenue, production cost, expenses, gross &amp; net profit and margins — all recalculated live."
        actions={
          <Select
            value={data.period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
            className="py-2 text-xs sm:w-40"
          />
        }
      />

      <SectionCard className="mb-6">
        <h3 className="eyebrow mb-4">Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField
            label="Packaging cost per flan"
            value={data.packagingPerFlan}
            onValue={(v) => onChange({ ...data, packagingPerFlan: v })}
            prefix="$"
            hint="Added to every flan in all calculations."
          />
          <NumberField
            label="Other products — revenue"
            value={data.otherRevenue}
            onValue={(v) => onChange({ ...data, otherRevenue: v })}
            prefix="$"
            hint="Cakes, gift boxes, catering, etc."
          />
          <NumberField
            label="Other products — production cost"
            value={data.otherCost}
            onValue={(v) => onChange({ ...data, otherCost: v })}
            prefix="$"
            hint="Ingredient + packaging cost for those items."
          />
        </div>
      </SectionCard>

      <SectionCard className="mb-6">
        <h3 className="eyebrow mb-4">Sales</h3>
        {data.products.length === 0 ? (
          <p className="text-sm text-cream/40">
            Create variations to start entering sales.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.products.map((p) => {
              const sale = data.sales.find((s) => s.productId === p.id)
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-espresso-dark border border-cream/10 px-4 py-3.5 items-end"
                >
                  <div className="col-span-2 sm:col-span-1 self-center">
                    <p className="font-medium truncate">
                      {p.emoji ?? ''} {p.name}
                    </p>
                    <p className="text-xs text-cream/40">
                      Cost {formatMoney(rows.find((r) => r.product.id === p.id)?.costPerFlan ?? 0)} / flan
                    </p>
                  </div>
                  <NumberField
                    label="Whole flans sold"
                    value={sale?.flansSold ?? 0}
                    onValue={(v) => setSalesEntry(p.id, { flansSold: Math.round(v) })}
                    step={1}
                  />
                  <NumberField
                    label="Slices sold"
                    value={sale?.slicesSold ?? 0}
                    onValue={(v) => setSalesEntry(p.id, { slicesSold: Math.round(v) })}
                    step={1}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Whole price"
                      value={p.sellingPrice}
                      onValue={(v) => setProductField(p.id, { sellingPrice: v })}
                      prefix="$"
                    />
                    <NumberField
                      label="Slice price"
                      value={p.slicePrice}
                      onValue={(v) => setProductField(p.id, { slicePrice: v })}
                      prefix="$"
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-6">
        <StatCard label="Revenue" value={formatMoney(summary.totalRevenue)} sub={`${formatMoney(summary.wholeRevenue)} whole + ${formatMoney(summary.sliceRevenue)} slices + ${formatMoney(summary.otherRevenue)} other`} accent="gold" />
        <StatCard label="Production cost" value={formatMoney(summary.productionCost)} sub="Ingredients + packaging for everything sold" accent="muted" />
        <StatCard label="Gross profit" value={formatMoney(summary.grossProfit)} sub={`${formatPercent(summary.grossMarginPercent)} gross margin`} accent={summary.grossProfit >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Expenses" value={formatMoney(summary.expenses)} sub="From the expense tracker (selected period)" accent="muted" />
        <StatCard label="Net profit" value={formatMoney(summary.netProfit)} sub={`${formatPercent(summary.netMarginPercent)} net margin`} accent={summary.netProfit >= 0 ? 'positive' : 'negative'} />
        <StatCard label="Products sold" value={formatNumber(summary.productsSold, 0)} sub={`${formatNumber(summary.flansSold, 0)} whole flans + ${formatNumber(summary.slicesSold, 0)} slices`} />
      </div>

      {rows.length > 0 && (
        <SectionCard>
          <h3 className="eyebrow mb-4">Per product</h3>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-cream/40 text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-3 font-normal">Product</th>
                  <th className="pb-3 pr-3 font-normal text-right">Sold</th>
                  <th className="pb-3 pr-3 font-normal text-right">Revenue</th>
                  <th className="pb-3 pr-3 font-normal text-right">Cost</th>
                  <th className="pb-3 pr-3 font-normal text-right">Profit</th>
                  <th className="pb-3 font-normal text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.product.id} className="border-t border-cream/10">
                    <td className="py-3 pr-3 text-cream/80">
                      {r.product.emoji ?? ''} {r.product.name}
                    </td>
                    <td className="py-3 pr-3 text-right text-cream/60">
                      {formatNumber(r.flansSold, 0)} whole · {formatNumber(r.slicesSold, 0)} slice
                    </td>
                    <td className="py-3 pr-3 text-right text-cream/80">{formatMoney(r.totalRevenue)}</td>
                    <td className="py-3 pr-3 text-right text-cream/60">{formatMoney(r.totalCost)}</td>
                    <td className={`py-3 pr-3 text-right font-medium ${r.profit >= 0 ? 'text-sage' : 'text-red-300'}`}>
                      {formatMoney(r.profit)}
                    </td>
                    <td className="py-3 text-right text-gold font-medium">
                      {formatPercent(r.marginPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-cream/35">
        <TrendingUp className="w-3.5 h-3.5" />
        Gross profit = revenue − production cost · Net profit = gross profit − expenses.
        Margins are calculated against revenue.
      </p>
    </div>
  )
}
