export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const pInRange = (p: number, a: number, b: number) =>
  clamp((p - a) / (b - a), 0, 1)

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Progress eased within a [start, end] range of the total scene. */
export const seg = (p: number, a: number, b: number) =>
  easeInOutCubic(pInRange(p, a, b))
