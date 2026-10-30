/** Invert the projected quadrilateral, including perspective and inverted faces. */
export function surfacePoint(points: { x: number; y: number }[], x: number, y: number) {
  const [p0, p1, p2, p3] = points
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y
  const det = dx1 * dy2 - dx2 * dy1
  if (Math.abs(det) < .0001) return null
  const g = (dx3 * dy2 - dx2 * dy3) / det, h = (dx1 * dy3 - dx3 * dy1) / det
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + h * p3.x
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + h * p3.y
  const aa = a - x * g, bb = b - x * h, dd = d - y * g, ee = e - y * h
  const determinant = aa * ee - bb * dd
  if (Math.abs(determinant) < .0001) return null
  return { x: ((x - p0.x) * ee - bb * (y - p0.y)) / determinant,
    y: (aa * (y - p0.y) - (x - p0.x) * dd) / determinant }
}
