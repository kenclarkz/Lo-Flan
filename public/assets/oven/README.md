# Oven Assets

Drop your oven GLB here for Scene 5 (Baking).

**Expected file:** `oven.glb`

## Specifications
- **Scale**: ~1.8 meters tall
- **Pivot**: Floor center (y=0)
- **Meshes** (as separate named objects for animation):
  - `Body` — outer enclosure
  - `Cavity` — inner cavity (dark)
  - `Door` — hinged door (pivot at left edge, y=0.85, z=0.74)
  - `DoorGlass` — glass window in door
  - `Handle` — door handle
  - `Rack` — oven rack
  - `Legs` — 4 legs
- **Materials**: Enamel exterior, dark interior, glass with slight transmission.

## Animation Integration
The `OvenModel` component animates via props:
```tsx
<OvenModel
  doorOpen={0.8}    // 0–1 door rotation
  panIn={0.9}       // 0–1 pan slide (outside → rack)
  heat={0.6}        // 0–1 baking intensity (light + sparkles)
/>
```
Your GLB should have `Door` and a `Pan` mesh (or the component uses procedural pan).

## Automatic Detection
`OvenModel` uses `<ModelOrFallback url="/assets/oven/oven.glb">`. Drop the GLB to auto-replace.

## Testing
1. Place `oven.glb` in this folder
2. Run `npm run dev`
3. Visit `/` and scroll to Scene 5