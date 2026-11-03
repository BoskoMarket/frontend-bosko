import { WORK_FALLBACK_RATIO, WORK_MAX_RATIO, WORK_MIN_RATIO } from '../constants';

/** width / height of a photo, clamped; a fixed ratio when the backend sent no dimensions. */
export function workRatio(item: { width: number | null; height: number | null }): number {
  const { width, height } = item;
  if (!width || !height || width <= 0 || height <= 0) return WORK_FALLBACK_RATIO;
  return Math.min(WORK_MAX_RATIO, Math.max(WORK_MIN_RATIO, width / height));
}

/** Greedy masonry: each item goes to the currently shortest column, keeping feed order. */
export function splitIntoColumns<T extends { width: number | null; height: number | null }>(
  items: readonly T[],
  columns = 2,
): T[][] {
  const result: T[][] = Array.from({ length: columns }, () => []);
  const heights = new Array<number>(columns).fill(0);
  for (const item of items) {
    let target = 0;
    for (let i = 1; i < columns; i++) if (heights[i] < heights[target]) target = i;
    result[target].push(item);
    heights[target] += 1 / workRatio(item);
  }
  return result;
}
