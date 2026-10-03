import { C64_COLORS, BLACK } from '../palette';
import { paintSunset, PICTURE_WIDTH, PICTURE_HEIGHT } from '../graphics/sunset';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 9: an FLI picture, fading in as For You starts.
 *
 * FLI (flexible line interpretation): in multicolour bitmap mode, $D018 switches between 8 screens,
 * one per pixel line, and $D011 is written at cycle 15 so a bad line starts late on every line. The
 * VIC then fetches fresh screen colours for every line, so each 4x1 pixel cell can have its own two
 * screen colours, plus the colour RAM colour of its 4x8 cell and the black background. The late bad
 * line makes the first 3 characters read $FF from the bus: the grey FLI stripe on the left. As in
 * many demos, a column of black Y-expanded sprites covers it; their pointers are set in all 8 screens
 * because the VIC reads them from whichever screen $D018 selects.
 *
 * Memory (VIC bank 1): screens $4000-$5FFF (one per pixel line of a row), bitmap $6000-$7F3F,
 * cover sprite $7F40.
 */

const BANK = 0x4000;
const screenAddr = (line: number) => BANK + line * 0x400;
const BITMAP = 0x6000;
const COVER_SPRITE = 0x7f40;
const COVER_POINTER = (COVER_SPRITE - BANK) / 64;
const COVER_SPRITES = 5;
const FIRST_LINE = 0x33;
const LAST_LINE = FIRST_LINE + PICTURE_HEIGHT - 1;

// One step darker for each colour, following brightness within a hue
const DARKER = [0, 15, 9, 14, 6, 11, 0, 15, 9, 0, 8, 0, 11, 5, 4, 12];
const FADE_STEPS = 5;
const FADE_FRAMES_PER_STEP = 40;

const rgb = (c: number) => [(C64_COLORS[c] >> 16) & 0xff, (C64_COLORS[c] >> 8) & 0xff, C64_COLORS[c] & 0xff];
const distance = (a: number, b: number) => {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
};

interface FliImage {
  bitmap: Uint8Array; // 8000 bytes
  screens: Uint8Array[]; // 8 x 1000
  colorRam: Uint8Array; // 1000
  stars: [number, number][];
  reflection: [number, number][];
}

// Convert the painting under FLI's colour rules
const convert = (): FliImage => {
  const { pixels, stars, reflection } = paintSunset();
  const bitmap = new Uint8Array(8000);
  const screens = Array.from({ length: 8 }, () => new Uint8Array(1000));
  const colorRam = new Uint8Array(1000);

  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 40; col++) {
      const cell = row * 40 + col;
      const at = (x: number, y: number) => pixels[(row * 8 + y) * PICTURE_WIDTH + col * 4 + x];

      // Colour RAM: the most common non-background colour in the 4x8 block
      const blockCounts = new Array<number>(16).fill(0);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) blockCounts[at(x, y)]++;
      blockCounts[BLACK] = 0;
      const shared = blockCounts.indexOf(Math.max(...blockCounts));
      colorRam[cell] = shared;

      for (let y = 0; y < 8; y++) {
        // Screen colours for this 4x1 strip: its two most common colours not already available
        const counts = new Array<number>(16).fill(0);
        for (let x = 0; x < 4; x++) counts[at(x, y)]++;
        counts[BLACK] = 0;
        counts[shared] = 0;
        const order = counts.map((n, c) => [n, c]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]);
        const high = order[0]?.[1] ?? shared;
        const low = order[1]?.[1] ?? shared;
        screens[y][cell] = (high << 4) | low;

        const choices = [BLACK, high, low, shared]; // bit pairs 00, 01, 10, 11
        let byte = 0;
        for (let x = 0; x < 4; x++) {
          const c = at(x, y);
          let best = 0;
          for (let k = 1; k < 4; k++) if (distance(c, choices[k]) < distance(c, choices[best])) best = k;
          byte |= best << (6 - x * 2);
        }
        bitmap[cell * 8 + y] = byte;
      }
    }
  }
  return { bitmap, screens, colorRam, stars, reflection };
};

let cached: FliImage | null = null;

const darken = (c: number, steps: number) => {
  for (let i = 0; i < steps; i++) c = DARKER[c];
  return c;
};

export const createFliPart = (durationFrames: number): Part => {
  let frame = 0;
  let fadeShown = -1;
  const image = (cached ??= convert());

  const writeColors = (vic: Vic, steps: number) => {
    image.screens.forEach((screen, line) => {
      const base = screenAddr(line);
      for (let i = 0; i < 1000; i++) {
        vic.ram[base + i] = (darken(screen[i] >> 4, steps) << 4) | darken(screen[i] & 15, steps);
      }
    });
    for (let i = 0; i < 1000; i++) vic.colorRam[i] = darken(image.colorRam[i], steps);
  };

  // Clear a pixel to background black (bit pair 00) or restore it
  const setPixelVisible = (vic: Vic, x: number, y: number, visible: boolean) => {
    const offset = (Math.floor(y / 8) * 40 + Math.floor(x / 4)) * 8 + (y & 7);
    const mask = 3 << (6 - (x & 3) * 2);
    const original = image.bitmap[offset] & mask;
    vic.ram[BITMAP + offset] = (vic.ram[BITMAP + offset] & ~mask) | (visible ? original : 0);
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xdd00, 0x02); // VIC bank 1
      vic.poke(0xd011, 0x3b); // bitmap mode
      vic.poke(0xd016, 0xd8); // multicolour
      vic.poke(0xd018, 0x08);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      vic.ram.set(image.bitmap, BITMAP);

      // Black sprites over the FLI stripe: 24 pixels wide, 5 x 42 lines tall
      vic.ram.fill(0xff, COVER_SPRITE, COVER_SPRITE + 63);
      for (let i = 0; i < COVER_SPRITES; i++) {
        for (let line = 0; line < 8; line++) vic.ram[screenAddr(line) + 0x3f8 + i] = COVER_POINTER;
        vic.poke(0xd000 + i * 2, 24);
        vic.poke(0xd001 + i * 2, FIRST_LINE - 1 + i * 42);
        vic.poke(0xd027 + i, BLACK);
      }
      vic.poke(0xd015, (1 << COVER_SPRITES) - 1);
      vic.poke(0xd017, (1 << COVER_SPRITES) - 1);
      writeColors(vic, FADE_STEPS);
      fadeShown = FADE_STEPS;
    },

    frame(vic) {
      frame++;
      const fade = Math.max(0, FADE_STEPS - Math.floor(frame / FADE_FRAMES_PER_STEP));
      if (fade !== fadeShown) {
        writeColors(vic, fade);
        fadeShown = fade;
      }
      if (fade > 0) return;

      // Stars twinkle and the reflection shimmers by switching single pixels to black and back
      const t = frame / 50;
      image.stars.forEach(([x, y], i) => {
        setPixelVisible(vic, x, y, Math.sin(t * (1.3 + (i % 5) * 0.4) + i * 2.1) > -0.6);
      });
      image.reflection.forEach(([x, y], i) => {
        if (i % 3 === frame % 3) setPixelVisible(vic, x, y, Math.sin(t * 3 + x * 0.7 + y * 1.3) > -0.3);
      });
    },

    rasterLine(vic, line) {
      if (line === 0) vic.poke(0xd011, 0x3b);
      if (line < FIRST_LINE || line > LAST_LINE) return;
      // Screen for this pixel line of the row, then a late bad line at cycle 15
      vic.poke(0xd018, (((line - FIRST_LINE) & 7) << 4) | 0x08);
      if (line > FIRST_LINE) vic.pokeAt(15, 0xd011, 0x38 | (line & 7));
    },
  };
};
