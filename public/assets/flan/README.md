# Flan Assets

Drop your hero flan GLB here to replace the procedural flan in Scene 1 (Hero) and Scene 6 (Final Reveal).

**Expected file:** `flan.glb`

## Specifications
- **Scale**: ~1.2 meters tall (plate base at y=0, flan top at y≈1.1)
- **Pivot**: Center of plate base (y=0)
- **Meshes expected** (optional, for granular control):
  - `Plate` — ceramic plate
  - `Custard` — custard dome
  - `CaramelCap` — caramel top layer
  - `Drips` — individual caramel drips (16–18)
- **Materials**: Our lighting rig (`WarmLighting` + `StudioEnv`) provides reflections. Use standard PBR.
- **No lights/cameras** needed in the GLB.

## Automatic Detection
The `FlanModel` component wraps the procedural flan in `<ModelOrFallback url="/assets/flan/flan.glb">`. When `flan.glb` exists, it renders the GLB instead.

## Testing
1. Place `flan.glb` in this folder
2. Run `npm run dev`
3. Visit `/` — the hero flan should be your Blender model
4. Scroll to the final reveal (Scene 6) — same model reused