// Color helpers. Derive translucent variants from brand primitives instead of
// hand-typing rgba() strings.

/**
 * Returns an `rgba(r,g,b,a)` string from a 6-digit hex color and an alpha (0..1).
 * withAlpha('#FF2D6F', 0.18) === 'rgba(255,45,111,0.18)'
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
