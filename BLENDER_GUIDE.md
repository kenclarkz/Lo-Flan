# Lo's Flan — Blender Asset Integration Guide

This document explains how to replace procedural 3D placeholders with production Blender assets (GLB models, PNG image sequences, MP4 cinematic clips).

---

## 📁 Asset Folder Structure

```
public/assets/
├── flan/
│   ├── flan.glb              # Hero flan (Scene 1 & 6)
│   └── README.md
├── ingredients/
│   ├── eggs.glb
│   ├── milk.glb
│   ├── sugar.glb
│   ├── vanilla.glb
│   ├── cream.glb
│   ├── caramel.glb
│   └── README.md
├── blender/
│   ├── blender.glb           # Blender base + jar + lid + blade
│   ├── pan.glb               # 9-inch baking pan
│   └── README.md
├── oven/
│   ├── oven.glb              # Oven with door, rack, interior
│   └── README.md
├── products/
│   ├── classic-flan.svg      # Product card images (SVG/PNG)
│   ├── vanilla-flan.svg
│   ├── coffee-flan.svg
│   ├── chocolate-flan.svg
│   ├── mango-flan.svg
│   ├── matcha-flan.svg
│   ├── hazelnut-flan.svg
│   ├── party-flan.svg
│   ├── gift-box.svg
│   └── README.md
└── sequences/
    ├── hero-flan/            # PNG sequence or MP4 for Scene 1
    │   ├── frame-0001.png
    │   └── ...
    ├── ingredient-explosion/ # Scene 2 sequence
    ├── blender-vortex/       # Scene 3 sequence
    ├── batter-pour/          # Scene 4 sequence
    ├── oven-bake/            # Scene 5 sequence
    ├── final-reveal/         # Scene 6 sequence
    └── README.md
```

---

## 🔄 How Asset Replacement Works

### 1. GLB Models (Automatic Detection)

Each procedural component wraps its mesh in `<ModelOrFallback>`:

```tsx
// components/three/FlanModel.tsx
export function FlanModel({ dripRef }) {
  return (
    <ModelOrFallback url="/assets/flan/flan.glb">
      <ProceduralFlan dripRef={dripRef} />
    </ModelOrFallback>
  )
}
```

**To use a Blender GLB:**
1. Export your model as `.glb` (glTF Binary) from Blender
2. Place it in the corresponding folder under `public/assets/`
3. The component will **automatically detect** it at runtime (HEAD request)
4. If found → renders the GLB; if not → falls back to procedural mesh

**Requirements for GLB:**
- Units: **meters** (1 Blender unit = 1 meter)
- Scale: flan ~1.2m tall, blender ~1.8m, oven ~1.8m
- Pivot: flan at plate base (y=0), blender at base bottom, oven at floor level
- Materials: use standard PBR (Principled BSDF) — they'll be overridden by our lighting rig
- No need for lights/cameras in the GLB — we provide our own

### 2. PNG Image Sequences (Scroll-Scrubbed Cinematics)

For fully pre-rendered cinematic sequences driven by scroll:

```tsx
// components/sequence/ImageSequencePlayer.tsx
import { useFrame } from '@react-three/fiber'
import { usePinnedScene } from '@/lib/usePinnedScene'

export function ImageSequencePlayer({ folder, frameCount, digits = 4 }) {
  const { progressRef } = usePinnedScene(containerRef, { end: '+=250%' })
  const [texture, setTexture] = useState(null)

  useFrame(() => {
    const p = progressRef.current
    const frame = Math.min(frameCount - 1, Math.floor(p * frameCount))
    const url = `/assets/sequences/${folder}/frame-${String(frame + 1).padStart(digits, '0')}.png`
    // Load texture if changed...
  })

  return <mesh><planeGeometry/><meshBasicMaterial map={texture}/></mesh>
}
```

**To use:**
1. Render your Blender animation as PNG sequence (transparent background preferred)
2. Name frames: `frame-0001.png`, `frame-0002.png`, …
3. Place in `public/assets/sequences/<scene-name>/`
4. Update `frameCount` in the component
5. The sequence scrubs perfectly with scroll progress

### 3. MP4 Cinematic Clips

For non-interactive cinematic playback (e.g., hero background):

```tsx
// components/sequence/VideoBackground.tsx
export function VideoBackground({ src, className }) {
  return (
    <video
      className={className}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
    />
  )
}
```

Place MP4 in `public/assets/sequences/` and reference it.

---

## 🎨 Blender Production Guidelines

### Modeling
| Asset | Target Scale | Poly Budget (LOD0) | Notes |
|-------|--------------|-------------------|-------|
| Flan (hero) | 1.2m tall | ~8k tris | Separate meshes: plate, custard dome, caramel cap, drips |
| Ingredients (×6) | ~0.3–0.5m | ~2k each | Eggs (3), milk bottle, sugar bowl, vanilla pod, cream pitcher, caramel bottle |
| Blender | 1.8m tall | ~12k | Base, jar (glass, double-sided), lid, blade, motor buttons |
| Pan | 0.23m (9") | ~3k | Simple cylinder with rim |
| Oven | 1.8m tall | ~15k | Body, door (hinged), glass window, rack, interior cavity |

### Materials (Blender Principled BSDF)
| Surface | Base Color | Roughness | Transmission | Clearcoat | Notes |
|---------|------------|-----------|--------------|-----------|-------|
| Custard | `#F4DCAB` | 0.3 | 0.0 | 0.8 | Subsurface: 0.15, radius 0.02 |
| Caramel | `#A65A1E` | 0.12 | 0.25 | 0.95 | Thickness 0.4, IOR 1.52 |
| Glass (blender jar) | `#DFE8EE` | 0.05 | 0.85 | 0.0 | Thin-walled, double-sided |
| Ceramic plate | `#EFE6D6` | 0.22 | 0.0 | 1.0 | Clearcoat roughness 0.12 |
| Metal (blender/pan/oven) | `#2B2B2F` | 0.4 | 0.0 | 0.0 | Metalness 0.4–0.8 |

### Lighting Setup (for reference renders)
We use a custom studio rig in-code (no HDR needed). For Blender lookdev:
- Key: Area light 5m, 5000K, 500W, 45°
- Fill: Area light 3m, 6500K, 100W, opposite side
- Rim: Strip light behind, 4000K, 200W
- Environment: Studio HDRI (optional) or our procedural `StudioEnv`

### Animation Export
- **Frame rate**: 30 fps
- **Duration per scene**: ~8–12 seconds at 30fps = 240–360 frames
- **Export**: PNG sequence (RGBA) or MP4 (H.264, high bitrate)
- **Camera**: Match our camera paths (see Scene Camera Paths below)

---

## 📹 Scene Camera Paths (for Blender Animation)

All cameras use **vertical FOV 35°**. Coordinates in meters, Y-up.

### Scene 1: Hero Flan (0–100% progress)
| Progress | Position (x, y, z) | Look At | Notes |
|----------|-------------------|---------|-------|
| 0% | (0, 1.1, 6.4) | (0, 0.5, 0) | Wide hero |
| 30% | (-0.2, 1.05, 5.2) | (0, 0.5, 0) | Drift left |
| 60% | (-0.35, 1.0, 4.4) | (0, 0.5, 0) | Close hero |
| 100% | (-0.35, 1.0, 4.2) | (0, 0.5, 0) | Final rest |

Flan rotates Y: 0 → 0.6 rad over full progress.

### Scene 2: Ingredient Explosion
Camera orbits slowly around center (radius 5.6 → 4.7, height 1.0 → 1.1).

### Scene 3: Blender
| Progress | Position | Look At | Notes |
|----------|----------|---------|-------|
| 0% | (0, 1.3, 3.2) | (0, 0.85, 0) | Front view |
| 50% | (0.3, 1.4, 2.0) | (0, 0.85, 0) | Side |
| 75% | (0, 1.35, 1.0) | (0, 0.85, 0) | **Inside jar** |
| 100% | (0, 1.3, 2.5) | (0, 0.85, 0) | Pull back |

### Scene 4: Batter Pour
Camera arcs from blender (z=3.6) to pan (z=1.3), height 1.4 → 1.2.

### Scene 5: Oven
| Progress | Position | Look At |
|----------|----------|---------|
| 0% | (0, 0.9, 4.2) | (0, 0.8, 0.1) |
| 50% | (0, 1.1, 3.0) | (0, 0.8, 0.1) |
| 100% | (0, 1.0, 3.6) | (0, 0.9, 0.1) |

Door opens at 0% and 75%.

### Scene 6: Final Reveal
Slow orbit: radius 6.0, height 1.2, 360° over full progress.

---

## 🛠️ Development Workflow

### 1. Local Development with Assets
```bash
# Place GLB files in public/assets/... — they hot-reload on save
npm run dev
```

### 2. Preload Assets (Optional)
In `components/three/GlbModel.tsx`:
```tsx
useGLTF.preload('/assets/flan/flan.glb')
useGLTF.preload('/assets/blender/blender.glb')
// ...etc
```

### 3. Testing Fallbacks
Rename or remove a GLB to verify procedural fallback renders correctly.

### 4. Performance Budgets
| Device | Target FPS | DPR | Particles | Shadow Map |
|--------|------------|-----|-----------|------------|
| Desktop | 60 | 1.75 | Full | 1024 |
| Mobile | 60 | 1.5 | 50% | 512 |
| Low-end | 30 | 1.0 | 25% | 256 |

The `GatedCanvas` component auto-pauses rendering when off-screen.

---

## 📦 Deploying to Production

### Vercel (Recommended)
```bash
vercel --prod
```
- Assets in `public/` are served from Vercel Edge Network
- GLB/PNG/MP4 cached with `Cache-Control: public, max-age=31536000, immutable`

### Static Export (GitHub Pages / Netlify)
```bash
# next.config.mjs
output: 'export',
images: { unoptimized: true }
```
```bash
npm run build && npm run export
```
- Works for GLB/PNG/MP4 in `public/`
- No server-side features (cart uses localStorage only)

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| GLB not loading | Wrong path / 404 | Check `public/assets/` path matches exactly; case-sensitive on Linux |
| GLB renders black | Missing normals / flipped faces | In Blender: `Mesh → Normals → Recalculate Outside` |
| GLB too big/small | Unit mismatch | Blender: Scene Units → Metric → Meters; apply scale (Ctrl+A) |
| PNG sequence stutters | Too many frames / large files | Compress PNGs (oxipng), reduce frame count, use WebP sequence |
| MP4 won't autoplay | Browser policy | Must be `muted`, `playsInline`, no audio track |
| Shadows pixelated | Low shadow map res | Increase `ContactShadows resolution` prop (max 1024) |
| Mobile crashes | OOM / too many tris | Enable `useIsMobile()` quality scaling; reduce GLB LOD |

---

## 📚 Further Reading

- [Three.js GLTFLoader docs](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [React Three Fiber GLB loading](https://docs.pmnd.rs/react-three-fiber/tutorials/loading-models)
- [GSAP ScrollTrigger](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Lenis Smooth Scroll](https://github.com/studio-freight/lenis)

---

*Generated for Lo's Flan — last updated 2026*