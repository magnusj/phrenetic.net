import { BLACK, WHITE, BROWN, RED, LIGHT_RED, YELLOW, BLUE, LIGHT_BLUE, CYAN } from '../palette';
import { DARK_GREY, GREY, LIGHT_GREY, GREEN, LIGHT_GREEN, PURPLE } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 5b: FPP twister.
 *
 * FPP ("flexible pixel position"): YSCROLL is set to match the raster line on every line, forcing a
 * bad line each time. The row counter never reaches 7, so the VIC keeps fetching the same screen row
 * and shows the first pixel line of its characters. Switching $D018 between 12 screens therefore picks
 * a different pre-rendered slice of the rotating bar on every line.
 *
 * Each slice has the left face in $D022, the right face in $D023 and the edge in colour RAM, so the
 * face colours and their shading are set per line. Faces keep their colour as the bar turns, and the
 * colours rotate through the palette over time.
 *
 * Memory (VIC bank 1): screens at $4000-$6FFF, charset at $7000.
 */

const BANK = 0x4000;
const SLICES = 12;
const screenAddr = (slice: number) => BANK + slice * 0x400;
const CHARSET = 0x7000;
const CHARSET_BITS = (CHARSET - BANK) / 0x800; // 6
const TWISTER_COLUMNS = 10;
const FIRST_COLUMN = 15;
const HALF_WIDTH = 13; // multicolour pixels from the centre to a face corner at 45 degrees
const BLANK_CODE = 0xff;

const FIRST_LINE = 0x33;
const LAST_LINE = 0xf7;

// Four face colours, each a dark -> light ramp used for shading
const FACES = [
  [BROWN, RED, LIGHT_RED, YELLOW],
  [BLUE, PURPLE, LIGHT_BLUE, CYAN],
  [DARK_GREY, GREY, LIGHT_GREY, LIGHT_GREY],
  [DARK_GREY, GREEN, GREEN, LIGHT_GREEN],
];
// Soft colour-cycling bands behind the twister
const BACKGROUND = [
  BLACK, BLACK, BLACK, BLACK, BLUE, BLUE, PURPLE, BLUE, BLUE, BLACK, BLACK, BLACK,
  BLACK, BLACK, BROWN, BROWN, RED, BROWN, BROWN, BLACK, BLACK, BLACK, BLACK, BLACK,
  DARK_GREY, DARK_GREY, GREY, DARK_GREY, DARK_GREY, BLACK,
];

// Render the slice of the bar at angle theta (0..90 degrees) into one row of 32 multicolour pixels
const renderSlice = (theta: number): Uint8Array => {
  const pixels = new Uint8Array(TWISTER_COLUMNS * 4);
  const r = HALF_WIDTH * Math.SQRT2;
  const center = pixels.length / 2;
  const left = center + r * Math.sin(theta - (3 * Math.PI) / 4);
  const middle = center + r * Math.sin(theta - Math.PI / 4);
  const right = center + r * Math.sin(theta + Math.PI / 4);
  for (let x = 0; x < pixels.length; x++) {
    const px = x + 0.5;
    if (px >= left && px < middle) pixels[x] = 1;
    else if (px >= middle && px < right) pixels[x] = 2;
  }
  // Highlight the corner between the faces
  const edge = Math.floor(middle);
  if (edge > left && edge < right - 1) pixels[edge] = 3;
  return pixels;
};

export const createTwisterPart = (durationFrames: number): Part => {
  let frame = 0;
  const lineSlice = new Uint8Array(312);
  const lineLeft = new Uint8Array(312);
  const lineRight = new Uint8Array(312);
  const lineScroll = new Uint8Array(312);
  const lineBackground = new Uint8Array(312);

  const setupMemory = (vic: Vic) => {
    vic.ram.fill(0, BANK, BANK + 0x4000);
    for (let slice = 0; slice < SLICES; slice++) {
      const pixels = renderSlice(((slice + 0.5) / SLICES) * (Math.PI / 2));
      const screen = screenAddr(slice);
      vic.ram.fill(BLANK_CODE, screen, screen + 1000);
      for (let col = 0; col < TWISTER_COLUMNS; col++) {
        const code = slice * TWISTER_COLUMNS + col;
        vic.ram[screen + FIRST_COLUMN + col] = code;
        let byte = 0;
        for (let px = 0; px < 4; px++) byte |= pixels[col * 4 + px] << (6 - px * 2);
        vic.ram[CHARSET + code * 8] = byte;
      }
    }
    for (let col = 0; col < TWISTER_COLUMNS; col++) vic.colorRam[FIRST_COLUMN + col] = 0x08 | WHITE;
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      setupMemory(vic);
      vic.poke(0xdd00, 0x02); // VIC bank 1
      vic.poke(0xd016, 0x18); // multicolour
      vic.poke(0xd018, CHARSET_BITS << 1);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
    },

    frame() {
      const t = frame / 50;
      frame++;
      const colorShift = Math.floor(t / 2.5);

      for (let line = FIRST_LINE; line <= LAST_LINE; line++) {
        const y = line - FIRST_LINE;
        const angle = t * 1.4 + Math.sin(t * 0.8 + y * 0.011) * 2.6 + Math.sin(t * 1.9 - y * 0.02) * 0.6;
        const quarter = Math.floor(angle / (Math.PI / 2));
        const theta = angle - quarter * (Math.PI / 2);
        lineSlice[line] = Math.min(SLICES - 1, Math.floor((theta / (Math.PI / 2)) * SLICES));

        // The right face faces the viewer at theta = 0, the left one at theta = 90 degrees
        const rightFace = FACES[(((quarter + colorShift) % 4) + 4) % 4];
        const leftFace = FACES[(((quarter - 1 + colorShift) % 4) + 4) % 4];
        lineRight[line] = rightFace[Math.round(Math.cos(theta) * 3)];
        lineLeft[line] = leftFace[Math.round(Math.sin(theta) * 3)];

        lineScroll[line] = Math.round((Math.sin(t * 2.1 + y * 0.03) * 0.5 + 0.5) * 7);
        lineBackground[line] = BACKGROUND[Math.floor((y + t * 30) / 3) % BACKGROUND.length];
      }
    },

    rasterLine(vic, line) {
      if (line < FIRST_LINE || line > LAST_LINE) {
        vic.poke(0xd021, BLACK);
        return;
      }
      // Force a bad line (YSCROLL = line & 7) and pick this line's slice screen
      vic.poke(0xd011, 0x18 | (line & 7));
      vic.poke(0xd018, (lineSlice[line] << 4) | (CHARSET_BITS << 1));
      vic.poke(0xd016, 0x18 | lineScroll[line]);
      vic.poke(0xd022, lineLeft[line]);
      vic.poke(0xd023, lineRight[line]);
      vic.poke(0xd021, lineBackground[line]);
    },
  };
};
