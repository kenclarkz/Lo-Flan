'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { asset } from '@/lib/paths'
import { cn } from '@/lib/utils'

const SCRUB_VH = 200

// Max the video time may move per frame (≈7x realtime at 60fps). Seeking
// straight to the scroll target across a whole keyframe gap forces the decoder
// to walk hundreds of frames, which it can't paint in a single frame — the
// picture lags then jumps. Capping the step keeps every seek a few frames past
// a keyframe so the decoded frame is ready on time and the motion is smooth.
const MAX_STEP_SEC = 0.12

// Ignore sub-threshold moves so an idle wheel doesn't re-issue seeks.
const SEEK_EPSILON = 0.025

// Desktop scrubs the landscape cut (16:9) of the journey clip, mobile the
// portrait cut (9:16), so each viewport sees a full-frame composition instead
// of a heavy `object-cover` crop.
const DESKTOP_QUERY = '(min-width: 640px)'

const DESKTOP_HEVC_SRC = asset('/assets/video/flanvideo.mp4')
const DESKTOP_H264_SRC = asset('/assets/video/flanvideo-h264.mp4')
const MOBILE_HEVC_SRC = asset('/assets/video/lozoom.mp4')
const MOBILE_H264_SRC = asset('/assets/video/3416428052367618-h264.mp4')

// Ordered source candidates, reliability first.
//
// Both viewports prefer the HEVC clip (Main profile so iOS/Safari decode it)
// with H.264 as the guaranteed fallback that wins source selection everywhere
// else.
//
// `codecs` mirrors each file's real encoder profile. Declaring a codec string
// is fragile: if `canPlayType()` returns "" (e.g. an unsupported/mismatched
// codec string) the browser discards the source without even downloading it,
// so `pickNext()` keeps advancing until one is accepted.
type Source = { src: string; codecs: string }

const MOBILE_SOURCES: Source[] = [
  { src: MOBILE_HEVC_SRC, codecs: 'hvc1.1.6.L120.B0' },
  { src: MOBILE_H264_SRC, codecs: 'avc1.64001f' },
]

const DESKTOP_SOURCES: Source[] = [
  { src: DESKTOP_HEVC_SRC, codecs: 'hvc1.1.6.L120.B0' },
  { src: DESKTOP_H264_SRC, codecs: 'avc1.64001f' },
]

/**
 * Full-screen video that scrubs with the page scroll.
 *
 * The video is `position: fixed` and fills the viewport while a spacer of the
 * same height provides the scroll distance. As the user scrolls, the video's
 * `currentTime` is eased across its duration so the clip plays forward and
 * back with the wheel. The per-frame step is capped: a fast flick glides the
 * clip toward the scroll position instead of teleporting it, so it reads as
 * watching the video rather than dragging a progress bar (sparse-keyframe
 * exports can't decode a distant seek in one frame, which is what makes the
 * picture stutter and jump).
 *
 * Desktop uses the landscape cut of the clip (16:9, `object-cover` trims only
 * on ultrawide displays) while mobile uses the portrait cut that fills
 * edge-to-edge. Sources are re-picked when the viewport crosses the
 * breakpoint.
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
    const desktopMq = window.matchMedia(DESKTOP_QUERY)

    let raf = 0
    let started = false
    let srcIndex = -1
    let usable: Source[] = desktopMq.matches ? DESKTOP_SOURCES : MOBILE_SOURCES

    const markReady = () => setReady(true)
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)

    // Pick the first source this browser can actually decode, then keep
    // advancing through the candidates if one fails so the scrub video always
    // shows.
    const probe = (s: Source) => {
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

    // Swap the clip when the viewport crosses the desktop/mobile breakpoint.
    const onDesktopChange = () => {
      const next = desktopMq.matches ? DESKTOP_SOURCES : MOBILE_SOURCES
      if (next === usable) return
      usable = next
      srcIndex = -1
      pickNext()
      unlock()
    }
    desktopMq.addEventListener?.('change', onDesktopChange)

    pickNext()
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
      const target = p * dur
      const cur = video.currentTime

      // Ease the clip toward the scroll target without ever stepping more than
      // MAX_STEP_SEC per frame. Slow scrolling tracks 1:1; a fast flick makes
      // the clip glide at the cap and keep playing until it catches up with the
      // visitor's position — exactly like watching the video.
      let next = target
      if (Math.abs(target - cur) > MAX_STEP_SEC) {
        next = cur + Math.sign(target - cur) * MAX_STEP_SEC
      }
      if (Math.abs(next - cur) >= SEEK_EPSILON) {
        video.currentTime = Math.min(dur, Math.max(0, next))
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
      desktopMq.removeEventListener?.('change', onDesktopChange)
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('error', onVideoError)
    }
  }, [])

  return (
    <>
      <div ref={wrapRef} style={{ height: `${SCRUB_VH}svh` }} aria-hidden />

      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-espresso">
        <video
          ref={videoRef}
          className="relative h-[100svh] w-full object-cover"
          playsInline
          muted
          preload="auto"
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
