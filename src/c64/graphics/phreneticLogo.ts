/*
 * The PHRENETiC logo as multicolour character graphics: 32 chars wide (128 multicolour pixels),
 * 6 rows tall (48 lines). Each pixel is one of the four multicolour bit pairs:
 *   0 = background ($D021), 1 = shadow ($D022), 2 = fill ($D023), 3 = highlight (colour RAM)
 */

export const LOGO_COLUMNS = 32;
export const LOGO_ROWS = 6;
const WIDTH = LOGO_COLUMNS * 4; // multicolour pixels
const HEIGHT = LOGO_ROWS * 8;

// Letters on a 6x11 grid; each grid cell becomes 2 multicolour pixels x 4 lines
const LETTERS: Record<string, string[]> = {
  P: ['#####.', '##..##', '##..##', '##..##', '##..##', '#####.', '##....', '##....', '##....', '##....', '##....'],
  H: ['##..##', '##..##', '##..##', '##..##', '##..##', '######', '##..##', '##..##', '##..##', '##..##', '##..##'],
  R: ['#####.', '##..##', '##..##', '##..##', '##..##', '#####.', '##.##.', '##..##', '##..##', '##..##', '##..##'],
  E: ['######', '##....', '##....', '##....', '##....', '#####.', '##....', '##....', '##....', '##....', '######'],
  N: ['##..##', '###.##', '###.##', '###.##', '######', '##.###', '##.###', '##.###', '##..##', '##..##', '##..##'],
  T: ['######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
  i: ['..##..', '..##..', '......', '......', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
  C: ['.#####', '##....', '##....', '##....', '##....', '##....', '##....', '##....', '##....', '##....', '.#####'],
};

const TEXT = 'PHRENETiC';
const CELL_W = 2;
const CELL_H = 4;
const LETTER_GAP = 2;
const TOP = 2;

const buildPixels = (): Uint8Array => {
  const mask = new Uint8Array(WIDTH * HEIGHT);
  const letterWidth = 6 * CELL_W;
  const totalWidth = TEXT.length * (letterWidth + LETTER_GAP) - LETTER_GAP;
  let left = Math.floor((WIDTH - totalWidth) / 2);

  for (const letter of TEXT) {
    LETTERS[letter].forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        if (row[gx] !== '#') continue;
        for (let y = 0; y < CELL_H; y++) {
          for (let x = 0; x < CELL_W; x++) {
            mask[(TOP + gy * CELL_H + y) * WIDTH + left + gx * CELL_W + x] = 1;
          }
        }
      }
    });
    left += letterWidth + LETTER_GAP;
  }

  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT ? mask[y * WIDTH + x] : 0);
  const pixels = new Uint8Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (at(x, y)) {
        // Top and left edges catch the light
        pixels[y * WIDTH + x] = !at(x, y - 1) || !at(x - 1, y) ? 3 : 2;
      } else if (at(x - 1, y - 2) || at(x - 1, y - 1)) {
        // Drop shadow, one pixel right and two lines down
        pixels[y * WIDTH + x] = 1;
      }
    }
  }
  return pixels;
};

/** The logo as 32x6 character tiles of 8 bytes each, in row-major order. */
export const buildLogoTiles = (): Uint8Array[] => {
  const pixels = buildPixels();
  const tiles: Uint8Array[] = [];
  for (let row = 0; row < LOGO_ROWS; row++) {
    for (let col = 0; col < LOGO_COLUMNS; col++) {
      const tile = new Uint8Array(8);
      for (let line = 0; line < 8; line++) {
        let byte = 0;
        for (let px = 0; px < 4; px++) {
          byte |= pixels[(row * 8 + line) * WIDTH + col * 4 + px] << (6 - px * 2);
        }
        tile[line] = byte;
      }
      tiles.push(tile);
    }
  }
  return tiles;
};
