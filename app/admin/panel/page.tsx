'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  LineChart,
  Facebook,
  Loader2,
  Lock,
  LogOut,
  MonitorPlay,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  deleteVideo,
  formatBytes,
  getLibrary,
  getMessengerLink,
  getScrollSelection,
  getVideoBlob,
  isAuthed,
  logout,
  saveVideoBlob,
  setMessengerLink,
  setScrollSelection,
  type ScrollSelection,
  type VideoMeta,
} from '@/lib/admin'
import { cn } from '@/lib/utils'

function VideoPreview({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    getVideoBlob(id)
      .then((blob) => {
        if (cancelled) return
        if (blob) {
          objectUrl = URL.createObjectURL(blob)
          setUrl(objectUrl)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-cream/40 text-xs">
        Unavailable
      </div>
    )
  }
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gold animate-spin" />
      </div>
    )
  }
  return (
    <video
      src={url}
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setError(true)}
      className="w-full h-full object-cover"
    />
  )
}

function ScrollStatus({
  isDesktop,
  isMobile,
}: {
  isDesktop: boolean
  isMobile: boolean
}) {
  if (isDesktop && isMobile) {
    return <span className="text-xs text-gold">Desktop &amp; mobile</span>
  }
  if (isDesktop) return <span className="text-xs text-gold">Desktop scroll video</span>
  if (isMobile) return <span className="text-xs text-gold">Mobile scroll video</span>
  return null
}

export default function AdminPanelPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [library, setLibrary] = useState<VideoMeta[]>([])
  const [selection, setSelection] = useState<ScrollSelection>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [messenger, setMessenger] = useState('')

  const refresh = useCallback(() => {
    setLibrary(getLibrary())
    setSelection(getScrollSelection())
    setMessenger(getMessengerLink() ?? '')
  }, [])

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/admin')
      return
    }
    refresh()
  }, [router, refresh])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 4000)
  }

  const handleFiles = async (files: FileList | File[]) => {
    const videos = Array.from(files).filter(
      (f) => f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name)
    )
    if (videos.length === 0) {
      flash('Please drop video files (MP4, MOV, WebM).')
      return
    }

    setUploading(true)
    const first = videos[0]
    const saved: VideoMeta[] = []
    const unplayable: string[] = []
    try {
      for (const file of videos) {
        saved.push(await saveVideoBlob(file))
        const type = file.type || 'video/mp4'
        const probe = document.createElement('video')
        if (type && probe.canPlayType(type) === '') unplayable.push(file.name)
      }
    } catch {
      flash('Could not save video — the file may be too large for this browser.')
    } finally {
      setUploading(false)
    }

    const sel = getScrollSelection()
    if (saved.length > 0 && !sel.desktop) {
      sel.desktop = saved[0].id
      setScrollSelection(sel)
    }
    refresh()
    if (saved.length > 0 && unplayable.length > 0) {
      flash(
        `${unplayable.length === 1 ? 'Video' : 'Videos'} saved but ${
          unplayable.length === 1 ? 'is' : 'are'
        } in a format this browser can't play (${
          unplayable.length === 1 ? unplayable[0] : unplayable.join(', ')
        }). It won't show on the homepage — use MP4 (H.264) or WebM.`
      )
    } else {
      flash(
        saved.length > 0
          ? `${saved.length === 1 ? 'Video' : `${saved.length} videos`} saved. Head back to the homepage and scroll to see it.`
          : 'No videos were saved.'
      )
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const assignDesktop = (id: string) => {
    const sel = getScrollSelection()
    sel.desktop = id
    setScrollSelection(sel)
    setSelection(sel)
    flash('Desktop scroll video updated.')
  }

  const assignMobile = (id: string) => {
    const sel = getScrollSelection()
    sel.mobile = id
    setScrollSelection(sel)
    setSelection(sel)
    flash('Mobile scroll video updated.')
  }

  const clearScrollVideo = () => {
    setScrollSelection({})
    setSelection({})
    flash('Back to the default videos.')
  }

  const saveMessengerLink = () => {
    setMessengerLink(messenger)
    setMessenger(getMessengerLink() ?? '')
    flash(
      messenger.trim()
        ? 'Messenger link updated.'
        : 'Messenger link cleared — using the default.'
    )
  }

  const remove = async (id: string) => {
    await deleteVideo(id)
    refresh()
    flash('Video removed.')
  }

  const handleLogout = () => {
    logout()
    router.replace('/admin')
  }

  return (
    <main className="min-h-[100svh] px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-10 flex-wrap">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-cream/50 hover:text-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
            <h1 className="display text-4xl">Admin Panel</h1>
            <p className="text-sm text-cream/50 mt-1">
              Manage the scrolling video and the Order Now button on the
              homepage. Changes are saved in this browser and apply instantly on
              the next page load.
            </p>
          </div>
          <button onClick={handleLogout} className="btn-ghost px-5 py-3">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        {notice && (
          <div className="mb-8 flex items-center gap-2 text-sm text-cream bg-gold/10 border border-gold/30 rounded-lg px-4 py-3">
            <Check className="w-4 h-4 text-gold flex-shrink-0" />
            {notice}
          </div>
        )}

        {/* Section navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/panel"
            className="card-surface rounded-2xl p-5 sm:p-6 group transition-all duration-300 hover:border-gold/40"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/30">
                <MonitorPlay className="w-5 h-5 text-gold" />
              </span>
              <h2 className="display text-xl">Video library</h2>
            </div>
            <p className="text-sm text-cream/50">
              Swap the homepage scrolling videos. Uploads are saved in this
              browser.
            </p>
          </Link>
          <Link
            href="/admin/panel/business"
            className="card-surface rounded-2xl p-5 sm:p-6 group transition-all duration-300 hover:border-gold/40"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/30">
                <LineChart className="w-5 h-5 text-gold" />
              </span>
              <h2 className="display text-xl">Business Suite</h2>
              <span className="rounded-full bg-gold/15 border border-gold/40 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-gold">
                New
              </span>
            </div>
            <p className="text-sm text-cream/50">
              Ingredients, variations, batch &amp; slice calculators, expenses,
              profit and a full dashboard.
            </p>
          </Link>
        </div>

        {/* Current selection */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="eyebrow">Homepage scroll video</h2>
            <button
              onClick={clearScrollVideo}
              className="inline-flex items-center gap-1.5 text-xs text-cream/50 hover:text-gold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to defaults
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 rounded-lg bg-espresso-dark border border-cream/10 px-4 py-3">
              <MonitorPlay className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-cream/50 text-xs uppercase tracking-wider mb-0.5">
                  Desktop
                </p>
                <p className="truncate">
                  {library.find((v) => v.id === selection.desktop)?.name ??
                    'Default video'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-espresso-dark border border-cream/10 px-4 py-3">
              <Smartphone className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-cream/50 text-xs uppercase tracking-wider mb-0.5">
                  Mobile
                </p>
                <p className="truncate">
                  {library.find((v) => v.id === selection.mobile)?.name ??
                    'Default video'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Order Now / Messenger link */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Facebook className="w-5 h-5 text-gold flex-shrink-0" />
            <h2 className="eyebrow">Order Now — Messenger link</h2>
          </div>
          <p className="text-sm text-cream/60 mb-5">
            Where the big &ldquo;Order Now&rdquo; button on the homepage points.
            Leave empty to use the default, or paste your Facebook Messenger
            thread link (e.g. <span className="text-gold">https://m.me/yourpage</span>).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={messenger}
              onChange={(e) => setMessenger(e.target.value)}
              placeholder="https://m.me/yourpage"
              className="flex-1 px-4 py-3 bg-espresso-dark border border-cream/15 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
            <button onClick={saveMessengerLink} className="btn-primary sm:w-auto">
              <Save className="w-4 h-4" />
              Save link
            </button>
          </div>
        </section>

        {/* Drag & drop upload */}
        <section className="mb-10">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-2xl px-6 py-16 text-center cursor-pointer transition-all',
              dragActive
                ? 'border-gold bg-gold/5'
                : 'border-cream/20 hover:border-gold/60 hover:bg-cream/[0.02]'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {uploading ? (
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
            ) : (
              <UploadCloud className="w-10 h-10 text-gold mx-auto mb-4" />
            )}
            <p className="display text-xl mb-1">
              {uploading ? 'Saving videos…' : 'Drag &amp; drop videos here'}
            </p>
            <p className="text-sm text-cream/50">
              or click to browse. MP4, MOV or WebM — big files are fine.
            </p>
          </div>
        </section>

        {/* Library */}
        <section>
          <h2 className="eyebrow mb-5">Video library</h2>
          {library.length === 0 ? (
            <p className="text-sm text-cream/40">
              No custom videos yet. Upload your first one above.
            </p>
          ) : (
            <ul className="space-y-4">
              {library.map((video) => (
                <li
                  key={video.id}
                  className="card-surface rounded-xl p-3 flex items-center gap-4"
                >
                  <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-lg overflow-hidden bg-espresso-dark flex-shrink-0">
                    <VideoPreview id={video.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{video.name}</p>
                      <ScrollStatus
                        isDesktop={selection.desktop === video.id}
                        isMobile={selection.mobile === video.id}
                      />
                    </div>
                    <p className="text-xs text-cream/40 mt-0.5">
                      {formatBytes(video.size)} · added{' '}
                      {new Date(video.addedAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => assignDesktop(video.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                          selection.desktop === video.id
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold hover:text-gold'
                        )}
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        {selection.desktop === video.id ? 'Desktop set' : 'Set desktop'}
                      </button>
                      <button
                        onClick={() => assignMobile(video.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                          selection.mobile === video.id
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold hover:text-gold'
                        )}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {selection.mobile === video.id ? 'Mobile set' : 'Set mobile'}
                      </button>
                      <button
                        onClick={() => remove(video.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs text-cream/40 hover:text-red-400 hover:border-red-400/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12 pt-6 border-t border-cream/10 flex items-center gap-2 text-xs text-cream/40">
          <Lock className="w-3.5 h-3.5" />
          Videos are stored locally in this browser — no files leave your device.
        </div>
      </div>
    </main>
  )
}
