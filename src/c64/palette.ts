// The 16 fixed C64 colours, using Philip "Pepto" Timmermann's measured PAL palette
export const C64_COLORS = [
  0x000000, // 0 black
  0xffffff, // 1 white
  0x68372b, // 2 red
  0x70a4b2, // 3 cyan
  0x6f3d86, // 4 purple
  0x588d43, // 5 green
  0x352879, // 6 blue
  0xb8c76f, // 7 yellow
  0x6f4f25, // 8 orange
  0x433900, // 9 brown
  0x9a6759, // 10 light red
  0x444444, // 11 dark grey
  0x6c6c6c, // 12 grey
  0x9ad284, // 13 light green
  0x6c5eb5, // 14 light blue
  0x959595, // 15 light grey
] as const;

export const BLACK = 0;
export const WHITE = 1;
export const RED = 2;
export const CYAN = 3;
export const PURPLE = 4;
export const GREEN = 5;
export const BLUE = 6;
export const YELLOW = 7;
export const ORANGE = 8;
export const BROWN = 9;
export const LIGHT_RED = 10;
export const DARK_GREY = 11;
export const GREY = 12;
export const LIGHT_GREEN = 13;
export const LIGHT_BLUE = 14;
export const LIGHT_GREY = 15;

// Palette as little-endian RGBA words, ready to write into ImageData through a Uint32Array
export const PALETTE_RGBA = new Uint32Array(
  C64_COLORS.map((rgb) => {
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }),
);
