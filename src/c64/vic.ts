import { CHAR_ROM } from './charset';
import { PALETTE_RGBA, LIGHT_BLUE, BLUE } from './palette';

/*
 * A cycle-stepped model of the PAL VIC-II (6569), based on Christian Bauer's
 * "The MOS 6567/6569 video controller (VIC-II) and its application in the Commodore 64".
 *
 * Effects can only draw by poking registers and memory, like real C64 code. The internal
 * counters (VC, VCBASE, RC), bad lines, idle state, border flip-flops and sprite DMA are
 * modelled, so tricks such as FLD, line crunch, FLI, opened borders and sprite multiplexing
 * only work when they are done the way the real chip requires.
 */

export const SCREEN_WIDTH = 384;
export const SCREEN_HEIGHT = 272;
export const FIRST_VISIBLE_LINE = 16;
export const RASTER_LINES = 312;
export const CYCLES_PER_LINE = 63;
export const PAL_CLOCK = 985248;
export const FRAME_RATE = PAL_CLOCK / (RASTER_LINES * CYCLES_PER_LINE); // ~50.12 Hz

// X coordinate (sprite coordinate system) of buffer column 0
const FIRST_X = -8;

// X coordinate where the 8 pixels of a cycle start (cycle 16 ~ left edge of the display window)
const cycleX = (cycle: number) => (cycle - 14) * 8 + 4;

/**
 * A demo part. Hooks run like interrupt handlers on the real machine:
 * `frame` once per frame before raster line 0, `rasterLine` before each raster line starts.
 * Use `vic.pokeAt(cycle, ...)` inside `rasterLine` for writes timed within the line.
 */
export interface C64Program {
  init?(vic: Vic): void;
  frame?(vic: Vic, frame: number): void;
  rasterLine?(vic: Vic, line: number): void;
}

interface TimedWrite {
  cycle: number;
  addr: number;
  value: number;
}

export class Vic {
  readonly ram = new Uint8Array(0x10000);
  readonly colorRam = new Uint8Array(0x400);
  readonly regs = new Uint8Array(0x40);
  readonly rgba = new Uint8ClampedArray(SCREEN_WIDTH * SCREEN_HEIGHT * 4);
  private readonly pixels = new Uint32Array(this.rgba.buffer);

  raster = 0;
  private cia2PortA = 0x03; // $DD00 bits 0-1 select the VIC bank (inverted)
  private readonly pending: TimedWrite[] = [];

  // Display state
  private vc = 0;
  private vcbase = 0;
  private rc = 0;
  private displayState = false;
  private denSeen = false;
  private verticalBorder = true;
  private mainBorder = true;
  private readonly vmScreen = new Uint8Array(40);
  private readonly vmColor = new Uint8Array(40);

  // Sprite state
  private readonly spriteDma = new Array<boolean>(8).fill(false);
  private readonly spriteExpFlip = new Array<boolean>(8).fill(true);
  private readonly spriteMcbase = new Uint8Array(8);
  private readonly spriteDisplayNext = new Array<boolean>(8).fill(false);
  private readonly spriteRowNext = new Uint32Array(8);
  private readonly spriteDisplay = new Array<boolean>(8).fill(false);
  private readonly spriteRow = new Uint32Array(8);

  // Scratch output of graphicsPixel / spritePixel
  private gColor = 0;
  private gForeground = false;
  private spriteBehind = false;

  constructor() {
    this.reset();
  }

  /** Power-on state, as left by the KERNAL: blue screen, light blue border and text. */
  reset() {
    this.ram.fill(0);
    this.regs.fill(0);
    this.ram.fill(0x20, 0x0400, 0x07e8);
    this.colorRam.fill(LIGHT_BLUE);
    this.cia2PortA = 0x03;
    this.regs[0x11] = 0x1b;
    this.regs[0x16] = 0xc8;
    this.regs[0x18] = 0x15;
    this.regs[0x20] = LIGHT_BLUE;
    this.regs[0x21] = BLUE;
    this.pending.length = 0;
  }

  /** Write to the C64 address space: VIC registers, colour RAM, CIA2 port A, otherwise RAM. */
  poke(addr: number, value: number) {
    value &= 0xff;
    if (addr >= 0xd000 && addr <= 0xd3ff) this.regs[addr & 0x3f] = value;
    else if (addr >= 0xd800 && addr <= 0xdbff) this.colorRam[addr - 0xd800] = value & 0x0f;
    else if (addr === 0xdd00) this.cia2PortA = value;
    else this.ram[addr & 0xffff] = value;
  }

  peek(addr: number): number {
    if (addr >= 0xd000 && addr <= 0xd3ff) {
      const reg = addr & 0x3f;
      if (reg === 0x12) return this.raster & 0xff;
      if (reg === 0x11) return (this.regs[0x11] & 0x7f) | ((this.raster & 0x100) >> 1);
      return this.regs[reg];
    }
    if (addr >= 0xd800 && addr <= 0xdbff) return this.colorRam[addr - 0xd800];
    if (addr === 0xdd00) return this.cia2PortA;
    return this.ram[addr & 0xffff];
  }

  /** Schedule a write at a cycle (1-63) of the current raster line. */
  pokeAt(cycle: number, addr: number, value: number) {
    this.pending.push({ cycle, addr, value });
  }

  runFrame(program: C64Program, frame: number) {
    program.frame?.(this, frame);
    for (let line = 0; line < RASTER_LINES; line++) {
      this.raster = line;
      program.rasterLine?.(this, line);
      this.runLine(line);
      this.pending.length = 0;
    }
  }

  // Read through the VIC's 16 KB window. Banks 0 and 2 see the character ROM at $1000-$1FFF.
  private readVic(addr14: number): number {
    const bank = 3 - (this.cia2PortA & 3);
    if ((bank & 1) === 0 && (addr14 & 0x3000) === 0x1000) return CHAR_ROM[addr14 & 0x0fff];
    return this.ram[(bank << 14) | (addr14 & 0x3fff)];
  }

  private checkVerticalBorder(line: number) {
    const d011 = this.regs[0x11];
    const rsel = d011 & 0x08;
    if (line === (rsel ? 251 : 247)) this.verticalBorder = true;
    if (line === (rsel ? 51 : 55) && d011 & 0x10) this.verticalBorder = false;
  }

  private runLine(line: number) {
    const regs = this.regs;
    const pending = this.pending;
    if (pending.length > 1) pending.sort((a, b) => a.cycle - b.cycle);
    let writeIndex = 0;

    const row = line - FIRST_VISIBLE_LINE;
    const visible = row >= 0 && row < SCREEN_HEIGHT;
    const rowOffset = row * SCREEN_WIDTH;

    if (line === 0) {
      this.vcbase = 0;
      this.denSeen = false;
    }

    // Sprite data latched at cycle 58 of the previous line is displayed on this line
    let anySprite = false;
    for (let i = 0; i < 8; i++) {
      this.spriteDisplay[i] = this.spriteDisplayNext[i];
      this.spriteRow[i] = this.spriteRowNext[i];
      anySprite ||= this.spriteDisplay[i];
    }

    let badlineSince = -1;
    let vcLine = this.vc;

    for (let cycle = 1; cycle <= CYCLES_PER_LINE; cycle++) {
      while (writeIndex < pending.length && pending[writeIndex].cycle <= cycle) {
        const w = pending[writeIndex++];
        this.poke(w.addr, w.value);
      }

      const d011 = regs[0x11];
      if (line === 0x30 && d011 & 0x10) this.denSeen = true;
      const badline = this.denSeen && line >= 0x30 && line <= 0xf7 && (line & 7) === (d011 & 7);
      if (badline) {
        if (badlineSince < 0) badlineSince = cycle;
        this.displayState = true;
      }

      if (cycle === 14) {
        this.vc = this.vcbase;
        vcLine = this.vc;
        if (badline) this.rc = 0;
      }

      if (cycle === 15) {
        for (let i = 0; i < 8; i++) {
          if (!this.spriteDma[i] || !this.spriteExpFlip[i]) continue;
          this.spriteMcbase[i] += 3;
          if (this.spriteMcbase[i] >= 63) this.spriteDma[i] = false;
        }
      }

      // c-accesses: fetch screen and colour RAM into the video matrix line buffer
      if (badline && cycle >= 15 && cycle <= 54) {
        const i = cycle - 15;
        if (badlineSince > 12 && cycle < badlineSince + 3) {
          // Bad line started late (the FLI trick): the first fetches read $FF from the bus
          this.vmScreen[i] = 0xff;
          this.vmColor[i] = 0x0f;
        } else {
          const vci = (vcLine + i) & 0x3ff;
          this.vmScreen[i] = this.readVic(((regs[0x18] & 0xf0) << 6) | vci);
          this.vmColor[i] = this.colorRam[vci] & 0x0f;
        }
      }

      // g-accesses advance VC in display state
      if (cycle >= 16 && cycle <= 55 && this.displayState) {
        this.vc = (this.vc + 1) & 0x3ff;
      }

      if (cycle === 55) {
        const d015 = regs[0x15];
        const d017 = regs[0x17];
        for (let i = 0; i < 8; i++) {
          const expandY = (d017 >> i) & 1;
          this.spriteExpFlip[i] = expandY ? !this.spriteExpFlip[i] : true;
          if ((d015 >> i) & 1 && regs[i * 2 + 1] === (line & 0xff) && !this.spriteDma[i]) {
            this.spriteDma[i] = true;
            this.spriteMcbase[i] = 0;
            if (expandY) this.spriteExpFlip[i] = false;
          }
        }
      }

      if (cycle === 58) {
        if (this.rc === 7) {
          this.vcbase = this.vc;
          if (!badline) this.displayState = false;
        }
        if (this.displayState) this.rc = (this.rc + 1) & 7;

        const pointerBase = ((regs[0x18] & 0xf0) << 6) | 0x3f8;
        for (let i = 0; i < 8; i++) {
          this.spriteDisplayNext[i] = this.spriteDma[i];
          if (!this.spriteDma[i]) continue;
          const data = (this.readVic(pointerBase | i) << 6) | this.spriteMcbase[i];
          this.spriteRowNext[i] =
            (this.readVic(data) << 16) | (this.readVic(data + 1) << 8) | this.readVic(data + 2);
        }
      }

      // Output this cycle's 8 pixels and run the border comparisons
      const x0 = cycleX(cycle);
      const csel = regs[0x16] & 0x08;
      const leftCompare = csel ? 24 : 31;
      const rightCompare = csel ? 344 : 335;
      for (let x = x0; x < x0 + 8; x++) {
        if (x === rightCompare) this.mainBorder = true;
        if (x === leftCompare) {
          this.checkVerticalBorder(line);
          if (!this.verticalBorder) this.mainBorder = false;
        }

        const col = x - FIRST_X;
        if (!visible || col < 0 || col >= SCREEN_WIDTH) continue;

        let color: number;
        if (this.mainBorder) {
          color = regs[0x20];
        } else {
          this.graphicsPixel(x, vcLine);
          color = this.gColor;
          if (anySprite) {
            const spriteColor = this.spritePixel(x);
            if (spriteColor >= 0 && !(this.spriteBehind && this.gForeground)) color = spriteColor;
          }
        }
        this.pixels[rowOffset + col] = PALETTE_RGBA[color & 0x0f];
      }

      if (cycle === CYCLES_PER_LINE) this.checkVerticalBorder(line);
    }
  }

  private graphicsPixel(x: number, vcLine: number) {
    const regs = this.regs;
    const d011 = regs[0x11];
    const d016 = regs[0x16];
    const d018 = regs[0x18];
    const bg0 = regs[0x21];
    const gx = x - 24 - (d016 & 7);

    if (gx < 0 || gx >= 320) {
      this.gColor = bg0;
      this.gForeground = false;
      return;
    }

    const i = gx >> 3;
    const bitPos = gx & 7;
    const ecm = d011 & 0x40;
    const bmm = d011 & 0x20;
    const mcm = d016 & 0x10;

    if (!this.displayState) {
      // Idle state shows the byte at $3FFF ($39FF with ECM): 0 bits background, 1 bits black
      const data = this.readVic(ecm ? 0x39ff : 0x3fff);
      const bit = (data >> (7 - bitPos)) & 1;
      this.gColor = bmm || bit ? 0 : bg0;
      this.gForeground = bit === 1;
      return;
    }

    const scr = this.vmScreen[i];
    const colr = this.vmColor[i];
    const data = bmm
      ? this.readVic(((d018 & 0x08) << 10) | (((vcLine + i) & 0x3ff) << 3) | this.rc)
      : this.readVic(((d018 & 0x0e) << 10) | ((ecm ? scr & 0x3f : scr) << 3) | this.rc);
    const bit = (data >> (7 - bitPos)) & 1;
    const pair = (data >> (6 - (bitPos & 6))) & 3;

    if (ecm && (bmm || mcm)) {
      // Invalid modes output black
      this.gColor = 0;
      this.gForeground = mcm ? pair >= 2 : bit === 1;
    } else if (bmm && mcm) {
      this.gColor = pair === 0 ? bg0 : pair === 1 ? scr >> 4 : pair === 2 ? scr & 0x0f : colr;
      this.gForeground = pair >= 2;
    } else if (bmm) {
      this.gColor = bit ? scr >> 4 : scr & 0x0f;
      this.gForeground = bit === 1;
    } else if (ecm) {
      this.gColor = bit ? colr : regs[0x21 + (scr >> 6)];
      this.gForeground = bit === 1;
    } else if (mcm && colr & 0x08) {
      this.gColor = pair === 0 ? bg0 : pair === 1 ? regs[0x22] : pair === 2 ? regs[0x23] : colr & 7;
      this.gForeground = pair >= 2;
    } else {
      this.gColor = bit ? (mcm ? colr & 7 : colr) : bg0;
      this.gForeground = bit === 1;
    }
  }

  // Colour of the highest-priority sprite pixel at x, or -1 if transparent
  private spritePixel(x: number): number {
    const regs = this.regs;
    for (let i = 0; i < 8; i++) {
      if (!this.spriteDisplay[i]) continue;
      let sx = regs[i * 2] | (((regs[0x10] >> i) & 1) << 8);
      if (sx >= 0x1f8) sx -= 0x1f8;
      const expandX = (regs[0x1d] >> i) & 1;
      const dx = x - sx;
      if (dx < 0 || dx >= (expandX ? 48 : 24)) continue;
      const px = expandX ? dx >> 1 : dx;
      const data = this.spriteRow[i];
      let color = -1;
      if ((regs[0x1c] >> i) & 1) {
        const pair = (data >> (22 - (px & ~1))) & 3;
        if (pair === 1) color = regs[0x25];
        else if (pair === 2) color = regs[0x27 + i];
        else if (pair === 3) color = regs[0x26];
      } else if ((data >> (23 - px)) & 1) {
        color = regs[0x27 + i];
      }
      if (color >= 0) {
        this.spriteBehind = ((regs[0x1b] >> i) & 1) === 1;
        return color;
      }
    }
    return -1;
  }
}
