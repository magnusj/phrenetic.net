/**
 * Deterministic pseudo-random numbers in [0, 1) (mulberry32). The same seed always gives the same
 * sequence, so code that runs during render stays pure and gives the same result every time.
 */
export const createSeededRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
