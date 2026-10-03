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
const SPLIT_LINE = 0x33 + (DYCP_ROW + HALF_ROWS) * 8; // first line of the lower half
const GLYPH_LINES = 16; // 8x8 font doubled vertically
const AMPLITUDE = STRIP_LINES - GLYPH_LINES;
const BLANK_CODE = 0xff;
const SPEED = 2; // pixels per frame

const ROW_COLORS = [LIGHT_BLUE, LIGHT_BLUE, CYAN, CYAN, WHITE, WHITE, WHITE, WHITE, CYAN, CYAN, LIGHT_BLUE, LIGHT_BLUE];

const BAR_LINES_PER_COLOR = 2;
const BARS = [
  [BLUE, PURPLE, LIGHT_BLUE, CYAN, WHITE, CYAN, LIGHT_BLUE, PURPLE, BLUE],
  [BROWN, RED, ORANGE, LIGHT_RED, YELLOW, WHITE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN],
  [DARK_GREY, GREY, LIGHT_GREY, WHITE, LIGHT_GREY, GREY, DARK_GREY],
  [GREEN, LIGHT_GREEN, WHITE, LIGHT_GREEN, GREEN],
  [PURPLE, LIGHT_RED, WHITE, LIGHT_RED, PURPLE],
  [BLUE, LIGHT_BLUE, WHITE, LIGHT_BLUE, BLUE],
];

const TEXT =
  '          DIFFERENT Y CHAR POSITIONS, THE C64 WAY: EVERY LETTER REDRAWN INTO THE CHARSET ' +
  'FIFTY TIMES A SECOND...   ALIVE BY CHOCK STILL ROCKS AFTER ALL THESE YEARS...   ' +
  'PHRENETIC SAYS HI TO EVERYONE WHO EVER TYPED LOAD"*",8,1 ...          ';

export const createDycpPart = (durationFrames: number): Part => {
  let frame = 0;
  let position = 0;
  const textCodes = toScreenCodes(TEXT);
  const barColor = new Uint8Array(312);

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xd018, D018[0]);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      for (const charset of CHARSETS) vic.ram.fill(0, charset, charset + 0x800);
      vic.ram.fill(BLANK_CODE, SCREEN_RAM, SCREEN_RAM + 1000);
      for (let col = 0; col < COLUMNS; col++) {
        for (let row = 0; row < DYCP_ROWS; row++) {
          const offset = (DYCP_ROW + row) * COLUMNS + col;
          vic.ram[SCREEN_RAM + offset] = col * HALF_ROWS + (row % HALF_ROWS);
          vic.colorRam[offset] = ROW_COLORS[row];
        }
      }
    },

    frame(vic) {
      const t = frame / 50;
      frame++;
      position += SPEED;
      const fine = position & 7;
      const first = position >> 3;

      // 38 columns, fine scroll moves the text left by `fine` pixels
      vic.poke(0xd016, 0xc0 | (7 - fine));

      for (const charset of CHARSETS) vic.ram.fill(0, charset, charset + COLUMNS * HALF_LINES);
      for (let col = 0; col < COLUMNS; col++) {
        // A smooth wave travelling right, against the scroll, so each letter bobs up and down as it passes
        const code = textCodes[(first + col) % textCodes.length];
        const x = col * 8 - fine;
        const y = Math.round((Math.sin(x * 0.028 - t * 2.4) * 0.5 + 0.5) * AMPLITUDE);
        for (let line = 0; line < GLYPH_LINES; line++) {
          const stripLine = y + line;
          const half = stripLine < HALF_LINES ? 0 : 1;
          const addr = CHARSETS[half] + col * HALF_LINES + stripLine - half * HALF_LINES;
          vic.ram[addr] = CHAR_ROM[code * 8 + (line >> 1)];
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
      vic.poke(0xd020, barColor[line]);
      vic.poke(0xd021, barColor[line]);
    },
  };
};
