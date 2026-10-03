import { toScreenCodes } from './charset';
import { SCREEN_RAM, COLUMNS, ROWS } from './text';
import type { Vic } from './vic';

const CURSOR_BLINK_FRAMES = 16;

/**
 * A minimal model of the KERNAL screen editor: a cursor that blinks by reversing the
 * character under it, and printing/typing that advances the cursor like BASIC does.
 */
export class ScreenEditor {
  col = 0;
  row = 0;
  private blinkFrame = 0;
  private cursorVisible = false;
  private readonly vic: Vic;

  constructor(vic: Vic) {
    this.vic = vic;
  }

  private get offset() {
    return this.row * COLUMNS + this.col;
  }

  private hideCursor() {
    if (!this.cursorVisible) return;
    this.vic.ram[SCREEN_RAM + this.offset] ^= 0x80;
    this.cursorVisible = false;
  }

  /** Print characters at the cursor without a line break. */
  type(text: string) {
    this.hideCursor();
    for (const code of toScreenCodes(text)) {
      this.vic.ram[SCREEN_RAM + this.offset] = code;
      this.col++;
      if (this.col === COLUMNS) this.newLine();
    }
    this.blinkFrame = 0; // typing restarts the blink with the cursor on
  }

  newLine() {
    this.hideCursor();
    this.col = 0;
    this.row = Math.min(this.row + 1, ROWS - 1);
  }

  /** Print a line of output, like BASIC's PRINT. */
  printLine(text: string) {
    this.type(text);
    this.newLine();
  }

  /** Call once per frame to blink the cursor. */
  blink(enabled: boolean) {
    const shouldShow = enabled && Math.floor(this.blinkFrame / CURSOR_BLINK_FRAMES) % 2 === 0;
    this.blinkFrame++;
    if (shouldShow !== this.cursorVisible) {
      this.vic.ram[SCREEN_RAM + this.offset] ^= 0x80;
      this.cursorVisible = shouldShow;
    }
  }
}
