import { SCREEN_RAM, COLUMNS, ROWS } from '../text';
import { BLACK, WHITE, BLUE, LIGHT_BLUE, PURPLE, RED, LIGHT_RED, ORANGE, YELLOW, CYAN, GREEN, LIGHT_GREEN } from '../palette';
import type { Vic } from '../vic';
import type { Part } from './demo';

/*
 * Part 6: chunky 4x4 effects, the rotozoomer and the tunnel.
 *
 * "4x4 mode": a multicolour charset holding all 256 combinations of 2x2 chunky pixels, each
 * 2 multicolour pixels (4 screen pixels) wide and 4 lines tall, in one of 4 colours:
 * background, $D022, $D023 and colour RAM. Writing only screen codes turns the screen into an
 * 80x50 four-colour framebuffer. Both effects update at 25 fps, a realistic rate for 1000
 * screen codes plus texture lookups on a C64.
 *
 * Memory: screen $0400, charset $2000.
 */

const CHARSET = 0x2000;
const D018 = 0x18;
const WIDTH = COLUMNS * 2;
const HEIGHT = ROWS * 2;

const setupChunkyMode = (vic: Vic, highlight: number) => {
  vic.poke(0xd016, 0xd8); // multicolour, 40 columns
  vic.poke(0xd018, D018);
  vic.poke(0xd020, BLACK);
  vic.poke(0xd021, BLACK);
  for (let code = 0; code < 256; code++) {
    const tl = (code >> 6) & 3;
    const tr = (code >> 4) & 3;
    const bl = (code >> 2) & 3;
    const br = code & 3;
    const top = (tl << 6) | (tl << 4) | (tr << 2) | tr;
    const bottom = (bl << 6) | (bl << 4) | (br << 2) | br;
    for (let line = 0; line < 8; line++) vic.ram[CHARSET + code * 8 + line] = line < 4 ? top : bottom;
  }
  vic.colorRam.fill(0x08 | highlight);
};

// Write an 80x50 buffer of colour indices (0-3) as screen codes
const present = (vic: Vic, pixels: Uint8Array) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const p = row * 2 * WIDTH + col * 2;
      vic.ram[SCREEN_RAM + row * COLUMNS + col] =
        (pixels[p] << 6) | (pixels[p + 1] << 4) | (pixels[p + WIDTH] << 2) | pixels[p + WIDTH + 1];
    }
  }
};

// Rotozoomer texture: 16x16 tiles in a checkerboard, a diamond in each tile, dark grid lines
const TEXTURE_SIZE = 64;
const buildTexture = (): Uint8Array => {
  const texture = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE);
  for (let v = 0; v < TEXTURE_SIZE; v++) {
    for (let u = 0; u < TEXTURE_SIZE; u++) {
      const tu = u & 15;
      const tv = v & 15;
      let color = ((u >> 4) + (v >> 4)) & 1 ? 1 : 2;
      if (Math.abs(tu - 7.5) + Math.abs(tv - 7.5) < 5) color = 3;
      if (tu === 0 || tv === 0) color = 0;
      texture[v * TEXTURE_SIZE + u] = color;
    }
  }
  return texture;
};

// Colour gradient pairs for the rotozoomer's $D022/$D023, split every 8 lines
const ROTO_GRADIENT: [number, number][] = [
  [BLUE, LIGHT_BLUE],
  [PURPLE, LIGHT_BLUE],
  [PURPLE, LIGHT_RED],
  [RED, LIGHT_RED],
  [RED, ORANGE],
  [ORANGE, YELLOW],
  [GREEN, YELLOW],
  [GREEN, LIGHT_GREEN],
  [BLUE, CYAN],
];

export const createRotozoomerPart = (durationFrames: number): Part => {
  let frame = 0;
  const texture = buildTexture();
  const pixels = new Uint8Array(WIDTH * HEIGHT);
  let gradientShift = 0;

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      setupChunkyMode(vic, WHITE);
    },

    frame(vic) {
      frame++;
      if (frame & 1) return; // 25 fps
      const t = frame / 50;
      const angle = t * 0.55;
      const zoom = 0.55 + Math.sin(t * 0.8) * 0.4;
      const du = Math.cos(angle) * zoom;
      const dv = Math.sin(angle) * zoom;
      const originU = Math.sin(t * 0.3) * 80;
      const originV = t * 12;

      for (let y = 0; y < HEIGHT; y++) {
        // Chunky pixels are 4 wide by 4 tall on screen, so the steps are the same in both directions
        const cy = y - HEIGHT / 2;
        let u = originU - (WIDTH / 2) * du - cy * dv;
        let v = originV - (WIDTH / 2) * dv + cy * du;
        for (let x = 0; x < WIDTH; x++) {
          pixels[y * WIDTH + x] = texture[((v & 63) << 6) | (u & 63)];
          u += du;
          v += dv;
        }
      }
      present(vic, pixels);
      gradientShift = Math.floor(t * 3);
    },

    rasterLine(vic, line) {
      if (line < 0x33 || line > 0xfa || (line - 0x33) % 8 !== 0) return;
      const [low, high] = ROTO_GRADIENT[(((line - 0x33) >> 3) + gradientShift) % ROTO_GRADIENT.length];
      vic.poke(0xd022, low);
      vic.poke(0xd023, high);
    },
  };
};

// Colour pairs for the tunnel's mid and near tones, changing every 2.75 s
const TUNNEL_COLORS: [number, number][] = [
  [BLUE, LIGHT_BLUE],
  [PURPLE, LIGHT_RED],
  [RED, YELLOW],
  [GREEN, LIGHT_GREEN],
];

export const createTunnelPart = (durationFrames: number): Part => {
  let frame = 0;
  const pixels = new Uint8Array(WIDTH * HEIGHT);
  const angleTable = new Float32Array(WIDTH * HEIGHT);
  const depthTable = new Float32Array(WIDTH * HEIGHT);

  return {
    get finished() {
      return frame >= durationFrames;
    },

    init(vic) {
      setupChunkyMode(vic, WHITE);
    },

    frame(vic) {
      frame++;
      if (frame & 1) return; // 25 fps
      const t = frame / 50;
      // The centre wanders, so the tables are rebuilt with it (a C64 would pan a larger precalculated table)
      const centerX = WIDTH / 2 + Math.sin(t * 0.9) * 14;
      const centerY = HEIGHT / 2 + Math.sin(t * 0.7) * 8;
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          angleTable[y * WIDTH + x] = Math.atan2(dy, dx) / (Math.PI * 2);
          depthTable[y * WIDTH + x] = Math.sqrt(dx * dx + dy * dy);
        }
      }

      const travel = t * 1.6;
      const twist = t * 0.25;
      for (let i = 0; i < pixels.length; i++) {
        const distance = depthTable[i];
        if (distance < 2.5) {
          pixels[i] = 0;
          continue;
        }
        const u = Math.floor((angleTable[i] + twist) * 24);
        const v = Math.floor(70 / distance + travel * 2.5);
        const checker = (u + v) & 1;
        // Brightness by distance: far away is dark, close to the screen edge is bright
        const light = Math.min(3, Math.floor(distance / 6));
        pixels[i] = Math.max(0, light - checker);
      }
      present(vic, pixels);
      const [low, high] = TUNNEL_COLORS[Math.floor(t / 2.75) % TUNNEL_COLORS.length];
      vic.poke(0xd022, low);
      vic.poke(0xd023, high);
    },
  };
};
