'use client'

import { useMemo } from 'react'
import { BarChart3, Crown, TrendingUp } from 'lucide-react'
import {
  aggregateSales,
  expenseTotalByCategory,
  formatMoney,
  formatNumber,
  formatPercent,
  mostProfitable,
  PERIOD_OPTIONS,
  perProductProfits,
  type BusinessData,
  type PeriodKey,
} from '@/lib/business'
import { Bar, SectionCard, SectionHeading, Select, StatCard } from './ui'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  ingredients: 'Ingredients',
  packaging: 'Packaging',
  gas: 'Gas',
  equipment: 'Equipment',
  marketing: 'Marketing',
  other: 'Other',
}

const CATEGORY_BAR: Record<string, string> = {
  ingredients: 'bg-gold',
  packaging: 'bg-caramel-light',
  gas: 'bg-red-300',
  equipment: 'bg-sage',
  marketing: 'bg-blush',
  other: 'bg-cream/40',
}

export function DashboardTab({
  data,
  onChange,
}: {
  data: BusinessData
  onChange: (data: BusinessData) => void
}) {
  const summary = useMemo(() => aggregateSales(data), [data])
  const byCategory = useMemo(() => expenseTotalByCategory(data), [data])
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.total))
  const topProducts = useMemo(() => mostProfitable(data, 5), [data])
  const rows = useMemo(() => perProductProfits(data), [data])
  const maxRevenue = Math.max(1, summary.totalRevenue)

  const revenueParts = [
    { label: 'Whole flans', value: summary.wholeRevenue },
    { label: 'Slices', value: summary.sliceRevenue },
    { label: 'Other products', value: summary.otherRevenue },
  ]

  const setPeriod = (period: PeriodKey) => onChange({ ...data, period })

  return (
    <div>
      <SectionHeading
        eyebrow="Business Suite"
        title="Dashboard"
        description="A live overview of your flan business — revenue, costs, profit, margins, products sold and the most profitable items."
        actions={
          <Select
            value={data.period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
            className="py-2 text-xs sm:w-40"
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard label="Revenue" value={formatMoney(summary.totalRevenue)} accent="gold" sub={`${formatMoney(summary.wholeRevenue)} whole + ${formatMoney(summary.sliceRevenue)} slices + ${formatMoney(summary.otherRevenue)} other`} />
        <StatCard label="Production cost" value={formatMoney(summary.productionCost)} accent="muted" sub="Ingredients + packaging sold" />
        <StatCard label="Expenses" value={formatMoney(summary.expenses)} accent="muted" sub="Tracker total, selected period" />
        <StatCard label="Products sold" value={formatNumber(summary.productsSold, 0)} sub={`${formatNumber(summary.flansSold, 0)} flans · ${formatNumber(summary.slicesSold, 0)} slices`} />
        <StatCard label="Gross profit" value={formatMoney(summary.grossProfit)} accent={summary.grossProfit >= 0 ? 'positive' : 'negative'} sub={`${formatPercent(summary.grossMarginPercent)} gross margin`} />
        <StatCard label="Net profit" value={formatMoney(summary.netProfit)} accent={summary.netProfit >= 0 ? 'positive' : 'negative'} sub={`${formatPercent(summary.netMarginPercent)} net margin`} />
        <StatCard label="Gross margin" value={formatPercent(summary.grossMarginPercent)} sub="(revenue − cost) ÷ revenue" />
        <StatCard label="Net margin" value={formatPercent(summary.netMarginPercent)} sub="(revenue − cost − expenses) ÷ revenue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard>
          <h3 className="eyebrow mb-4">Revenue split</h3>
          <ul className="space-y-4">
            {revenueParts.map((part) => (
              <li key={part.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-cream/60">{part.label}</span>
                  <span className="text-cream/80">
                    {formatMoney(part.value)}
                    {' · '}
                    <span className="text-cream/40">
                      {summary.totalRevenue > 0
                        ? formatPercent((part.value / summary.totalRevenue) * 100, 0)
                        : '0%'}
                    </span>
                  </span>
                </div>
                <Bar value={part.value} max={maxRevenue} />
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-cream/10 flex items-center justify-between text-sm">
            <span className="eyebrow">Total revenue</span>
            <span className="display text-lg text-gold">{formatMoney(summary.totalRevenue)}</span>
          </div>
        </SectionCard>

        <SectionCard>
          <h3 className="eyebrow mb-4">Expenses by category</h3>
          {summary.expenses === 0 ? (
            <p className="text-sm text-cream/40">
              No expenses in the selected period. Track them in the Expenses tab.
            </p>
          ) : (
            <ul className="space-y-4">
              {byCategory
                .filter((c) => c.total > 0)
                .map((c) => (
                  <li key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-cream/60">{CATEGORY_LABELS[c.category]}</span>
                      <span className="text-cream/80">
                        {formatMoney(c.total)}
                        {' · '}
                        <span className="text-cream/40">
                          {formatPercent((c.total / summary.expenses) * 100, 0)}
                        </span>
                      </span>
                    </div>
                    <Bar value={c.total} max={maxCategory} className={CATEGORY_BAR[c.category]} />
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard>
          <div className="mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold" />
            <h3 className="eyebrow">Most profitable products</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-cream/40">
              Enter sales in the Profit tab to see what&apos;s making you money.
            </p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.product.id} className="rounded-xl bg-espresso-dark border border-cream/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                        i === 0 ? 'bg-gold text-espresso' : 'bg-cream/10 text-cream/60'
                      )}>
                        {i + 1}
                      </span>
                      <span className="font-medium truncate">
                        {p.product.emoji ?? ''} {p.product.name}
                      </span>
                    </div>
                    <span className={cn('font-medium', p.profit >= 0 ? 'text-sage' : 'text-red-300')}>
                      {formatMoney(p.profit)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-cream/45">
                    <span className="flex-1">
                      <Bar
                        value={p.profit}
                        max={Math.max(1, ...topProducts.map((x) => x.profit))}
                        className={p.profit >= 0 ? 'bg-sage' : 'bg-red-300'}
                      />
                    </span>
                    <span>{formatPercent(p.marginPercent, 0)} margin</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold" />
            <h3 className="eyebrow">Products sold</h3>
          </div>
          {rows.filter((r) => r.flansSold + r.slicesSold > 0).length === 0 ? (
            <p className="text-sm text-cream/40">
              Enter sales in the Profit tab to populate this list.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows
                .filter((r) => r.flansSold + r.slicesSold > 0)
                .map((r) => (
                  <li key={r.product.id} className="flex items-center justify-between gap-3 rounded-xl bg-espresso-dark border border-cream/10 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.product.emoji ?? ''} {r.product.name}</p>
                      <p className="text-xs text-cream/45">
                        {formatNumber(r.flansSold, 0)} whole · {formatNumber(r.slicesSold, 0)} slices
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-medium">{formatMoney(r.totalRevenue)}</p>
                      <p className="text-xs text-cream/45">{formatMoney(r.profit)} profit</p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-cream/35">
        <TrendingUp className="w-3.5 h-3.5" />
        Everything updates automatically — change a price, recipe, batch quantity or expense and this dashboard recalculates instantly.
      </p>
    </div>
  )
}
