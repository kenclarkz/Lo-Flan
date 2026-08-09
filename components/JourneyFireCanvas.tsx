'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { subscribeActiveChapter } from '@/lib/chapterState'
import { startProcessTransition } from '@/lib/processState'
import { asset } from '@/lib/paths'

const CHAPTERS = ['hero', 'ingredients', 'blend', 'pour', 'oven', 'reveal']
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const TRANSITION_S = 1.15

// The reveal chapter is the full-screen 3D flan — no backdrop photo is used.
const NO_PHOTO = new Set<number>([CHAPTERS.length - 1])

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTextureA;
  uniform sampler2D uTextureB;
  uniform float uProgress;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uImageAspectA;
  uniform float uImageAspectB;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(11.7);
      a *= 0.5;
    }
    return v;
  }

  vec2 coverUv(vec2 uv, float imgAspect) {
    float screenAspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 s = imgAspect > screenAspect
      ? vec2(screenAspect / imgAspect, 1.0)
      : vec2(1.0, imgAspect / screenAspect);
    return clamp((uv - 0.5) * s + 0.5, 0.001, 0.999);
  }

  void main() {
    vec2 uv = vUv;

    if (uProgress <= 0.001) {
      gl_FragColor = vec4(texture2D(uTextureA, coverUv(uv, uImageAspectA)).rgb, 1.0);
      return;
    }

    float edgeNoise = fbm(uv * vec2(2.0, 3.2) + vec2(uTime * 0.5, -uTime * 0.28));
    float fineNoise = noise(uv * vec2(42.0, 22.0) + uTime * 1.6);
    float front = uv.y * 1.3 + (edgeNoise - 0.5) * 0.18 + (fineNoise - 0.5) * 0.05;

    float frontProgress = uProgress * 1.35;
    float burnt = 1.0 - smoothstep(frontProgress - 0.07, frontProgress + 0.005, front);
    float flame = smoothstep(frontProgress - 0.10, frontProgress - 0.025, front)
                - smoothstep(frontProgress - 0.025, frontProgress + 0.02, front);
    float char = smoothstep(frontProgress - 0.18, frontProgress - 0.07, front) * (1.0 - burnt);

    vec2 uva = coverUv(uv, uImageAspectA);
    vec2 uvb = coverUv(uv, uImageAspectB);
    vec3 colA = texture2D(uTextureA, uva).rgb;
    vec3 colB = texture2D(uTextureB, uvb).rgb;

    colA *= 1.0 - char * 0.7;

    vec3 col = mix(colA, colB, burnt);

    vec3 fire = vec3(1.0, 0.52, 0.10);
    col += fire * flame * (0.85 + 0.5 * fineNoise);

    vec2 sparkUv = vec2(uv.x * 28.0, uv.y * 70.0) + vec2(uTime * 2.5, -uTime * 10.0);
    float spark = step(0.986, hash(floor(sparkUv) + 13.0));
    spark *= smoothstep(frontProgress, frontProgress - 0.25, front) * (1.0 - burnt);
    col += vec3(1.0, 0.72, 0.30) * spark * 0.85;

    col += vec3(0.20, 0.09, 0.03) * (1.0 - uProgress) * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`

function makeFallbackTexture() {
  const tex = new THREE.DataTexture(new Uint8Array([27, 18, 12, 255]), 1, 1)
  tex.needsUpdate = true
  return tex
}

function imageAspect(tex: THREE.Texture | null) {
  if (!tex || !tex.image) return 1
  const img = tex.image as { width: number; height: number }
  return img.width / Math.max(1, img.height)
}

function BurnScene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const texturesRef = useRef<(THREE.Texture | null)[]>([])
  const currentRef = useRef(0)
  const toRef = useRef(0)
  const tRef = useRef(0)
  const transitioningRef = useRef(false)
  const size = useThree((s) => s.size)

  const fallback = useMemo(() => makeFallbackTexture(), [])

  const uniforms = useMemo<{ [key: string]: THREE.IUniform }>(
    () => ({
      uTextureA: { value: fallback },
      uTextureB: { value: fallback },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageAspectA: { value: 1 },
      uImageAspectB: { value: 1 },
    }),
    [fallback]
  )

  // Resolve + load the chapter photos as GPU textures.
  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()

    const applyTexture = (i: number, tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace
      texturesRef.current[i] = tex
      if (i === currentRef.current) {
        uniforms.uTextureA.value = tex
        uniforms.uTextureB.value = tex
        uniforms.uImageAspectA.value = imageAspect(tex)
        uniforms.uImageAspectB.value = imageAspect(tex)
      } else if (transitioningRef.current && i === toRef.current) {
        uniforms.uTextureB.value = tex
        uniforms.uImageAspectB.value = imageAspect(tex)
      }
    }

    const checkSlug = (i: number, j: number) => {
      if (cancelled || j >= EXTENSIONS.length) return
      const url = asset(`/assets/journey/${CHAPTERS[i]}.${EXTENSIONS[j]}`)
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (cancelled) return
          if (res.ok) loader.load(url, (tex) => !cancelled && applyTexture(i, tex))
          else checkSlug(i, j + 1)
        })
        .catch(() => {
          if (!cancelled) checkSlug(i, j + 1)
        })
    }
    CHAPTERS.forEach((_, i) => {
      if (!NO_PHOTO.has(i)) checkSlug(i, 0)
    })

    return () => {
      cancelled = true
    }
  }, [uniforms, fallback])

  // Start a fire transition when the active chapter changes.
  useEffect(() => {
    const unsub = subscribeActiveChapter((idx) => {
      const get = (i: number) => texturesRef.current[i] ?? fallback
      uniforms.uTextureA.value = get(currentRef.current)
      uniforms.uImageAspectA.value = imageAspect(texturesRef.current[currentRef.current])
      uniforms.uTextureB.value = get(idx)
      uniforms.uImageAspectB.value = imageAspect(texturesRef.current[idx])
      uniforms.uProgress.value = 0
      toRef.current = idx
      tRef.current = 0
      transitioningRef.current = true
      startProcessTransition(currentRef.current, idx)
    })
    return unsub
  }, [uniforms, fallback])

  useFrame((_, delta) => {
    uniforms.uTime.value += delta
    uniforms.uResolution.value.set(size.width, size.height)

    // Ken Burns slow zoom on whatever is on screen
    if (meshRef.current) {
      const t = (performance.now() % 9000) / 9000
      const eased = 1 - Math.pow(1 - t, 3)
      meshRef.current.scale.setScalar(1.06 + 0.1 * eased)
    }

    if (!transitioningRef.current) return

    tRef.current += delta / TRANSITION_S
    const t = Math.min(1, tRef.current)
    uniforms.uProgress.value = t < 1 ? (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) : 1

    if (t >= 1) {
      transitioningRef.current = false
      currentRef.current = toRef.current
      uniforms.uTextureA.value = uniforms.uTextureB.value
      uniforms.uImageAspectA.value = uniforms.uImageAspectB.value
      uniforms.uProgress.value = 0
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  )
}

/**
 * Fixed, full-screen WebGL layer behind the chapters.
 *
 * The current chapter photo is shown on a full-screen quad. When the active
 * chapter changes, a fire/burn shader consumes the current photo from the
 * bottom up, revealing the next chapter's photo behind a flickering flame edge.
 */
export default function JourneyFireCanvas() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        orthographic
        camera={{
          left: -1,
          right: 1,
          top: 1,
          bottom: -1,
          zoom: 1,
          position: [0, 0, 1],
          near: 0.1,
          far: 10,
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <BurnScene />
      </Canvas>
    </div>
  )
}
