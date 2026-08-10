'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { asset } from '@/lib/paths'
import { cn } from '@/lib/utils'

const SCRUB_VH = 300

const HEVC_SRC = asset('/assets/video/flanvideo.mp4')
const H264_SRC = asset('/assets/video/flanvideo-h264.mp4')
const POSTER_SRC = asset('/assets/video/flanvideo-poster.jpg')

/**
 * Full-screen video that scrubs with the page scroll.
 *
 * The video is `position: fixed` while a spacer of the same height provides
 * the scroll distance. As the user scrolls, the video's `currentTime` is
 * mapped linearly across its duration so the clip plays forward and back with
 * the wheel. Seeks are throttled to one per animation frame and only when the
 * target time actually changes.
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

    const markReady = () => setReady(true)
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)

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
    }
  }, [])

  return (
    <>
      <div ref={wrapRef} style={{ height: `${SCRUB_VH}svh` }} aria-hidden />

      <div className="fixed inset-0 z-0 pointer-events-none bg-espresso">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          preload="auto"
          poster={POSTER_SRC}
        >
          <source src={HEVC_SRC} type='video/mp4; codecs="hvc1.1.6.L93.B0"' />
          <source src={H264_SRC} type='video/mp4; codecs="avc1.64001f"' />
        </video>

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
