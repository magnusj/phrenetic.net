import { CHAR_ROM, toScreenCodes } from '../charset';
import { SCREEN_RAM, COLUMNS } from '../text';
import { BLACK, WHITE, BLUE, PURPLE, LIGHT_BLUE, CYAN, BROWN, RED, ORANGE, LIGHT_RED, YELLOW } from '../palette';
import { DARK_GREY, GREY, LIGHT_GREY, GREEN, LIGHT_GREEN } from '../palette';
import type { Part } from './demo';

/*
 * Part 4: DYCP (different Y character position) scroller over raster bars.
 *
 * A 40x12 block of the screen holds the scroller. 256 codes can't cover 480 cells, so a raster
 * split switches $D018 to a second charset halfway down: both halves use the same 240 codes,
 * numbered down each column, and every column owns a 96-line strip across the two charsets.
 * Each frame the strips are cleared and every letter is redrawn at its own height.
 *
 * The font is a 16x16 multicolour font, two columns per letter: a body colour ($D023) changed
 * every 4 raster lines, so the letters shimmer as they bob, and a black drop shadow ($D022)
 * that keeps them readable over the bars.
 * The text scrolls with $D016 fine scroll plus a character step every 8 pixels,
 * in 38-column mode so letters slide cleanly off the edges.
 * Behind it, raster bars recolour $D021 and $D020 on every line.
 */

const CHARSETS = [0x2000, 0x2800];
const D018 = [0x18, 0x1a]; // screen $0400 with charset $2000, then $2800
const DYCP_ROW = 7;
const HALF_ROWS = 6;
const DYCP_ROWS = HALF_ROWS * 2;
const HALF_LINES = HALF_ROWS * 8;
const STRIP_LINES = DYCP_ROWS * 8;
const FIRST_LINE = 0x33 + DYCP_ROW * 8;
const SPLIT_LINE = FIRST_LINE + HALF_LINES; // first line of the lower half
const GLYPH_LINES = 16;
const LETTER_WIDTH = 16; // pixels: two columns per letter
const AMPLITUDE = STRIP_LINES - GLYPH_LINES;
const BLANK_CODE = 0xff;

// Letter body colour ($D023) by raster line, 4 lines per colour
const BODY_GRADIENT = [WHITE, YELLOW, LIGHT_GREEN, CYAN, LIGHT_BLUE, CYAN, LIGHT_GREEN, YELLOW];

const BAR_LINES_PER_COLOR = 2;
const BARS = [
  [BLUE, PURPLE, LIGHT_BLUE, CYAN, WHITE, CYAN, LIGHT_BLUE, PURPLE, BLUE],
  [BROWN, RED, ORANGE, LIGHT_RED, YELLOW, WHITE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN],
  [DARK_GREY, GREY, LIGHT_GREY, WHITE, LIGHT_GREY, GREY, DARK_GREY],
  [GREEN, LIGHT_GREEN, WHITE, LIGHT_GREEN, GREEN],
  [PURPLE, LIGHT_RED, WHITE, LIGHT_RED, PURPLE],
  [BLUE, LIGHT_BLUE, WHITE, LIGHT_BLUE, BLUE],
];

// The text scrolls through exactly once in the part (leading spaces bring it in from the right)
const TEXT = ' '.repeat(20) + 'EVERY LETTER REDRAWN AT ITS OWN HEIGHT... ALIVE BY CHOCK STILL ROCKS!';

// 16x16 multicolour letters from the 8x8 charset: each pixel becomes one multicolour pixel
// (2 wide) by 2 lines. Two bytes per line: left and right column.
const buildFont = (): Uint8Array => {
  const font = new Uint8Array(64 * GLYPH_LINES * 2);
  for (let code = 0; code < 64; code++) {
    const lit = (gx: number, gy: number) =>
      gx >= 0 && gx < 8 && gy >= 0 && gy < 8 && ((CHAR_ROM[code * 8 + gy] >> (7 - gx)) & 1) === 1;
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        let pair = 0;
        if (lit(gx, gy)) pair = 2; // body
        else if (lit(gx - 1, gy - 1)) pair = 1; // shadow, one pixel right and down
        if (!pair) continue;
        for (let dy = 0; dy < 2; dy++) {
          const index = (code * GLYPH_LINES + gy * 2 + dy) * 2 + (gx >> 2);
          font[index] |= pair << (6 - (gx & 3) * 2);
        }
      }
    }
  }
  return font;
};

const FONT = buildFont();

export const createDycpPart = (durationFrames: number): Part => {
  let frame = 0;
  const textCodes = toScreenCodes(TEXT);
  const speed = (textCodes.length * LETTER_WIDTH) / durationFrames;
  const barColor = new Uint8Array(312);

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xd018, D018[0]);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      vic.poke(0xd022, BLACK);
      for (const charset of CHARSETS) vic.ram.fill(0, charset, charset + 0x800);
      vic.ram.fill(BLANK_CODE, SCREEN_RAM, SCREEN_RAM + 1000);
      for (let col = 0; col < COLUMNS; col++) {
        for (let row = 0; row < DYCP_ROWS; row++) {
          const offset = (DYCP_ROW + row) * COLUMNS + col;
          vic.ram[SCREEN_RAM + offset] = col * HALF_ROWS + (row % HALF_ROWS);
          vic.colorRam[offset] = 0x08 | WHITE; // multicolour (the colour RAM pair is unused)
        }
      }
    },

    frame(vic) {
      const t = frame / 50;
      frame++;
      const position = Math.floor(frame * speed);
      const fine = position & 7;
      const firstColumn = position >> 3; // in 8-pixel columns of the text

      // Multicolour, 38 columns; fine scroll moves the text left by `fine` pixels
      vic.poke(0xd016, 0xd0 | (7 - fine));

      for (const charset of CHARSETS) vic.ram.fill(0, charset, charset + COLUMNS * HALF_LINES);
      for (let col = 0; col < COLUMNS; col++) {
        const textColumn = firstColumn + col;
        const letter = textColumn >> 1;
        const half = textColumn & 1;
        const code = letter < textCodes.length ? textCodes[letter] : 0x20;
        if (code === 0x20) continue;
        // A gentle wave travelling right, against the scroll, so each letter bobs as it passes.
        // Both columns of a letter use its centre so the letter stays in one piece.
        const centre = letter * LETTER_WIDTH - position + LETTER_WIDTH / 2;
        const y = Math.round((Math.sin(centre * 0.02 - t * 1.6) * 0.5 + 0.5) * AMPLITUDE);
        for (let line = 0; line < GLYPH_LINES; line++) {
          const stripLine = y + line;
          const lower = stripLine < HALF_LINES ? 0 : 1;
          const addr = CHARSETS[lower] + col * HALF_LINES + stripLine - lower * HALF_LINES;
          vic.ram[addr] = FONT[(code * GLYPH_LINES + line) * 2 + half];
        }
      }

      barColor.fill(BLACK);
      BARS.forEach((bar, n) => {
        const height = bar.length * BAR_LINES_PER_COLOR;
        const top = Math.round(150 + Math.sin(t * 1.7 + n * 1.05) * 105 - height / 2);
        for (let j = 0; j < height; j++) {
          const line = top + j;
          if (line >= 0 && line < 312) barColor[line] = bar[Math.floor(j / BAR_LINES_PER_COLOR)];
        }
      });
    },

    rasterLine(vic, line) {
      if (line === 0) vic.poke(0xd018, D018[0]);
      if (line === SPLIT_LINE) vic.poke(0xd018, D018[1]);
      if (line >= FIRST_LINE && line < FIRST_LINE + STRIP_LINES) {
        vic.poke(0xd023, BODY_GRADIENT[((line - FIRST_LINE) >> 2) % BODY_GRADIENT.length]);
      }
      vic.poke(0xd020, barColor[line]);
      vic.poke(0xd021, barColor[line]);
    },
  };
};
