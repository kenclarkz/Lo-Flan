'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Github,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  MonitorPlay,
  RotateCcw,
  Smartphone,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import {
  GITHUB_BRANCH,
  GITHUB_OWNER,
  GITHUB_REPO,
  deleteVideo,
  formatBytes,
  getPanelConfig,
  getToken,
  isAuthed,
  logout,
  saveVideo,
  scrollVideoUrl,
  setScrollConfig,
  setToken,
  verifyToken,
  type ScrollVideoConfig,
  type VideoMeta,
} from '@/lib/admin'
import { cn } from '@/lib/utils'

const EMPTY_CONFIG: ScrollVideoConfig = { videos: [], updatedAt: 0 }

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

  const [config, setConfig] = useState<ScrollVideoConfig>(EMPTY_CONFIG)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')

  const [token, setTokenState] = useState(() => getToken())
  const [tokenDraft, setTokenDraft] = useState(() => getToken())
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [tokenError, setTokenError] = useState('')

  const flash = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 5000)
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setConfig(EMPTY_CONFIG)
      return
    }
    try {
      setConfig(await getPanelConfig())
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not read the video config from GitHub.')
    }
  }, [flash])

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/admin')
      return
    }
    refresh()
  }, [router, refresh])

  const saveToken = async (e: FormEvent) => {
    e.preventDefault()
    setTokenError('')
    setVerifying(true)
    const value = tokenDraft.trim()
    setToken(value)
    setTokenState(value)
    try {
      if (!(await verifyToken())) {
        setTokenError('GitHub rejected this token. It needs Contents read & write access on the repo.')
      } else {
        setShowTokenForm(false)
        flash('GitHub connected.')
        refresh()
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const videos = Array.from(files).filter(
      (f) => f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name)
    )
    if (videos.length === 0) {
      flash('Please drop video files (MP4, MOV, WebM).')
      return
    }
    if (!token) {
      flash('Connect GitHub first — videos are committed straight to the repo.')
      return
    }

    setUploading(true)
    const saved: VideoMeta[] = []
    try {
      for (const file of videos) {
        saved.push(await saveVideo(file))
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not save the video.')
    } finally {
      setUploading(false)
    }

    if (saved.length > 0) {
      try {
        const cfg = await getPanelConfig()
        if (!cfg.desktop) cfg.desktop = saved[0].file
        await setScrollConfig(cfg)
        setConfig(cfg)
      } catch (err) {
        flash(err instanceof Error ? err.message : 'Video saved, but could not update the homepage selection.')
      }
      refresh()
      flash(
        saved.length === 1
          ? 'Video pushed to GitHub. Reload the homepage and scroll to see it.'
          : `${saved.length} videos pushed to GitHub. Reload the homepage and scroll to see them.`
      )
    } else {
      refresh()
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const assignDesktop = async (file: string) => {
    try {
      const cfg = await getPanelConfig()
      cfg.desktop = file
      await setScrollConfig(cfg)
      setConfig(cfg)
      flash('Desktop scroll video updated — pushed to GitHub.')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not update the desktop video.')
    }
  }

  const assignMobile = async (file: string) => {
    try {
      const cfg = await getPanelConfig()
      cfg.mobile = file
      await setScrollConfig(cfg)
      setConfig(cfg)
      flash('Mobile scroll video updated — pushed to GitHub.')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not update the mobile video.')
    }
  }

  const clearScrollVideo = async () => {
    try {
      const cfg = await getPanelConfig()
      cfg.desktop = undefined
      cfg.mobile = undefined
      await setScrollConfig(cfg)
      setConfig(cfg)
      flash('Back to the default videos — pushed to GitHub.')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not reset the scroll video.')
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteVideo(id)
      refresh()
      flash('Video removed from the repo.')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not remove the video.')
    }
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
              Manage the scrolling video on the homepage. Uploads are committed
              straight to your GitHub repo and apply to every visitor.
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

        {/* GitHub connection */}
        <section className="card-surface rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="eyebrow flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub connection
            </h2>
            {token && (
              <button
                onClick={() => setShowTokenForm((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-cream/50 hover:text-gold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {showTokenForm ? 'Hide token form' : 'Change token'}
              </button>
            )}
          </div>

          {token && !showTokenForm ? (
            <p className="text-sm text-cream/60 leading-relaxed">
              Connected to{' '}
              <span className="text-gold">
                {GITHUB_OWNER}/{GITHUB_REPO}
              </span>{' '}
              on <span className="text-gold">{GITHUB_BRANCH}</span>. Videos are
              committed to{' '}
              <code className="text-gold bg-espresso-dark px-1.5 py-0.5 rounded">
                public/assets/video/custom
              </code>{' '}
              and the selection lives in{' '}
              <code className="text-gold bg-espresso-dark px-1.5 py-0.5 rounded">
                data/scroll-video.json
              </code>
              .
            </p>
          ) : (
            <form onSubmit={saveToken} className="space-y-4">
              <p className="text-sm text-cream/50 leading-relaxed">
                Create a personal access token with{' '}
                <span className="text-cream">Contents: Read &amp; write</span>{' '}
                access to this repo, then paste it here. It&apos;s stored only in
                this browser and used to push videos + config to GitHub.
              </p>
              <div className="relative">
                <input
                  type="password"
                  value={tokenDraft}
                  onChange={(e) => setTokenDraft(e.target.value)}
                  placeholder="ghp_… or github_pat_…"
                  autoComplete="off"
                  className="w-full px-4 py-3 pr-12 bg-espresso-dark border border-cream/15 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={verifying || !tokenDraft.trim()}
                  className="btn-primary disabled:opacity-60"
                >
                  {verifying ? 'Checking…' : token ? 'Save token' : 'Connect'}
                </button>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cream/50 hover:text-gold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Create a token on GitHub
                </a>
              </div>
              {tokenError && (
                <p role="alert" className="text-sm text-red-400">
                  {tokenError}
                </p>
              )}
            </form>
          )}
        </section>

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
                  {config.desktop
                    ? config.videos.find((v) => v.file === config.desktop)?.name ??
                      config.desktop
                    : 'Default video'}
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
                  {config.mobile
                    ? config.videos.find((v) => v.file === config.mobile)?.name ??
                      config.mobile
                    : 'Default video'}
                </p>
              </div>
            </div>
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
              {uploading ? 'Pushing to GitHub…' : 'Drag &amp; drop videos here'}
            </p>
            <p className="text-sm text-cream/50">
              or click to browse. MP4, MOV or WebM — big files are fine. Each
              file is committed to the repo, then set it as the desktop or
              mobile scroll video below.
            </p>
          </div>
        </section>

        {/* Library */}
        <section>
          <h2 className="eyebrow mb-5">Video library</h2>
          {config.videos.length === 0 ? (
            <p className="text-sm text-cream/40">
              No custom videos in the repo yet. Upload your first one above.
            </p>
          ) : (
            <ul className="space-y-4">
              {config.videos.map((video) => (
                <li
                  key={video.id}
                  className="card-surface rounded-xl p-3 flex items-center gap-4"
                >
                  <div className="w-28 h-16 sm:w-36 sm:h-20 rounded-lg overflow-hidden bg-espresso-dark flex-shrink-0">
                    <video
                      src={scrollVideoUrl(video.file)}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{video.name}</p>
                      <ScrollStatus
                        isDesktop={config.desktop === video.file}
                        isMobile={config.mobile === video.file}
                      />
                    </div>
                    <p className="text-xs text-cream/40 mt-0.5">
                      {formatBytes(video.size)} · added{' '}
                      {new Date(video.addedAt).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button
                        onClick={() => assignDesktop(video.file)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                          config.desktop === video.file
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold hover:text-gold'
                        )}
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        {config.desktop === video.file ? 'Desktop set' : 'Set desktop'}
                      </button>
                      <button
                        onClick={() => assignMobile(video.file)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
                          config.mobile === video.file
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-cream/20 text-cream/70 hover:border-gold hover:text-gold'
                        )}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {config.mobile === video.file ? 'Mobile set' : 'Set mobile'}
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
          <Github className="w-3.5 h-3.5" />
          Videos are committed to {GITHUB_OWNER}/{GITHUB_REPO} ({GITHUB_BRANCH})
          and served to all visitors — nothing stays in browser storage.
        </div>
      </div>
    </main>
  )
}
