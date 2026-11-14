import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/core/rng.js';

describe('makeRng', () => {
  it('같은 시드는 같은 수열을 낸다', () => {
    const a = makeRng(42), b = makeRng(42);
    const xs = Array.from({ length: 10 }, a), ys = Array.from({ length: 10 }, b);
    expect(xs).toEqual(ys);
  });
  it('다른 시드는 다른 수열을 낸다', () => {
    const a = makeRng(1), b = makeRng(2);
    expect(Array.from({ length: 10 }, a)).not.toEqual(Array.from({ length: 10 }, b));
  });
  it('값은 0 이상 1 미만이다', () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});
