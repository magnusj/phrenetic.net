import { ScreenEditor } from '../screenEditor';
import { printAt, SCREEN_RAM, COLUMNS, ROWS } from '../text';
import { BLACK, WHITE, LIGHT_GREY, GREY, DARK_GREY, LIGHT_BLUE, CYAN } from '../palette';
import type { C64Program, Vic } from '../vic';

/** The opening: boot screen, typed LOAD and RUN, then an IRQ loader with a progress bar. */
export interface LoadSequence extends C64Program {
  /** Begin typing. Call from the user gesture that also unlocks audio. */
  start(): void;
  readonly finished: boolean;
}

/** Hooks for things outside the C64 screen, such as the drive sound. */
export interface LoadSequenceEvents {
  onSearch?: () => void;
  onLoaderStart?: () => void;
  onFinished?: () => void;
}

type Step = { wait: number; run: (vic: Vic) => void };

const LOADER_FRAMES = 340; // ~6.8 s, the length of the loader drive sound
const BAR_ROW = 14;
const BAR_START = 4;
const BAR_LENGTH = 32;
const STRIPE_COLORS = [BLACK, DARK_GREY, GREY, LIGHT_GREY, LIGHT_BLUE, CYAN, WHITE];

export const createLoadSequence = (events: LoadSequenceEvents = {}): LoadSequence => {
  let editor: ScreenEditor;
  let started = false;
  let finished = false;
  let loading = false;
  let cursorOn = true; // the cursor only shows while BASIC waits for input
  let loaderFrame = 0;
  let steps: Step[] = [];
  let wait = 0;

  // Deterministic pseudo-random sequence so every run looks the same
  let seed = 0x6502;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const typeSteps = (text: string): Step[] =>
    Array.from(text, (ch) => ({ wait: 4 + Math.floor(random() * 6), run: () => editor.type(ch) }));

  const startLoader = (vic: Vic) => {
    loading = true;
    events.onLoaderStart?.();
    vic.ram.fill(0x20, SCREEN_RAM, SCREEN_RAM + COLUMNS * ROWS);
    vic.poke(0xd020, BLACK);
    vic.poke(0xd021, BLACK);
    printAt(vic, 15, 10, 'PHRENETIC', WHITE);
    printAt(vic, 14, 12, 'LOADING...', GREY);
    printAt(vic, BAR_START, BAR_ROW, ' '.repeat(BAR_LENGTH), LIGHT_GREY);
  };

  return {
    get finished() {
      return finished;
    },

    start() {
      if (started) return;
      started = true;
      steps = [
        { wait: 25, run: () => {} },
        ...typeSteps('LOAD"*",8,1'),
        { wait: 18, run: () => { cursorOn = false; editor.newLine(); } },
        { wait: 2, run: () => editor.newLine() },
        {
          wait: 1,
          run: () => {
            editor.printLine('SEARCHING FOR *');
            events.onSearch?.();
          },
        },
        { wait: 70, run: () => editor.printLine('LOADING') },
        { wait: 140, run: () => { editor.printLine('READY.'); cursorOn = true; } },
        ...typeSteps('RUN'),
        { wait: 18, run: () => { cursorOn = false; editor.newLine(); } },
        { wait: 10, run: startLoader },
      ];
      wait = steps[0].wait;
    },

    init(vic) {
      vic.reset();
      editor = new ScreenEditor(vic);
      printAt(vic, 4, 1, '**** COMMODORE 64 BASIC V2 ****');
      printAt(vic, 1, 3, '64K RAM SYSTEM  38911 BASIC BYTES FREE');
      printAt(vic, 0, 5, 'READY.');
      editor.row = 6;
    },

    frame(vic) {
      if (finished) return;

      if (loading) {
        loaderFrame++;
        const filled = Math.min(BAR_LENGTH, Math.floor((loaderFrame / LOADER_FRAMES) * BAR_LENGTH));
        for (let i = 0; i < filled; i++) vic.ram[SCREEN_RAM + BAR_ROW * COLUMNS + BAR_START + i] = 0xa0;
        if (loaderFrame >= LOADER_FRAMES) {
          finished = true;
          events.onFinished?.();
          vic.poke(0xd020, BLACK);
          vic.ram.fill(0x20, SCREEN_RAM, SCREEN_RAM + COLUMNS * ROWS);
        }
        return;
      }

      editor.blink(cursorOn);
      if (steps.length === 0) return;
      if (--wait > 0) return;
      steps.shift()!.run(vic);
      if (steps.length > 0) wait = steps[0].wait;
    },

    // While loading, the IRQ loader flashes the border with every received byte: stripes of data
    rasterLine(vic) {
      if (!loading || finished) return;
      if (random() < 0.18) {
        vic.poke(0xd020, STRIPE_COLORS[Math.floor(random() * STRIPE_COLORS.length)]);
      }
    },
  };
};
