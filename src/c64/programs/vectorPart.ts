import { SCREEN_RAM } from '../text';
import { BLACK, WHITE, BLUE, LIGHT_BLUE, CYAN, BROWN, RED, YELLOW, PURPLE, LIGHT_RED, DARK_GREY } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 7: filled 3D vectors.
 *
 * The object is drawn into a 24x20 character multicolour area (192x160 pixels). 480 cells need more
 * codes than one charset has, so a $D018 split halfway down switches to a second charset, and two
 * such pairs double-buffer the drawing: one is shown while the next frame is drawn into the other.
 * Faces are flat-shaded with back-face culling; the three light levels are $D022, $D023 and colour
 * RAM. The object updates at 25 fps, a good rate for filled vectors on a C64.
 *
 * Memory (bank 0): screen $0400, charsets $2000/$2800 (buffer A), $3000/$3800 (buffer B).
 */

const AREA_COLUMNS = 24;
const AREA_ROWS = 20;
const HALF_ROWS = AREA_ROWS / 2;
const FIRST_COLUMN = 8;
const FIRST_ROW = 2;
const WIDTH = AREA_COLUMNS * 4; // multicolour pixels
const HEIGHT = AREA_ROWS * 8;
const BUFFERS = [
  [0x2000, 0x2800],
  [0x3000, 0x3800],
];
const d018For = (charset: number) => 0x10 | ((charset >> 11) << 1); // screen $0400
const SPLIT_LINE = 0x33 + (FIRST_ROW + HALF_ROWS) * 8;
const BLANK_CODE = 0xff;

type Vec3 = [number, number, number];
interface Shape {
  vertices: Vec3[];
  faces: number[][]; // counter-clockwise when seen from outside
  colors: [number, number, number]; // dark ($D022), mid ($D023), light (colour RAM, 0-7)
}

const PHI = (1 + Math.sqrt(5)) / 2;

const SHAPES: Shape[] = [
  {
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]],
    colors: [BLUE, LIGHT_BLUE, CYAN],
  },
  {
    vertices: [[1.5, 0, 0], [-1.5, 0, 0], [0, 1.5, 0], [0, -1.5, 0], [0, 0, 1.5], [0, 0, -1.5]],
    faces: [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]],
    colors: [BROWN, RED, YELLOW],
  },
  {
    vertices: [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
    ].map(([x, y, z]) => [x * 0.85, y * 0.85, z * 0.85] as Vec3),
    faces: [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ],
    colors: [PURPLE, LIGHT_RED, WHITE],
  },
];

// Dark raster bars sweeping behind the object
const BAR_LINES_PER_COLOR = 3;
const BARS = [
  [BLUE, PURPLE, BLUE],
  [DARK_GREY, BROWN, DARK_GREY],
  [BLUE, DARK_GREY, BLUE],
];

const LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.4, -0.6, -0.7];
  const len = Math.hypot(...v);
  return v.map((c) => c / len) as Vec3;
})();

const rotate = ([x, y, z]: Vec3, ax: number, ay: number, az: number): Vec3 => {
  let c = Math.cos(ax);
  let s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay);
  s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az);
  s = Math.sin(az);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
};

// Fill a convex polygon (multicolour pixel coordinates) with one colour pair value
const fillPolygon = (pixels: Uint8Array, points: [number, number][], value: number) => {
  let top = HEIGHT;
  let bottom = -1;
  for (const [, y] of points) {
    top = Math.min(top, Math.ceil(y));
    bottom = Math.max(bottom, Math.floor(y));
  }
  top = Math.max(0, top);
  bottom = Math.min(HEIGHT - 1, bottom);
  for (let y = top; y <= bottom; y++) {
    let left = Infinity;
    let right = -Infinity;
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % points.length];
      if ((y < y0 && y < y1) || (y > y0 && y > y1) || y0 === y1) continue;
      const x = x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
    const from = Math.max(0, Math.round(left));
    const to = Math.min(WIDTH - 1, Math.round(right) - 1);
    pixels.fill(value, y * WIDTH + from, y * WIDTH + to + 1);
  }
};

export const createVectorPart = (durationFrames: number): Part => {
  let frame = 0;
  let shown = 0; // buffer on screen
  const pixels = new Uint8Array(WIDTH * HEIGHT);
  const shapeFrames = Math.floor(durationFrames / SHAPES.length);
  let shapeColors = SHAPES[0].colors;
  const barColor = new Uint8Array(312);

  const draw = (vic: Vic, t: number, buffer: number) => {
    const index = Math.min(SHAPES.length - 1, Math.floor(frame / shapeFrames));
    const shape = SHAPES[index];
    shapeColors = shape.colors;

    // Zoom in at the start of each shape and out at the end
    const local = (frame % shapeFrames) / shapeFrames;
    const zoom = Math.min(1, local * 6, (1 - local) * 6);
    const ax = t * 0.9;
    const ay = t * 1.3;
    const az = t * 0.4;
    const distance = 5 + (1 - zoom) * 30;
    const scale = 190; // the largest object (radius ~1.75) projects to at most ~72 lines from the centre

    const projected = shape.vertices.map((v) => {
      const [x, y, z] = rotate(v, ax, ay, az);
      const depth = z + distance;
      return { point: [WIDTH / 2 + (x * scale) / depth / 2, HEIGHT / 2 + (y * scale) / depth] as [number, number], rotated: [x, y, z] as Vec3 };
    });

    pixels.fill(0);
    for (const face of shape.faces) {
      const points = face.map((i) => projected[i].point);
      // Back-face culling on the screen-space winding (x is halved for multicolour pixels)
      const [ax2, ay2] = points[0];
      const [bx, by] = points[1];
      const [cx, cy] = points[2];
      if ((bx - ax2) * (cy - ay2) - (by - ay2) * (cx - ax2) >= 0) continue;

      const [a, b, c] = face.slice(0, 3).map((i) => projected[i].rotated);
      const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const w: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const len = Math.hypot(...n);
      const light = Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / len);
      fillPolygon(pixels, points, 1 + Math.min(2, Math.floor(light * 3)));
    }

    // Pack into the buffer's two charsets, codes numbered down each column of each half
    const [upper, lower] = BUFFERS[buffer];
    for (let y = 0; y < HEIGHT; y++) {
      const row = y >> 3;
      const base = row < HALF_ROWS ? upper : lower;
      const rowInHalf = row % HALF_ROWS;
      for (let col = 0; col < AREA_COLUMNS; col++) {
        const p = y * WIDTH + col * 4;
        const byte = (pixels[p] << 6) | (pixels[p + 1] << 4) | (pixels[p + 2] << 2) | pixels[p + 3];
        vic.ram[base + (col * HALF_ROWS + rowInHalf) * 8 + (y & 7)] = byte;
      }
    }
  };

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      vic.poke(0xd016, 0xd8); // multicolour
      vic.poke(0xd020, BLACK);
      vic.poke(0xd021, BLACK);
      for (const [upper, lower] of BUFFERS) {
        vic.ram.fill(0, upper, upper + 0x800);
        vic.ram.fill(0, lower, lower + 0x800);
      }
      vic.ram.fill(BLANK_CODE, SCREEN_RAM, SCREEN_RAM + 1000);
      for (let row = 0; row < AREA_ROWS; row++) {
        for (let col = 0; col < AREA_COLUMNS; col++) {
          const offset = (FIRST_ROW + row) * 40 + FIRST_COLUMN + col;
          vic.ram[SCREEN_RAM + offset] = col * HALF_ROWS + (row % HALF_ROWS);
        }
      }
      draw(vic, 0, 0);
    },

    frame(vic) {
      frame++;
      if (frame & 1) return; // 25 fps: draw into the hidden buffer, then show it
      const hidden = shown ^ 1;
      draw(vic, frame / 50, hidden);
      shown = hidden;
      barColor.fill(BLACK);
      BARS.forEach((bar, n) => {
        const height = bar.length * BAR_LINES_PER_COLOR;
        const top = Math.round(150 + Math.sin((frame / 50) * 0.9 + n * 2.1) * 95 - height / 2);
        for (let j = 0; j < height; j++) barColor[top + j] = bar[Math.floor(j / BAR_LINES_PER_COLOR)];
      });
      const [dark, mid, light] = shapeColors;
      vic.poke(0xd022, dark);
      vic.poke(0xd023, mid);
      vic.colorRam.fill(0x08 | light);
    },

    rasterLine(vic, line) {
      if (line === 0) vic.poke(0xd018, d018For(BUFFERS[shown][0]));
      if (line === SPLIT_LINE) vic.poke(0xd018, d018For(BUFFERS[shown][1]));
      vic.poke(0xd021, barColor[line]);
    },
  };
};
