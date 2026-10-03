import { BLACK, BLUE, PURPLE, LIGHT_BLUE, CYAN, LIGHT_GREEN, WHITE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN } from '../palette';
import type { Part } from './demo';

/*
 * Part 5a: bitmap plasma.
 *
 * The bitmap is a fixed checkerboard, so each 8x8 cell shows a 50/50 mix of its two screen RAM
 * colours. The plasma only rewrites the 1000 screen RAM bytes: a cell either shows one colour solid
 * or blends two neighbours in a brightness-ordered rainbow, giving smooth gradients from 16 colours.
 * It updates at 25 fps, which is what a C64 could manage for this much screen RAM.
 *
 * Memory: bitmap at $2000, screen RAM at $0400.
 */

const BITMAP = 0x2000;
const SCREEN = 0x0400;
const D018 = 0x18; // screen $0400, bitmap $2000
const COLUMNS = 40;
const ROWS = 25;

// A cyclic rainbow ordered so each colour sits next to colours of similar brightness
const RAMP = [BLACK, BLUE, PURPLE, LIGHT_BLUE, CYAN, LIGHT_GREEN, WHITE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN];
const STEPS = RAMP.length * 2; // solid and blended steps

export const createPlasmaPart = (durationFrames: number): Part => {
  let frame = 0;

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xd011, 0x3b); // bitmap mode
      vic.poke(0xd016, 0xc8);
      vic.poke(0xd018, D018);
      vic.poke(0xd020, BLACK);
      for (let i = 0; i < 8000; i++) vic.ram[BITMAP + i] = i & 1 ? 0x55 : 0xaa;
    },

    frame(vic) {
      frame++;
      if (frame & 1) return; // 25 fps
      const t = frame / 50;
      const cx = 20 + Math.sin(t * 0.6) * 12;
      const cy = 12 + Math.cos(t * 0.45) * 7;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
          const dx = col - cx;
          const dy = (row - cy) * 1.6;
          const v =
            Math.sin(col * 0.19 + t * 0.9) +
            Math.sin(row * 0.27 - t * 1.1) +
            Math.sin((col - row) * 0.12 + t * 0.6) +
            Math.sin(Math.sqrt(dx * dx + dy * dy) * 0.42 - t * 1.4);
          const step = Math.floor(((v / 8 + 0.5) * STEPS * 1.4 + t * 4) % STEPS);
          const a = RAMP[step >> 1];
          const b = step & 1 ? RAMP[((step >> 1) + 1) % RAMP.length] : a;
          vic.ram[SCREEN + row * COLUMNS + col] = (a << 4) | b;
        }
      }
    },
  };
};
