import { CHAR_ROM, toScreenCodes } from '../charset';
import { buildLogoTiles, LOGO_COLUMNS, LOGO_ROWS } from '../graphics/phreneticLogo';
import { BLACK, WHITE, BLUE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN, DARK_GREY, GREY, LIGHT_GREY } from '../palette';
import { LIGHT_BLUE, CYAN, PURPLE, LIGHT_GREEN, GREEN } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 2: the PHRENETiC logo.
 *
 * Memory map (VIC bank 1, $4000-$7FFF):
 *   $4000      screen
 *   $4800-$77FF six copies of the logo charset, each shifted one more character right (tech-tech)
 *   $7800-$79FF eight sprites holding the bottom border scroller
 *   $7FFF      idle byte (0, so open border areas show the background)
 *
 * Every visual is done the way the real machine needs:
 *   - Tech-tech: per raster line, $D018 picks a pre-shifted charset (8 px steps) and $D016 the fine scroll
 *   - FLD: the bad line that starts the logo is delayed by changing YSCROLL on each line above it
 *   - The fill colour ($D023) changes every 4 lines for a gradient no single colour cell could hold
 *   - Raster bars change $D021 per line
 *   - The bottom border is opened by switching to 24 rows on line 249, between the two border compares
 *   - The scroller is 8 X/Y-expanded sprites in the open border, recoloured per line
 */

const BANK = 0x4000;
const SCREEN = 0x4000;
const CHARSET_COUNT = 6;
const charsetAddr = (k: number) => 0x4800 + k * 0x800;
const SPRITE_DATA = 0x7800;
const SPRITE_POINTER = (SPRITE_DATA - BANK) / 64;

const LOGO_SCREEN_COLUMNS = 38; // logo plus room to shift up to 5 characters
const BLANK_CODE = 0xff;
const MAX_TECH_TECH = CHARSET_COUNT * 8 - 1;

const FLD_START = 0x30;
const FLD_MIN = 3; // keep the logo out of the top border
const FLD_BOUNCE = 64;
const LOGO_LINES = LOGO_ROWS * 8;

const SCROLLER_Y = 255; // sprites start on line 256, inside the open bottom border
const SCROLLER_LINES = 16; // 8 font rows, Y-expanded

const D011_BASE = 0x18; // screen on, 25 rows
const D016_BASE = 0x18; // multicolour, 40 columns

// Fill gradient down the logo, one entry per 4 lines
const LOGO_FILL = [WHITE, WHITE, LIGHT_GREY, YELLOW, YELLOW, LIGHT_RED, LIGHT_RED, ORANGE, ORANGE, RED, RED, BROWN];
const SCROLLER_COLORS = [WHITE, YELLOW, YELLOW, LIGHT_RED, LIGHT_RED, ORANGE, RED, BROWN];
const BAR_LINES_PER_COLOR = 2;
const BARS = [
  [BLUE, PURPLE, LIGHT_BLUE, CYAN, WHITE, CYAN, LIGHT_BLUE, PURPLE, BLUE],
  [BROWN, RED, ORANGE, LIGHT_RED, YELLOW, WHITE, YELLOW, LIGHT_RED, ORANGE, RED, BROWN],
  [DARK_GREY, GREY, LIGHT_GREY, WHITE, LIGHT_GREY, GREY, DARK_GREY],
  [GREEN, LIGHT_GREEN, WHITE, LIGHT_GREEN, GREEN],
];

const SCROLL_TEXT =
  '      PHRENETIC PRESENTS ITS FIRST COMMODORE 64 DEMO...   MUSIC: ALIVE BY CHOCK OF MANIAX, ' +
  'PLAYED ON A REAL 6581...   EVERY EFFECT RUNS ON AN EMULATED VIC-II WITH THE REAL LIMITS, ' +
  'NO CHEATING...   HOLD ON TIGHT!      ';

export const createLogoPart = (durationFrames: number): Part => {
  let frame = 0;
  let fldLines = FLD_MIN;
  let logoTop = FLD_START + FLD_MIN;
  const techTech = new Uint8Array(LOGO_LINES);
  const barColor = new Uint8Array(312);

  // Scroller: 8 font rows of 192 sprite pixels (8 sprites x 24), shifted left one pixel per frame
  const scrollRows = Array.from({ length: 8 }, () => new Uint8Array(24));
  const scrollCodes = toScreenCodes(SCROLL_TEXT);
  let scrollChar = 0;
  let scrollColumn = 0;

  const setupMemory = (vic: Vic) => {
    vic.ram.fill(0, BANK, BANK + 0x4000);
    vic.ram.fill(BLANK_CODE, SCREEN, SCREEN + 1000);

    // Each logo cell gets its own screen code; charset k draws the logo k characters further right
    const tiles = buildLogoTiles();
    for (let row = 0; row < LOGO_ROWS; row++) {
      for (let col = 0; col < LOGO_SCREEN_COLUMNS; col++) {
        const code = row * LOGO_SCREEN_COLUMNS + col;
        vic.ram[SCREEN + row * 40 + 1 + col] = code;
        vic.colorRam[row * 40 + 1 + col] = 0x08 | WHITE; // multicolour, highlight colour
        for (let k = 0; k < CHARSET_COUNT; k++) {
          const tileCol = col - k;
          if (tileCol < 0 || tileCol >= LOGO_COLUMNS) continue;
          vic.ram.set(tiles[row * LOGO_COLUMNS + tileCol], charsetAddr(k) + code * 8);
        }
      }
    }

    for (let i = 0; i < 8; i++) vic.ram[SCREEN + 0x3f8 + i] = SPRITE_POINTER + i;
  };

  const setupRegisters = (vic: Vic) => {
    vic.poke(0xdd00, 0x02); // VIC bank 1
    vic.poke(0xd011, D011_BASE | 3);
    vic.poke(0xd016, D016_BASE);
    vic.poke(0xd018, 1 << 1); // screen $4000, charset 0
    vic.poke(0xd020, BLACK);
    vic.poke(0xd021, BLACK);
    vic.poke(0xd022, BLUE);

    vic.poke(0xd015, 0xff);
    vic.poke(0xd017, 0xff);
    vic.poke(0xd01d, 0xff);
    vic.poke(0xd01c, 0x00);
    let msb = 0;
    for (let i = 0; i < 8; i++) {
      const x = i * 48;
      vic.poke(0xd000 + i * 2, x & 0xff);
      vic.poke(0xd001 + i * 2, SCROLLER_Y);
      if (x > 0xff) msb |= 1 << i;
    }
    vic.poke(0xd010, msb);
  };

  const advanceScroller = (vic: Vic) => {
    const glyph = CHAR_ROM.subarray(scrollCodes[scrollChar] * 8, scrollCodes[scrollChar] * 8 + 8);
    for (let y = 0; y < 8; y++) {
      const row = scrollRows[y];
      for (let b = 0; b < 23; b++) row[b] = ((row[b] << 1) | (row[b + 1] >> 7)) & 0xff;
      row[23] = ((row[23] << 1) | ((glyph[y] >> (7 - scrollColumn)) & 1)) & 0xff;
      for (let i = 0; i < 8; i++) {
        vic.ram.set(row.subarray(i * 3, i * 3 + 3), SPRITE_DATA + i * 64 + y * 3);
      }
    }
    if (++scrollColumn === 8) {
      scrollColumn = 0;
      scrollChar = (scrollChar + 1) % scrollCodes.length;
    }
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      setupMemory(vic);
      setupRegisters(vic);
    },

    frame(vic) {
      const t = frame / 50;
      frame++;

      // Bounce like a ball: |sin| keeps the logo landing on the top
      fldLines = FLD_MIN + Math.round(Math.abs(Math.sin(t * 2.2)) * FLD_BOUNCE);
      logoTop = FLD_START + fldLines;

      for (let i = 0; i < LOGO_LINES; i++) {
        const wave = Math.sin(t * 2.2 + i * 0.035) * 0.7 + Math.sin(t * 1.1 - i * 0.02) * 0.3;
        techTech[i] = Math.round(((wave + 1) / 2) * MAX_TECH_TECH);
      }

      barColor.fill(BLACK);
      const barsTop = logoTop + LOGO_LINES + 8;
      const barsRange = 246 - barsTop;
      BARS.forEach((bar, n) => {
        const height = bar.length * BAR_LINES_PER_COLOR;
        const top = Math.round(barsTop + (Math.sin(t * 1.6 + n * 1.4) * 0.5 + 0.5) * (barsRange - height));
        for (let j = 0; j < height; j++) {
          const line = top + j;
          if (line >= barsTop && line < 247) barColor[line] = bar[Math.floor(j / BAR_LINES_PER_COLOR)];
        }
      });

      advanceScroller(vic);
    },

    rasterLine(vic, line) {
      if (line === 0) {
        vic.poke(0xd011, D011_BASE | 3); // 25 rows again, closing the border for the next frame
        vic.poke(0xd018, 1 << 1);
        vic.poke(0xd016, D016_BASE);
      }

      // FLD: until the logo should start, keep YSCROLL one ahead so no bad line occurs
      if (line >= FLD_START && line < logoTop) vic.poke(0xd011, D011_BASE | ((line + 1) & 7));
      if (line === logoTop) vic.poke(0xd011, D011_BASE | (line & 7));

      const logoLine = line - logoTop;
      if (logoLine >= 0 && logoLine < LOGO_LINES) {
        const offset = techTech[logoLine];
        vic.poke(0xd018, ((offset >> 3) + 1) << 1);
        vic.poke(0xd016, D016_BASE | (offset & 7));
        vic.poke(0xd023, LOGO_FILL[logoLine >> 2]);
      } else if (logoLine === LOGO_LINES) {
        vic.poke(0xd018, 1 << 1);
        vic.poke(0xd016, D016_BASE);
      }

      vic.poke(0xd021, barColor[line]);

      // Open the bottom border: 24 rows after the 25-row compare (247) has passed, before 251
      if (line === 249) vic.poke(0xd011, vic.peek(0xd011) & ~0x08);

      const scrollerLine = line - SCROLLER_Y - 1;
      if (scrollerLine >= 0 && scrollerLine < SCROLLER_LINES) {
        const color = SCROLLER_COLORS[scrollerLine >> 1];
        for (let i = 0; i < 8; i++) vic.poke(0xd027 + i, color);
      }
    },
  };
};
