# Ingredient Assets

Drop individual ingredient GLBs here to replace the procedural ingredients in Scene 2 (Ingredient Explosion).

**Expected files:**
- `eggs.glb`        — 3 free-range eggs
- `milk.glb`        — glass milk bottle with milk
- `sugar.glb`       — sugar bowl with cubes
- `vanilla.glb`     — Madagascar vanilla pods (2–3)
- `cream.glb`       — cream pitcher
- `caramel.glb`     — caramel bottle/jar

## Specifications
- **Scale**: ~0.3–0.5 meters (real-world size)
- **Pivot**: Center bottom of each object
- **Meshes**: Single object per file (or grouped under a root)
- **Materials**: Standard PBR. Our `StudioEnv` provides reflections.
- **No lights/cameras** needed.

## Layout Positions (Scene 2)
Ingredients float at these world positions (meters):
| Ingredient | Position (x, y, z) |
|------------|-------------------|
| eggs       | (-2.4, 0.55, 0.5) |
| milk       | (2.4, 0.15, -0.3) |
| sugar      | (0.6, -0.45, -2.4) |
| vanilla    | (-0.7, 1.05, -2.2) |
| cream      | (2.55, 0.85, 1.25) |
| caramel    | (-2.5, 0.0, 1.4) |

## Automatic Detection
Each `Ingredient` component uses `<ModelOrFallback url="/assets/ingredients/${id}.glb">`. Drop the GLB with matching filename to auto-replace.

## Testing
1. Place GLB files in this folder
2. Run `npm run dev`
3. Visit `/` and scroll to Scene 2 — ingredients should be your Blender models