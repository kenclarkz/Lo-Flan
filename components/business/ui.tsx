'use client'

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('card-surface rounded-2xl p-5 sm:p-7', className)}>
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="display text-2xl sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-cream/50 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const fieldClass =
  'w-full px-3.5 py-2.5 bg-espresso-dark border border-cream/15 rounded-lg text-cream text-sm placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  hint,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label?: string
  hint?: string
  className?: string
}) {
  const inner = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(fieldClass, 'appearance-none pr-8', className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
  if (!label) return inner
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {inner}
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  )
}

export function NumberField({
  value,
  onValue,
  step = 0.01,
  min = 0,
  label,
  hint,
  prefix,
  suffix,
  placeholder,
  className,
}: {
  value: number
  onValue: (value: number) => void
  step?: number
  min?: number
  label?: string
  hint?: string
  prefix?: string
  suffix?: string
  placeholder?: string
  className?: string
}) {
  const [text, setText] = useState<string>(
    Number.isFinite(value) ? String(value) : ''
  )

  useEffect(() => {
    setText((prev) => {
      if (prev.trim() === '' ) return prev
      const parsed = parseFloat(prev)
      if (!Number.isFinite(parsed)) return prev
      return Number.isFinite(value) && Math.abs(parsed - value) > 1e-9 ? String(value) : prev
    })
  }, [value])

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw.trim() === '') {
      onValue(0)
      return
    }
    const parsed = parseFloat(raw)
    if (Number.isFinite(parsed)) onValue(Math.max(min, parsed))
  }

  const inner = (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gold">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          fieldClass,
          prefix && 'pl-8',
          suffix && 'pr-8',
          className
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-cream/40">
          {suffix}
        </span>
      )}
    </div>
  )

  if (!label) return inner
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      {inner}
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  )
}

export function Button({
  children,
  variant = 'ghost',
  className,
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary:
      'bg-gold text-espresso hover:bg-gold-light disabled:opacity-50',
    ghost:
      'border border-cream/25 text-cream hover:border-gold hover:text-gold disabled:opacity-50',
    danger:
      'border border-red-400/30 text-red-300 hover:border-red-400 hover:text-red-200 disabled:opacity-50',
    subtle:
      'bg-cream/[0.06] border border-cream/15 text-cream hover:bg-cream/10 disabled:opacity-50',
  }[variant]
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-all duration-300',
        styles,
        className
      )}
    >
      {children}
    </button>
  )
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: 'gold' | 'positive' | 'negative' | 'muted'
  className?: string
}) {
  const accentClass = {
    gold: 'text-gold',
    positive: 'text-sage',
    negative: 'text-red-300',
    muted: 'text-cream/80',
  }[accent ?? 'gold']
  return (
    <div className={cn('card-surface rounded-2xl p-5', className)}>
      <p className="eyebrow mb-2">{label}</p>
      <p className={cn('display text-2xl sm:text-3xl truncate', accentClass)}>
        {value}
      </p>
      {sub && <div className="mt-1 text-xs text-cream/45">{sub}</div>}
    </div>
  )
}

export function Money({
  value,
  digits = 2,
  className,
}: {
  value: number
  digits?: number
  className?: string
}) {
  return <span className={className}>{formatMoneyLocal(value, digits)}</span>
}

function formatMoneyLocal(value: number, digits: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)
}

export function Bar({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
      <div
        className={cn('h-full rounded-full transition-all duration-500', className ?? 'bg-gold')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
