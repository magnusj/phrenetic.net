import type { Vic } from './vic';

/*
 * A sprite multiplexer: shows more than 8 sprites by reusing the hardware sprites further down
 * the screen. Each frame the virtual sprites are sorted by Y and handed out to the 8 hardware
 * sprites round-robin. A hardware sprite is reprogrammed on the raster line after its previous
 * sprite has finished displaying; a sprite that would need one before it is free is dropped,
 * as on the real machine.
 */

const SPRITE_LINES = 21;

export interface VirtualSprite {
  x: number;
  line: number; // first displayed raster line
  pointer: number;
  color?: number;
}

interface Write {
  slot: number;
  sprite: VirtualSprite;
}

export class SpriteMultiplexer {
  /** Number of sprites dropped in the last scheduled frame. */
  dropped = 0;
  private readonly writes = new Map<number, Write[]>();
  private enabled = 0; // hardware sprites used this frame
  private readonly pointerBase: number;

  /** @param screen address of the screen whose last 8 bytes hold the sprite pointers */
  constructor(screen: number) {
    this.pointerBase = screen + 0x3f8;
  }

  /** Plan the hardware sprite writes for the next frame. */
  schedule(sprites: VirtualSprite[]) {
    this.writes.clear();
    this.dropped = 0;
    this.enabled = 0;
    const sorted = [...sprites].sort((a, b) => a.line - b.line);
    const freeAt = new Array<number>(8).fill(0);
    let next = 0;
    for (const sprite of sorted) {
      const slot = next;
      const writeLine = freeAt[slot];
      // The Y compare happens at cycle 55, so the write must land by the line before the sprite starts
      if (sprite.line - 1 < writeLine) {
        this.dropped++;
        continue;
      }
      const list = this.writes.get(writeLine) ?? [];
      list.push({ slot, sprite });
      this.writes.set(writeLine, list);
      freeAt[slot] = sprite.line + SPRITE_LINES;
      this.enabled |= 1 << slot;
      next = (next + 1) % 8;
    }
  }

  /** Call at the start of every raster line. */
  rasterLine(vic: Vic, line: number) {
    // Switch off hardware sprites with nothing to show, or they would keep repeating their last sprite
    if (line === 0) vic.poke(0xd015, this.enabled);
    const list = this.writes.get(line);
    if (!list) return;
    for (const { slot, sprite } of list) {
      const x = Math.round(sprite.x) & 0x1ff;
      vic.poke(0xd000 + slot * 2, x & 0xff);
      const msb = vic.peek(0xd010);
      vic.poke(0xd010, x > 0xff ? msb | (1 << slot) : msb & ~(1 << slot));
      vic.poke(0xd001 + slot * 2, (sprite.line - 1) & 0xff);
      if (sprite.color !== undefined) vic.poke(0xd027 + slot, sprite.color);
      vic.ram[this.pointerBase + slot] = sprite.pointer;
    }
  }
}
