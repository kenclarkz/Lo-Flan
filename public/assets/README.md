# Public Assets

This folder contains all static assets served directly by Next.js.

## Structure

```
public/assets/
├── brand/
│   ├── mark.svg           # Logo mark (32×32 viewBox)
│   └── og.svg             # Open Graph image (1200×630)
├── products/
│   ├── classic-flan.svg
│   ├── vanilla-flan.svg
│   ├── coffee-flan.svg
│   ├── chocolate-flan.svg
│   ├── mango-flan.svg
│   ├── matcha-flan.svg
│   ├── hazelnut-flan.svg
│   ├── party-flan.svg
│   └── gift-box.svg
├── flan/                  # Hero flan GLB (Scene 1 & 6)
│   └── flan.glb           # Drop your Blender export here
├── ingredients/           # Ingredient GLBs (Scene 2)
│   ├── eggs.glb
│   ├── milk.glb
│   ├── sugar.glb
│   ├── vanilla.glb
│   ├── cream.glb
│   └── caramel.glb
├── blender/               # Blender + Pan GLBs (Scene 3 & 4)
│   ├── blender.glb
│   └── pan.glb
├── oven/                  # Oven GLB (Scene 5)
│   └── oven.glb
└── sequences/             # PNG sequences / MP4 clips
    ├── hero-flan/
    ├── ingredient-explosion/
    ├── blender-vortex/
    ├── batter-pour/
    ├── oven-bake/
    └── final-reveal/
```

## Automatic Asset Detection

Components use `<ModelOrFallback>` which checks for asset existence at runtime via `fetch(..., { method: 'HEAD' })`.

**To replace a procedural placeholder:**
1. Export your Blender asset as `.glb` (or PNG sequence / MP4)
2. Place it in the correct folder above with the exact filename
3. The component will automatically use the real asset instead of the procedural fallback

## Blender Export Guidelines

See [BLENDER_GUIDE.md](../../BLENDER_GUIDE.md) for complete specifications:
- Units: **Meters** (1 Blender unit = 1 meter)
- Scale reference: flan ~1.2m tall, blender ~1.8m, oven ~1.8m
- Pivot points: flan at plate base (y=0), blender at base bottom, oven at floor
- Materials: Standard Principled BSDF (our lighting rig overrides)
- No lights/cameras needed in GLB

## PNG Sequences

For scroll-scrubbed cinematics:
```
public/assets/sequences/hero-flan/
  ├── frame-0001.png
  ├── frame-0002.png
  └── ...
```

Name frames sequentially with zero-padded numbers. Update `frameCount` in the corresponding sequence component.

## MP4 Cinematic Clips

Place in `public/assets/sequences/<scene-name>/cinematic.mp4` for non-interactive playback.

## Cache Headers (Vercel/Netlify)

Assets in `public/` are served with long-term caching:
```
Cache-Control: public, max-age=31536000, immutable
```

## Development

Assets in `public/` are served at `/assets/...` during `npm run dev` and copied to the build output.