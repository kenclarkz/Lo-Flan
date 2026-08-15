'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Boxes,
  CakeSlice,
  Check,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  Layers,
  LogOut,
  Receipt,
  RotateCcw,
  TrendingUp,
  Upload,
  Wheat,
} from 'lucide-react'
import { isAuthed, logout } from '@/lib/admin'
import {
  loadBusinessData,
  saveBusinessData,
  seedBusinessData,
  type BusinessData,
} from '@/lib/business'
import { cn } from '@/lib/utils'
import { DashboardTab } from '@/components/business/DashboardTab'
import { IngredientsTab } from '@/components/business/IngredientsTab'
import { VariationsTab } from '@/components/business/VariationsTab'
import { BatchTab } from '@/components/business/BatchTab'
import { SliceTab } from '@/components/business/SliceTab'
import { ExpensesTab } from '@/components/business/ExpensesTab'
import { ProfitTab } from '@/components/business/ProfitTab'

type TabKey = 'dashboard' | 'ingredients' | 'variations' | 'batch' | 'slices' | 'expenses' | 'profit'

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'ingredients', label: 'Ingredients', icon: Wheat },
  { key: 'variations', label: 'Variations', icon: Boxes },
  { key: 'batch', label: 'Batch', icon: Layers },
  { key: 'slices', label: 'Slices', icon: CakeSlice },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'profit', label: 'Profit', icon: TrendingUp },
]

const noticeClass =
  'mb-8 flex items-center gap-2 text-sm text-cream bg-gold/10 border border-gold/30 rounded-lg px-4 py-3'

export default function BusinessSuitePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<BusinessData>(() => seedBusinessData())
  const [loaded, setLoaded] = useState(false)
  const [active, setActive] = useState<TabKey>('dashboard')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/admin')
      return
    }
    setData(loadBusinessData())
    setLoaded(true)
  }, [router])

  useEffect(() => {
    if (!loaded) return
    saveBusinessData(data)
  }, [data, loaded])

  const flash = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 4000)
  }, [])

  const handleChange = useCallback((next: BusinessData) => {
    setData(next)
  }, [])

  const handleReset = () => {
    if (!window.confirm('Reset all business data to the default sample data? This cannot be undone.')) {
      return
    }
    setData(seedBusinessData())
    flash('Business data reset to defaults.')
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `los-flan-business-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Backup exported.')
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<BusinessData>
        if (!Array.isArray(parsed.ingredients) && !Array.isArray(parsed.products)) {
          flash('That file does not look like a Business Suite backup.')
          return
        }
        const seed = seedBusinessData()
        setData({
          ...seed,
          ...parsed,
          ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : seed.ingredients,
          products: Array.isArray(parsed.products) ? parsed.products : seed.products,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seed.expenses,
          sales: Array.isArray(parsed.sales) ? parsed.sales : seed.sales,
          version: seed.version,
        })
        flash('Business data imported.')
      } catch {
        flash('Could not read that file.')
      }
    }
    reader.readAsText(file)
  }

  const tabBody = useMemo(() => {
    switch (active) {
      case 'ingredients':
        return <IngredientsTab data={data} onChange={handleChange} flash={flash} />
      case 'variations':
        return <VariationsTab data={data} onChange={handleChange} flash={flash} />
      case 'batch':
        return <BatchTab data={data} onChange={handleChange} />
      case 'slices':
        return <SliceTab data={data} onChange={handleChange} />
      case 'expenses':
        return <ExpensesTab data={data} onChange={handleChange} flash={flash} />
      case 'profit':
        return <ProfitTab data={data} onChange={handleChange} />
      default:
        return <DashboardTab data={data} onChange={handleChange} />
    }
  }, [active, data, handleChange, flash])

  const handleLogout = () => {
    logout()
    router.replace('/admin')
  }

  return (
    <main className="min-h-[100svh] px-4 sm:px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/admin/panel"
                className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Admin panel
              </Link>
            </div>
            <h1 className="display text-4xl">Business Suite</h1>
            <p className="text-sm text-cream/50 mt-1 max-w-2xl">
              Track ingredient costs, variations, batches, slices, expenses and
              profit. Everything recalculates automatically and is saved in this
              browser.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-ghost px-4 py-2.5" title="Download a JSON backup">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost px-4 py-2.5" title="Import a JSON backup">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button onClick={handleReset} className="btn-ghost px-4 py-2.5" title="Reset to sample data">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="btn-ghost px-4 py-2.5">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {notice && (
          <div className={noticeClass}>
            <Check className="w-4 h-4 text-gold flex-shrink-0" />
            {notice}
          </div>
        )}

        <nav
          className="mb-8 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
          aria-label="Business suite sections"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={cn(
                  'inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-all duration-300',
                  isActive
                    ? 'border-gold bg-gold text-espresso'
                    : 'border-cream/20 text-cream/70 hover:border-gold hover:text-gold'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="animate-slide-in" key={active}>
          {tabBody}
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex items-center gap-2 text-xs text-cream/40">
          <CircleDollarSign className="w-3.5 h-3.5" />
          All data is stored locally in this browser via your JSON backup for portability.
        </div>
      </div>
    </main>
  )
}
