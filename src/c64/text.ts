import { toScreenCodes } from './charset';
import type { Vic } from './vic';

export const SCREEN_RAM = 0x0400;
export const COLUMNS = 40;
export const ROWS = 25;

/** Write text to the default screen at $0400, optionally setting its colour RAM. */
export const printAt = (vic: Vic, col: number, row: number, text: string, color?: number) => {
  toScreenCodes(text).forEach((code, i) => {
    const offset = row * COLUMNS + col + i;
    if (offset < 0 || offset >= COLUMNS * ROWS) return;
    vic.ram[SCREEN_RAM + offset] = code;
    if (color !== undefined) vic.colorRam[offset] = color;
  });
};
