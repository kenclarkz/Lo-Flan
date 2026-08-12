'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { login, isAuthed } from '@/lib/admin'

export function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthed()) router.replace('/admin/panel')
  }, [router])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }
    setSubmitting(true)
    if (login(username.trim(), password)) {
      router.replace('/admin/panel')
    } else {
      setError('Incorrect username or password.')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to site
        </Link>

        <div className="card-surface rounded-2xl p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <h1 className="display text-3xl mb-2">Admin Login</h1>
            <p className="text-sm text-cream/50">
              Restricted area — staff only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="admin-username" className="eyebrow mb-2 block">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-espresso-dark border border-cream/15 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="eyebrow mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-espresso-dark border border-cream/15 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-gold transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
