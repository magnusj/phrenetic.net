import { printAt, SCREEN_RAM, COLUMNS } from '../text';
import type { C64Program } from '../vic';

const CURSOR_ROW = 6;
const CURSOR_BLINK_FRAMES = 16;

/** The C64 power-on screen with a blinking cursor under READY. */
export const createBootScreen = (): C64Program => ({
  init(vic) {
    vic.reset();
    printAt(vic, 4, 1, '**** COMMODORE 64 BASIC V2 ****');
    printAt(vic, 1, 3, '64K RAM SYSTEM  38911 BASIC BYTES FREE');
    printAt(vic, 0, 5, 'READY.');
  },

  frame(vic, frame) {
    // The cursor is a space drawn in reverse video (screen code 160) every other blink period
    const on = Math.floor(frame / CURSOR_BLINK_FRAMES) % 2 === 0;
    vic.ram[SCREEN_RAM + CURSOR_ROW * COLUMNS] = on ? 0xa0 : 0x20;
  },
});
