import { SCREEN_RAM, COLUMNS, ROWS } from '../text';
import { BLACK, WHITE, DARK_GREY, GREY, LIGHT_BLUE } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 8: a scrolling world.
 *
 * The standard C64 way to scroll a large map in any direction: $D016/$D011 fine scroll (0-7 pixels)
 * in 38-column, 24-row mode to hide the ragged edges, and the screen rebuilt from the tile map each
 * time the camera crosses an 8-pixel boundary. The world is 96x48 tiles of 2x2 multicolour characters
 * (1536x768 pixels) with giant block-letter words. A sprite ship in the middle turns to face the
 * direction of travel.
 *
 * Memory (bank 0): screen $0400, charset $2000, ship sprites $2800-$29FF.
 */

const CHARSET = 0x2000;
const D018 = 0x18;
const SHIP_SPRITES = 0x2800;
const SHIP_POINTER = SHIP_SPRITES / 64;
const DIRECTIONS = 8;

const TILES_W = 96;
const TILES_H = 48;
const CHARS_W = TILES_W * 2;
const CHARS_H = TILES_H * 2;
const WORLD_W = CHARS_W * 8;
const WORLD_H = CHARS_H * 8;
const VIEW_W = 320;
const VIEW_H = 200;

// Character codes
const GRID_TOP_LEFT = 0;
const GRID_TOP = 1;
const GRID_LEFT = 2;
const EMPTY = 3;
const STAR_A = 4;
const STAR_B = 5;
const BLOCK = 8; // 8-11: top-left, top-right, bottom-left, bottom-right

const FONT: Record<string, string[]> = {
  P: ['####.', '#...#', '####.', '#....', '#....'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  E: ['#####', '#....', '####.', '#....', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  I: ['.###.', '..#..', '..#..', '..#..', '.###.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  F: ['#####', '#....', '####.', '#....', '#....'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '6': ['.###.', '#....', '####.', '#...#', '.###.'],
  '4': ['#..#.', '#..#.', '#####', '...#.', '...#.'],
};

// Words in the world: tile position and colour RAM colour (0-7)
const WORDS = [
  { text: 'PHRENETIC', x: 6, y: 4, color: 7 },
  { text: 'C64', x: 10, y: 16, color: 3 },
  { text: 'ALIVE', x: 48, y: 15, color: 5 },
  { text: 'BY CHOCK', x: 8, y: 27, color: 2 },
  { text: 'OF MANIAX', x: 36, y: 38, color: 4 },
];

// Camera path: tile coordinates the view centre passes through
const PATH: [number, number][] = [
  [14, 6.5], [52, 6.5], [62, 17.5], [26, 18.5], [18, 29.5], [44, 29.5], [52, 40.5], [80, 40.5],
];

const setPixel = (vic: Vic, code: number, x: number, y: number, pair: number) => {
  const addr = CHARSET + code * 8 + y;
  const shift = 6 - x * 2;
  vic.ram[addr] = (vic.ram[addr] & ~(3 << shift)) | (pair << shift);
};

const buildCharset = (vic: Vic) => {
  vic.ram.fill(0, CHARSET, CHARSET + 0x800);
  // Grid lines in $D022 along the top and left edge of each tile
  for (let x = 0; x < 4; x++) {
    setPixel(vic, GRID_TOP_LEFT, x, 0, 1);
    setPixel(vic, GRID_TOP, x, 0, 1);
  }
  for (let y = 0; y < 8; y++) {
    setPixel(vic, GRID_TOP_LEFT, 0, y, 1);
    setPixel(vic, GRID_LEFT, 0, y, 1);
  }
  setPixel(vic, STAR_A, 2, 3, 2);
  setPixel(vic, STAR_B, 1, 5, 1);

  // A bevelled block over 2x2 characters: highlight ($D023) top/left, shadow ($D022) bottom/right
  for (let ty = 0; ty < 16; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      let pair = 3;
      if (ty === 0 || tx === 0) pair = 2;
      if (ty === 15 || tx === 7) pair = 1;
      const code = BLOCK + (ty >> 3) * 2 + (tx >> 2);
      setPixel(vic, code, tx & 3, ty & 7, pair);
    }
  }
};

const buildWorld = () => {
  const codes = new Uint8Array(CHARS_W * CHARS_H);
  const colors = new Uint8Array(CHARS_W * CHARS_H).fill(0x08 | WHITE);
  let seed = 64;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let ty = 0; ty < TILES_H; ty++) {
    for (let tx = 0; tx < TILES_W; tx++) {
      const i = ty * 2 * CHARS_W + tx * 2;
      codes[i] = GRID_TOP_LEFT;
      codes[i + 1] = GRID_TOP;
      codes[i + CHARS_W] = GRID_LEFT;
      const star = random();
      codes[i + CHARS_W + 1] = star < 0.12 ? STAR_A : star < 0.25 ? STAR_B : EMPTY;
    }
  }

  for (const word of WORDS) {
    Array.from(word.text).forEach((letter, n) => {
      const glyph = FONT[letter];
      if (!glyph) return;
      glyph.forEach((row, gy) => {
        for (let gx = 0; gx < row.length; gx++) {
          if (row[gx] !== '#') continue;
          const tx = word.x + n * 6 + gx;
          const ty = word.y + gy;
          const i = ty * 2 * CHARS_W + tx * 2;
          [0, 1, CHARS_W, CHARS_W + 1].forEach((offset, k) => {
            codes[i + offset] = BLOCK + k;
            colors[i + offset] = 0x08 | word.color;
          });
        }
      });
    });
  }
  return { codes, colors };
};

// The ship, pointing in one of 8 directions, as multicolour sprites
const buildShip = (vic: Vic) => {
  const outline: [number, number][] = [[0, -9], [7, 8], [0, 4], [-7, 8]];
  for (let d = 0; d < DIRECTIONS; d++) {
    const angle = (d / DIRECTIONS) * Math.PI * 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const base = SHIP_SPRITES + d * 64;
    vic.ram.fill(0, base, base + 64);
    for (let y = 0; y < 21; y++) {
      for (let col = 0; col < 12; col++) {
        // Undo the rotation to test the point against the upright ship
        const px = (col * 2 + 1 - 12) / 1.1;
        const py = y - 10;
        const lx = px * c + py * s;
        const ly = -px * s + py * c;
        if (!insidePolygon(outline, lx, ly)) continue;
        const pair = ly > 3 ? 3 : lx < 0 ? 1 : 2;
        vic.ram[base + y * 3 + (col >> 2)] |= pair << (6 - (col & 3) * 2);
      }
    }
  }
};

const insidePolygon = (points: [number, number][], x: number, y: number) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Position along the path at 0..1, with time spread by segment length so the speed stays even
const createPath = () => {
  const lengths = PATH.slice(1).map(([x, y], i) => Math.hypot(x - PATH[i][0], y - PATH[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const at = (i: number) => PATH[Math.max(0, Math.min(PATH.length - 1, i))];
  return (progress: number): [number, number] => {
    let distance = Math.max(0, Math.min(1, progress)) * total;
    let segment = 0;
    while (segment < lengths.length - 1 && distance > lengths[segment]) distance -= lengths[segment++];
    const u = distance / lengths[segment];
    // Catmull-Rom spline through the path points
    const [p0, p1, p2, p3] = [at(segment - 1), at(segment), at(segment + 1), at(segment + 2)];
    const curve = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    return [curve(p0[0], p1[0], p2[0], p3[0]), curve(p0[1], p1[1], p2[1], p3[1])];
  };
};

export const createScrollWorldPart = (durationFrames: number): Part => {
  let frame = 0;
  const world = buildWorld();
  const path = createPath();
  let shownCol = -1;
  let shownRow = -1;
  let direction = 2;

  // Unrounded view-centre position in world pixels
  const pathPosition = (f: number): [number, number] => {
    const ease = 0.5 - Math.cos(Math.max(0, Math.min(1, f / durationFrames)) * Math.PI) / 2;
    const [tx, ty] = path(ease);
    return [tx * 16, ty * 16];
  };

  const camera = (f: number): [number, number] => {
    const [cx, cy] = pathPosition(f);
    const x = Math.round(cx - VIEW_W / 2);
    const y = Math.round(cy - VIEW_H / 2);
    return [Math.max(0, Math.min(WORLD_W - VIEW_W - 8, x)), Math.max(0, Math.min(WORLD_H - VIEW_H - 8, y))];
  };

  // Heading from the smooth path, with hysteresis so the ship doesn't flick between two directions
  const STEP = (Math.PI * 2) / DIRECTIONS;
  const HYSTERESIS = 0.15; // radians beyond the halfway point before turning
  const updateDirection = (f: number) => {
    const [x0, y0] = pathPosition(f - 6);
    const [x1, y1] = pathPosition(f + 6);
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (Math.hypot(dx, dy) < 1) return; // barely moving: keep the current heading
    const angle = Math.atan2(dx, -dy);
    let diff = angle - direction * STEP;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to -pi..pi
    if (Math.abs(diff) > STEP / 2 + HYSTERESIS) {
      direction = ((Math.round(angle / STEP) % DIRECTIONS) + DIRECTIONS) % DIRECTIONS;
    }
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      buildCharset(vic);
      buildShip(vic);
      vic.poke(0xd018, D018);
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      vic.poke(0xd022, DARK_GREY);
      vic.poke(0xd023, WHITE);
      vic.poke(0xd015, 0x01);
      vic.poke(0xd01c, 0x01);
      vic.poke(0xd017, 0x01); // ship doubled in both directions
      vic.poke(0xd01d, 0x01);
      vic.poke(0xd025, WHITE);
      vic.poke(0xd026, GREY);
      vic.poke(0xd027, LIGHT_BLUE);
      vic.poke(0xd000, 160); // centred: 48x42 pixels around the middle of the screen
      vic.poke(0xd001, 129);
      const [x0, y0] = pathPosition(0);
      const [x1, y1] = pathPosition(12);
      direction = ((Math.round(Math.atan2(x1 - x0, y0 - y1) / STEP) % DIRECTIONS) + DIRECTIONS) % DIRECTIONS;
    },

    frame(vic) {
      frame++;
      const [x, y] = camera(frame);

      // Fine scroll; 38 columns and 24 rows hide the edges where characters scroll in
      vic.poke(0xd016, 0x10 | (7 - (x & 7)));
      vic.poke(0xd011, 0x10 | (7 - (y & 7)));

      // Rebuild the screen only when the camera crosses a character boundary
      const col = x >> 3;
      const row = y >> 3;
      if (col !== shownCol || row !== shownRow) {
        shownCol = col;
        shownRow = row;
        for (let r = 0; r < ROWS; r++) {
          const source = (row + r) * CHARS_W + col;
          vic.ram.set(world.codes.subarray(source, source + COLUMNS), SCREEN_RAM + r * COLUMNS);
          vic.colorRam.set(world.colors.subarray(source, source + COLUMNS), r * COLUMNS);
        }
      }

      updateDirection(frame);
      vic.ram[SCREEN_RAM + 0x3f8] = SHIP_POINTER + direction;
    },
  };
};
