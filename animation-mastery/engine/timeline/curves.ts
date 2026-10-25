/** Deterministic frame tracks. Easing belongs to a property/segment, not a scene. */
export type Point = readonly [number, number];
export type Ease = 'linear' | 'hold' | 'smooth' | 'accelerate' | 'decelerate' | readonly [number, number, number, number];
export type Key = {frame: number; value: number; ease?: Ease};
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function easeAt(value: number, ease: Ease = 'linear'): number {
  const t = clamp(value);
  if (ease === 'linear') return t;
  if (ease === 'hold') return t < 1 ? 0 : 1;
  if (ease === 'smooth') return t * t * (3 - 2 * t);
  if (ease === 'accelerate') return t * t;
  if (ease === 'decelerate') return 1 - (1 - t) ** 3;
  const [x1, y1, x2, y2] = ease;
  const cubic = (a: number, b: number, u: number) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u * u * b + u ** 3;
  let low = 0, high = 1;
  for (let i = 0; i < 24; i++) {
    const u = (low + high) / 2;
    if (cubic(x1, x2, u) < t) low = u; else high = u;
  }
  return cubic(y1, y2, (low + high) / 2);
}

export function track(frame: number, keys: readonly Key[]): number {
  if (!keys.length) throw new Error('A property track needs keys');
  if (frame <= keys[0].frame) return keys[0].value;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (b.frame <= a.frame) throw new Error('Track keys must have strictly increasing frames');
    if (frame <= b.frame) return mix(a.value, b.value, easeAt((frame - a.frame) / (b.frame - a.frame), b.ease));
  }
  return keys[keys.length - 1].value;
}

export const phase = (f: number, a: number, b: number, ease: Ease = 'smooth') => {
  if (b <= a) throw new Error('A phase needs a positive duration');
  return easeAt((f - a) / (b - a), ease);
};
export const keys = (items: readonly (readonly [number, number, Ease?])[]): Key[] => items.map(([frame, value, ease]) => ({frame, value, ease}));

export type StoryEvent = {id: string; frame: number; cause: string; actors: readonly string[]; consequence: string};
export function eventWindow(frame: number, event: StoryEvent, before: number, after: number) {
  return {age: frame - event.frame, active: frame >= event.frame - before && frame <= event.frame + after};
}

/** A fast release after hesitation, inspired by measured creator-hand spacing.
 * This is a reusable authored approximation, not the source's recovered curve. */
export const hesitantRelease = (f: number, start: number, duration: number) => track(f, keys([
  [start, 0], [start + duration * .25, .14, 'smooth'],
  [start + duration * .50, .21, 'decelerate'],
  [start + duration * .80, .91, 'accelerate'], [start + duration, 1, 'decelerate'],
]));
