import { printAt, SCREEN_RAM } from '../text';
import { SpriteMultiplexer, type VirtualSprite } from '../multiplexer';
import { BLACK, WHITE, DARK_GREY, GREY, LIGHT_RED, YELLOW, LIGHT_GREEN, CYAN, LIGHT_BLUE, PURPLE } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 3: a sprite multiplexer. 80 balls from the 8 hardware sprites.
 *
 * The multiplexer (see ../multiplexer.ts) sorts the balls each frame and reuses the hardware
 * sprites down the screen. Balls it can't fit are dropped as on the real machine, so the
 * patterns keep at most 8 balls in any 22 lines.
 * The top and bottom borders are opened so the balls use the whole screen height.
 */

const BALL_COUNT = 80;
const PAIRS = BALL_COUNT / 2;
const SPRITE_LINES = 21;
const FIRST_LINE = 16;
const LAST_LINE = 287;
const Y_RANGE = 264; // pairs spaced 6.6 lines apart: any 8 consecutive balls span 26 lines
const SCROLL_SPEED = 0.8; // lines per frame
const X_CENTER = 172;

const BIG_BALL = 0x2000;
const SMALL_BALL = 0x2040;
const BIG_POINTER = BIG_BALL / 64;
const SMALL_POINTER = SMALL_BALL / 64;

const RAINBOW = [LIGHT_RED, YELLOW, LIGHT_GREEN, CYAN, LIGHT_BLUE, PURPLE];
const PATTERN_FRAMES = 330; // ~6.6 s per pattern
const BLEND_FRAMES = 75;

// A shaded multicolour ball: white highlight ($D025), body (sprite colour), shadow rim ($D026)
const drawBall = (vic: Vic, addr: number, radiusX: number, radiusY: number) => {
  for (let line = 0; line < SPRITE_LINES; line++) {
    for (let col = 0; col < 12; col++) {
      const nx = (col * 2 + 1 - 12) / radiusX;
      const ny = (line - 10) / radiusY;
      const d2 = nx * nx + ny * ny;
      if (d2 > 0.92) continue; // trim single pixels on the rim
      const nz = Math.sqrt(1 - d2);
      const light = -nx * 0.45 - ny * 0.55 + nz * 0.7;
      const pair = light > 0.88 ? 1 : light > 0.3 ? 2 : 3;
      vic.ram[addr + line * 3 + (col >> 2)] |= pair << (6 - (col & 3) * 2);
    }
  }
};

// The three patterns: x position for a ball given its pair, strand and time
const PATTERNS = [
  // DNA double helix: the strands circle each other
  (pair: number, strand: number, t: number) => {
    const angle = t * 1.8 + pair * 0.32 + strand * Math.PI;
    return { x: X_CENTER + Math.sin(angle) * 120, front: Math.cos(angle) > 0 };
  },
  // Twin sine waves
  (pair: number, strand: number, t: number) => {
    const phase = t * 1.5 + pair * 0.16 + strand * Math.PI * 0.5;
    return { x: X_CENTER + Math.sin(phase) * 130, front: strand === 0 };
  },
  // Scatter wave
  (pair: number, strand: number, t: number) => {
    const phase = t * 2.6 + pair * 0.9 + strand * 2.1;
    return { x: X_CENTER + Math.sin(phase) * 135 * Math.sin(t * 0.7 + pair * 0.05), front: Math.sin(phase * 0.5) > 0 };
  },
];

export const createMultiplexerPart = (durationFrames: number): Part & { readonly dropped: number } => {
  let frame = 0;
  const balls: VirtualSprite[] = Array.from({ length: BALL_COUNT }, () => ({ x: 0, line: 0, pointer: 0, color: 0 }));
  const multiplexer = new SpriteMultiplexer(SCREEN_RAM);

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      drawBall(vic, BIG_BALL, 11, 10);
      drawBall(vic, SMALL_BALL, 7, 6.5);
      vic.poke(0xd015, 0xff);
      vic.poke(0xd01c, 0xff);
      vic.poke(0xd025, WHITE);
      vic.poke(0xd026, DARK_GREY);
      printAt(vic, 10, 12, `${BALL_COUNT} BALLS - 8 SPRITES`, GREY);
    },

    frame() {
      const t = frame / 50;
      const pattern = Math.floor(frame / PATTERN_FRAMES) % PATTERNS.length;
      const into = frame % PATTERN_FRAMES;
      const blend = pattern > 0 && into < BLEND_FRAMES ? into / BLEND_FRAMES : 1;
      const from = PATTERNS[(pattern + PATTERNS.length - 1) % PATTERNS.length];
      const to = PATTERNS[pattern];
      frame++;

      for (let i = 0; i < BALL_COUNT; i++) {
        const pair = i >> 1;
        const strand = i & 1;
        const target = to(pair, strand, t);
        const x = blend < 1 ? from(pair, strand, t).x * (1 - blend) + target.x * blend : target.x;
        const ball = balls[i];
        ball.x = Math.max(0, Math.min(343, x));
        ball.line = FIRST_LINE + ((pair * (Y_RANGE / PAIRS) + frame * SCROLL_SPEED) % Y_RANGE);
        ball.line = Math.min(LAST_LINE, Math.round(ball.line));
        ball.pointer = target.front ? BIG_POINTER : SMALL_POINTER;
        ball.color = RAINBOW[Math.floor(pair / 3) % RAINBOW.length];
      }
      multiplexer.schedule(balls);
    },

    rasterLine(vic, line) {
      // Keep the top and bottom borders open: 24 rows on line 249, 25 again at the top
      if (line === 0) vic.poke(0xd011, 0x1b);
      if (line === 249) vic.poke(0xd011, 0x13);
      multiplexer.rasterLine(vic, line);
    },

    get dropped() {
      return multiplexer.dropped;
    },
  };
};
