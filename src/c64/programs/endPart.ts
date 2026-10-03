import { CHAR_ROM, toScreenCodes } from '../charset';
import { SpriteMultiplexer, type VirtualSprite } from '../multiplexer';
import { printAt, SCREEN_RAM, COLUMNS } from '../text';
import { BLACK, WHITE, BLUE, PURPLE, DARK_GREY, LIGHT_BLUE, CYAN, GREEN, LIGHT_GREEN, YELLOW } from '../palette';
import { ORANGE, LIGHT_RED, RED, LIGHT_GREY } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 10: the endpart.
 *
 * All four borders are open. Top and bottom: switch to 24 rows on line 249, between the two
 * bottom compares. Sides: on every raster line, switch to 38 columns at cycle 56, just after the
 * 38-column compare (X=335) and before the 40-column one (X=344), then back at cycle 57. The
 * whole 384x272 frame becomes usable.
 *
 * A slow sine scroller of multicolour sprite letters crosses the entire frame through the sprite
 * multiplexer, recoloured on every line. Credits and greetings fade in and out in the middle,
 * with the letters passing behind them. At the end everything fades to black.
 *
 * Memory (bank 0): screen $0400, ROM charset, letter sprites $2000-$2FFF.
 */

const LETTER_SPRITES = 0x2000;
const LETTER_POINTER = LETTER_SPRITES / 64;
const D016 = 0xc8; // hires text, 40 columns
const LETTER_SPACING = 20;
const SINE_CENTER = 142;
const SINE_AMPLITUDE = 96;
const WAVELENGTH = 400;

const LETTER_COLORS = [RED, LIGHT_RED, ORANGE, YELLOW, LIGHT_GREEN, GREEN, CYAN, LIGHT_BLUE, PURPLE, LIGHT_RED];
const LINES_PER_LETTER_COLOR = 6;
const TOP_GRADIENT = [BLUE, PURPLE, BLUE, BLUE, DARK_GREY, BLUE, DARK_GREY, BLACK];
const GRADIENT_LINES = 5;

// One step darker for each colour, for fades
const DARKER = [0, 15, 9, 14, 6, 11, 0, 15, 9, 0, 8, 0, 11, 5, 4, 12];
const FADE_STEPS = 5;
const darken = (c: number, steps: number) => {
  for (let i = 0; i < steps; i++) c = DARKER[c];
  return c;
};

const PAGES: [string, string][] = [
  ['PHRENETIC', 'PRESENTS A COMMODORE 64 DEMO'],
  ['MUSIC BY', 'CHOCK OF MANIAX'],
  ['ALIVE (1994)', 'FOR YOU (1993)'],
  ['RECORDED ON', 'A REAL MOS 6581R4'],
  ['CODE AND GRAPHICS', 'SUPREMO'],
  ['SPECIAL THANKS TO', 'CHOCK OF MANIAX * 1XN'],
  ['RUNNING ON AN', 'EMULATED VIC-II'],
  ['WITH ALL OF ITS', 'REAL LIMITS'],
  ['GREETZ TO', 'FAIRLIGHT * KEFRENS * MELON DEZIGN'],
  ['SILENTS * RAZOR 1911 * CRUSADERS', 'BOOZE DESIGN * CENSOR DESIGN * MANIAX'],
  ['KEEP THE SCENE ALIVE!', 'VISIT PHRENETIC.NET'],
  ['THANK YOU', 'FOR WATCHING'],
];
const PAGE_FADE_FRAMES = 30;
const PAGE_ROWS = [11, 13];
const PAGE_COLORS = [WHITE, LIGHT_GREY];

const SCROLL_TEXT =
  '                    ' +
  'THIS IS THE END OF OUR LITTLE JOURNEY BACK TO THE BREADBIN...   ' +
  'EVERY EFFECT YOU SAW RAN THROUGH A MODEL OF THE VIC-II CHIP: RASTER SPLITS, BAD LINES, ' +
  'OPEN BORDERS, SPRITE MULTIPLEXING AND FLI, WITH THE SAME LIMITS AS THE REAL MACHINE...   ' +
  'A HUGE THANK YOU TO CHOCK OF MANIAX FOR LETTING US USE ALIVE AND FOR YOU. ' +
  'THESE TUNES STILL GIVE US GOOSEBUMPS AFTER ALL THESE YEARS...   ' +
  'THE TUNES WERE RECORDED ON A REAL 6581 BY STONE OAKVALLEY\'S AUTHENTIC SID COLLECTION...   ' +
  'THE DISK DRIVE YOU HEARD AT THE START IS A REAL 1541...   ' +
  'SPECIAL THANKS TO 1XN...   ' +
  'GREETZ FLY OUT TO FAIRLIGHT, KEFRENS, MELON DEZIGN, SILENTS, RAZOR 1911, CRUSADERS, ' +
  'BOOZE DESIGN, CENSOR DESIGN AND MANIAX...   AND TO EVERYONE WHO EVER SPENT A NIGHT IN FRONT ' +
  'OF A C64 TYPING SYS 64738...   KEEP THE SCENE ALIVE!   ' +
  'PHRENETIC SIGNING OFF...                    ';

// Multicolour letter sprites from the charset: body in the sprite colour, white top edge, dark shadow
const buildLetterSprites = (vic: Vic) => {
  vic.ram.fill(0, LETTER_SPRITES, LETTER_SPRITES + 64 * 64);
  for (let code = 0; code < 64; code++) {
    const base = LETTER_SPRITES + code * 64;
    const lit = (gx: number, gy: number) =>
      gx >= 0 && gx < 8 && gy >= 0 && gy < 8 && ((CHAR_ROM[code * 8 + gy] >> (7 - gx)) & 1) === 1;
    const plot = (col: number, row: number, pair: number) => {
      if (col < 0 || col > 11 || row < 0 || row > 20) return;
      const addr = base + row * 3 + (col >> 2);
      const shift = 6 - (col & 3) * 2;
      vic.ram[addr] = (vic.ram[addr] & ~(3 << shift)) | (pair << shift);
    };
    // Shadow first, one pixel right and two lines down, then the letter over it
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        if (!lit(gx, gy)) continue;
        plot(gx + 3, gy * 2 + 4, 1);
        plot(gx + 3, gy * 2 + 5, 1);
      }
    }
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        if (!lit(gx, gy)) continue;
        plot(gx + 2, gy * 2 + 2, lit(gx, gy - 1) ? 2 : 3);
        plot(gx + 2, gy * 2 + 3, 2);
      }
    }
  }
};

export const createEndPart = (durationFrames: number): Part => {
  let frame = 0;
  let position = 0;
  let fade = 0;
  const textCodes = toScreenCodes(SCROLL_TEXT);
  // Scroll the whole text through exactly once over the part
  const speed = (textCodes.length * LETTER_SPACING) / durationFrames;
  // The pages run through once, ending on the thank-you
  const pageFrames = Math.floor(durationFrames / PAGES.length);
  const multiplexer = new SpriteMultiplexer(SCREEN_RAM);
  const letters: VirtualSprite[] = [];
  const lineColor = new Uint8Array(312);
  const lineBackground = new Uint8Array(312);

  const showPage = (vic: Vic, index: number, steps: number) => {
    PAGES[index].forEach((text, i) => {
      const row = PAGE_ROWS[i];
      vic.ram.fill(0x20, SCREEN_RAM + row * COLUMNS, SCREEN_RAM + (row + 1) * COLUMNS);
      printAt(vic, Math.floor((COLUMNS - text.length) / 2), row, text, darken(PAGE_COLORS[i], steps));
    });
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      buildLetterSprites(vic);
      vic.poke(0xd016, D016);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      vic.poke(0xd015, 0xff);
      vic.poke(0xd01c, 0xff);
      vic.poke(0xd01b, 0xff); // letters pass behind the text
      vic.poke(0xd025, DARK_GREY);
      vic.poke(0xd026, WHITE);
    },

    frame(vic) {
      const t = frame / 50;
      frame++;
      position += speed;

      // Fade everything out over the last 3 seconds
      fade = Math.min(FADE_STEPS, Math.max(0, Math.floor((frame - (durationFrames - 150)) / 30)));

      // Text pages, each fading in and out
      const page = Math.min(PAGES.length - 1, Math.floor(frame / pageFrames));
      const into = frame - page * pageFrames;
      const pageFade = Math.max(
        0,
        FADE_STEPS - Math.floor(Math.min(into, pageFrames - into) / (PAGE_FADE_FRAMES / FADE_STEPS)),
      );
      showPage(vic, page, Math.max(pageFade, fade));

      // Sine scroller letters, one sprite each
      letters.length = 0;
      const first = Math.floor(position / LETTER_SPACING);
      for (let i = first; i < textCodes.length; i++) {
        const x = i * LETTER_SPACING - position - 24;
        if (x > 384) break;
        const code = textCodes[i];
        if (code === 0x20) continue;
        const line = Math.round(SINE_CENTER + Math.sin(((x + 12) / WAVELENGTH) * Math.PI * 2 - t * 0.9) * SINE_AMPLITUDE);
        letters.push({ x: x < 0 ? x + 504 : x, line, pointer: LETTER_POINTER + code });
      }
      multiplexer.schedule(letters);
      vic.poke(0xd025, darken(DARK_GREY, fade));
      vic.poke(0xd026, darken(WHITE, fade));

      for (let line = 0; line < 312; line++) {
        const color = LETTER_COLORS[Math.floor((line + frame * 0.7) / LINES_PER_LETTER_COLOR) % LETTER_COLORS.length];
        lineColor[line] = darken(color, fade);
        const fromEdge = line < 150 ? line - 16 : 287 - line;
        const gradient = TOP_GRADIENT[Math.floor(Math.max(0, fromEdge) / GRADIENT_LINES)] ?? BLACK;
        lineBackground[line] = darken(gradient, fade);
      }
    },

    rasterLine(vic, line) {
      // Top and bottom borders: 24 rows on line 249, 25 again at the top of the frame
      if (line === 0) vic.poke(0xd011, 0x1b);
      if (line === 249) vic.poke(0xd011, 0x13);
      // Side borders: 38 columns for one cycle, while the 40-column compare would happen
      vic.pokeAt(56, 0xd016, D016 & ~0x08);
      vic.pokeAt(57, 0xd016, D016);

      multiplexer.rasterLine(vic, line);
      const color = lineColor[line];
      for (let i = 0; i < 8; i++) vic.poke(0xd027 + i, color);
      vic.poke(0xd021, lineBackground[line]);
    },
  };
};
