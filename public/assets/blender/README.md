# Blender Assets

Drop Blender and Pan GLBs here for Scene 3 (Blending) and Scene 4 (Pouring).

**Expected files:**
- `blender.glb` — Complete blender: base, jar (glass), lid, blade, motor buttons
- `pan.glb`     — 9-inch (23cm) round baking pan

## Blender Specifications
- **Scale**: ~1.8 meters tall
- **Pivot**: Base bottom center (y=0)
- **Components** (as separate meshes for animation):
  - `Base` — motor housing
  - `Jar` — glass cylinder (double-sided, transmission material)
  - `Lid` — hinged lid with knob
  - `Blade` — 4-blade assembly (rotates on Y)
  - `Buttons` — power/speed indicators
- **Materials**: Glass jar uses transmission (our `StudioBackdrop` provides depth). Metal parts: rough metalness.

## Pan Specifications
- **Scale**: 9-inch diameter (0.23m), height ~0.22m
- **Pivot**: Center bottom (y=0)
- **Meshes**: Single pan mesh (body + rim)
- **Material**: Dark metal / carbon steel look

## Animation Integration
The `BlenderModel` component accepts props for animation:
```tsx
<BlenderModel
  tilt={0.58}           // Pour tilt (radians)
  animateLid={true}     // Animated lid
  lidProgress={0.8}     // 0–1 lid close
  motor={0.6}           // Blade spin intensity
  batterLevel={0.85}    // Inner batter fill
  distort={0.3}         // Surface distort
/>
```
Your GLB should have these named meshes for the component to animate them (or the component falls back to procedural meshes for animation).

## Automatic Detection
`BlenderModel` and `PanModel` use `<ModelOrFallback>` with their respective URLs. Drop the GLBs to auto-replace.

## Testing
1. Place `blender.glb` and `pan.glb` in this folder
2. Run `npm run dev`
3. Visit `/` and scroll to Scenes 3 & 4