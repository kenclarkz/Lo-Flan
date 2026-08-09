import * as THREE from 'three'

/**
 * Generates a soft radial-gradient sprite texture at runtime (used for
 * steam, dust, glow particles). No external asset required.
 */
export function makeSoftCircleTexture(
  size = 128,
  color = 'rgba(255,255,255,1)'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, color)
  g.addColorStop(0.35, color)
  g.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
