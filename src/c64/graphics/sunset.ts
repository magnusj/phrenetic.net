import { BLACK, WHITE, BLUE, PURPLE, LIGHT_RED, ORANGE, YELLOW, LIGHT_GREY, GREY, DARK_GREY } from '../palette';

/*
 * An original sunset painting at the multicolour resolution of 160x200 pixels, as C64 colour
 * indices. Gradients are ordered dithers between neighbouring C64 colours, painted for FLI.
 */

export const PICTURE_WIDTH = 160;
export const PICTURE_HEIGHT = 200;

const HORIZON = 128;
const SUN_X = 84;
const SUN_Y = 124;
const SUN_RADIUS = 30;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x: number, y: number, amount: number, a: number, b: number) =>
  BAYER[(y & 3) * 4 + (x & 3)] < amount * 16 ? b : a;

// Sky stops from the top of the picture down to the horizon
const SKY: [number, number][] = [
  [0, BLACK],
  [34, BLUE],
  [70, PURPLE],
  [104, LIGHT_RED],
  [HORIZON, YELLOW],
];

const gradient = (stops: [number, number][], x: number, y: number) => {
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, c0] = stops[i];
    const [y1, c1] = stops[i + 1];
    if (y <= y1) return dither(x, y, (y - y0) / (y1 - y0), c0, c1);
  }
  return stops[stops.length - 1][1];
};

// Deterministic ridge lines for the mountains
const ridge = (x: number, base: number, height: number, seed: number) =>
  base -
  height *
    (0.55 * Math.abs(Math.sin(x * 0.045 + seed)) +
      0.3 * Math.abs(Math.sin(x * 0.11 + seed * 2.3)) +
      0.15 * Math.abs(Math.sin(x * 0.29 + seed * 5.1)));

export interface Sunset {
  pixels: Uint8Array;
  stars: [number, number][];
  reflection: [number, number][];
}

export const paintSunset = (): Sunset => {
  const pixels = new Uint8Array(PICTURE_WIDTH * PICTURE_HEIGHT);
  const stars: [number, number][] = [];
  const reflection: [number, number][] = [];
  let seed = 1994;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const set = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < PICTURE_WIDTH && y < PICTURE_HEIGHT) pixels[y * PICTURE_WIDTH + x] = c;
  };

  // Sky and sun
  for (let y = 0; y < HORIZON; y++) {
    for (let x = 0; x < PICTURE_WIDTH; x++) {
      let c = gradient(SKY, x, y);
      // Pixels are twice as wide as tall, so x distances count double
      const d = Math.hypot((x - SUN_X) * 2, y - SUN_Y) / 2;
      if (d < SUN_RADIUS) c = d < SUN_RADIUS * 0.55 ? WHITE : dither(x, y, (d - SUN_RADIUS * 0.55) / (SUN_RADIUS * 0.45), WHITE, YELLOW);
      else if (d < SUN_RADIUS + 6) c = dither(x, y, 1 - (d - SUN_RADIUS) / 6, c, YELLOW);
      set(x, y, c);
    }
  }

  // Stars in the dark part of the sky
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(random() * PICTURE_WIDTH);
    const y = Math.floor(random() * random() * 60);
    set(x, y, random() < 0.4 ? WHITE : random() < 0.6 ? LIGHT_GREY : GREY);
    stars.push([x, y]);
  }

  // Two mountain ranges with a valley where the sun sets
  for (let x = 0; x < PICTURE_WIDTH; x++) {
    const valley = 1 - Math.exp(-(((x - SUN_X) / 26) ** 2));
    const back = ridge(x, HORIZON, 34 * valley + 4, 1.7);
    const front = ridge(x, HORIZON, 22 * valley + 2, 4.2) + 6;
    for (let y = Math.floor(back); y < HORIZON; y++) set(x, y, dither(x, y, 0.5, PURPLE, BLUE));
    for (let y = Math.floor(front); y < HORIZON; y++) set(x, y, BLACK);
  }

  // Sea: dark water with the sun's reflection breaking into streaks
  for (let y = HORIZON; y < PICTURE_HEIGHT; y++) {
    const depth = (y - HORIZON) / (PICTURE_HEIGHT - HORIZON);
    for (let x = 0; x < PICTURE_WIDTH; x++) {
      let c = dither(x, y, Math.min(1, depth * 1.4), BLUE, BLACK);
      if (((y + Math.floor(x / 9)) % 7 === 0 && random() < 0.35) || (y % 11 === 0 && random() < 0.15)) c = DARK_GREY;
      set(x, y, c);
    }
    const width = 8 + depth * 22;
    for (let x = Math.floor(SUN_X - width); x <= SUN_X + width; x++) {
      const t = Math.abs(x - SUN_X) / width;
      const wave = Math.sin(y * 0.9 + x * 0.35) + Math.sin(y * 0.37 - x * 0.2);
      if (wave < 0.4 + t * 1.2) continue;
      const c = t < 0.3 ? (depth < 0.4 ? WHITE : YELLOW) : t < 0.65 ? YELLOW : depth < 0.5 ? LIGHT_RED : ORANGE;
      set(x, y, c);
      reflection.push([x, y]);
    }
  }

  return { pixels, stars, reflection };
};
