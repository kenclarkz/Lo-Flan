'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { asset } from '@/lib/paths'
import { cn } from '@/lib/utils'

const SCRUB_VH = 200

// Both mobile and desktop use the new portrait clip. Desktop compensates for
// the 9:16 aspect by framing it at full height and filling the wide gutters
// with a blurred backdrop of the same footage.
const HEVC_SRC = asset('/assets/video/3416428052367618.mp4')
const H264_SRC = asset('/assets/video/3416428052367618-h264.mp4')
const POSTER_SRC = asset('/assets/video/3416428052367618-poster.jpg')

// Ordered source candidates, reliability first.
//
// The portrait HEVC clip is Main profile so iOS/Safari decode it — it is
// preferred for quality there — with H.264 as the guaranteed fallback that
// wins source selection everywhere else.
//
// `codecs` mirrors each file's real encoder profile. Declaring a codec string
// is fragile: if `canPlayType()` returns "" (e.g. an unsupported/mismatched
// codec string) the browser discards the source without even downloading it,
// so `pickNext()` keeps advancing until one is accepted.
const SOURCES = [
  { src: HEVC_SRC, codecs: 'hvc1.1.6.L120.B0' },
  { src: H264_SRC, codecs: 'avc1.64001f' },
]

/**
 * Full-screen video that scrubs with the page scroll.
 *
 * The video is `position: fixed` and fills the viewport while a spacer of the
 * same height provides the scroll distance. As the user scrolls, the video's
 * `currentTime` is mapped linearly across its duration so the clip plays
 * forward and back with the wheel. Seeks are throttled to one per animation
 * frame and only when the target time actually changes.
 *
 * The portrait clip fills the viewport on mobile (< sm) and is framed at its
 * natural 9:16 aspect on desktop, where a blurred backdrop of the same footage
 * fills the gutters so it reads as full screen.
 */
export default function ScrollVideo() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof window === 'undefined') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let lastTime = -1
    let started = false
    let srcIndex = -1

    const markReady = () => setReady(true)
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)

    // Pick the first source this browser can actually decode (HEVC first on
    // iOS for quality, H.264 everywhere else), then keep advancing through
    // the candidates if one fails so the scrub video always shows.
    const usable = SOURCES

    const probe = (s: (typeof SOURCES)[number]) => {
      const el = document.createElement('video')
      const type = s.codecs ? `video/mp4; codecs="${s.codecs}"` : 'video/mp4'
      return el.canPlayType(type) !== ''
    }

    const tryCandidate = (i: number) => {
      if (i < 0 || i >= usable.length) return false
      srcIndex = i
      video.src = usable[i].src
      video.load()
      return true
    }

    const pickNext = () => {
      for (let i = srcIndex + 1; i < usable.length; i++) {
        if (probe(usable[i])) return tryCandidate(i)
      }
      // No candidate advertises support — attempt the next one anyway so the
      // browser has a chance to load it before we give up on the loader.
      return tryCandidate(srcIndex + 1)
    }

    const onVideoError = () => {
      if (!pickNext()) markReady()
    }
    video.addEventListener('error', onVideoError)
    pickNext()

    // Mobile browsers won't paint a paused video's frame until playback has
    // started once; give it a brief muted play so scrubbing renders every seek.
    const unlock = () => {
      const p = video.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          markReady()
          setTimeout(() => video.pause(), 60)
        }).catch(() => {})
      }
    }
    unlock()

    // Never trap the visitor behind the loader (e.g. blocked media, data saver).
    const failSafe = window.setTimeout(markReady, 12000)

    const update = () => {
      raf = requestAnimationFrame(update)

      if (video.readyState >= 2) setReady(true)

      if (reduced) return

      const dur = video.duration
      if (!Number.isFinite(dur) || dur <= 0) return

      const total =
        (wrapRef.current?.offsetHeight ?? 0) - window.innerHeight
      if (total <= 0 || video.readyState < 1) return

      const p = Math.min(1, Math.max(0, window.scrollY / total))
      const t = p * dur
      if (Math.abs(t - lastTime) > 0.02) {
        lastTime = t
        video.currentTime = t
      }
      if (window.scrollY > 12 && !started) {
        started = true
        setScrolled(true)
      }
    }
    raf = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(failSafe)
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('error', onVideoError)
    }
  }, [])

  return (
    <>
      <div ref={wrapRef} style={{ height: `${SCRUB_VH}svh` }} aria-hidden />

      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-espresso">
        {/* Desktop: blurred 9:16 backdrop fills the wide gutters */}
        <div
          aria-hidden
          className="absolute inset-0 hidden scale-125 bg-cover bg-center blur-2xl sm:block"
          style={{ backgroundImage: `url(${POSTER_SRC})` }}
        />

        <video
          ref={videoRef}
          className="relative h-[100svh] w-full object-cover sm:h-screen sm:w-auto sm:aspect-[9/16] sm:object-contain"
          playsInline
          muted
          preload="auto"
          poster={POSTER_SRC}
        />

        {/* Brand loader until the first frame is decodable */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-espresso">
            <div className="text-center">
              <Image
                src={asset('/assets/brand/logo.png')}
                alt=""
                width={72}
                height={72}
                className="mx-auto mb-6 rounded-full object-cover animate-pulse"
              />
              <p className="font-serif text-2xl text-cream">Lo&apos;s Flan</p>
              <p className="mt-2 text-sm text-cream/50 uppercase tracking-[0.2em]">
                The Journey of a Perfect Flan
              </p>
            </div>
          </div>
        )}

        {/* Scroll hint, fades once the visitor starts scrolling */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-10 flex justify-center transition-opacity duration-700',
            scrolled ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-[0.62rem] uppercase tracking-[0.3em] text-cream/60">
              Scroll to play
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gold animate-bounce"
              style={{ animationDuration: '1.8s' }}
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
