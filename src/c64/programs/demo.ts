import { createLoadSequence } from './loadSequence';
import { createLogoPart } from './logoPart';
import { createMultiplexerPart } from './multiplexerPart';
import { createDycpPart } from './dycpPart';
import type { DemoAudio, MusicName } from '../demoAudio';
import type { C64Program, Vic } from '../vic';

/** A demo part runs until `finished`, then the next part takes over. */
export interface Part extends C64Program {
  readonly finished: boolean;
}

interface PartEntry {
  create: () => Part;
  music?: MusicName;
}

const seconds = (s: number) => Math.round(s * 50);

// Parts after the load sequence, in order. The last part keeps running when it finishes.
const PARTS: PartEntry[] = [
  { create: () => createLogoPart(seconds(20)), music: 'alive' },
  { create: () => createMultiplexerPart(seconds(20)) },
  { create: () => createDycpPart(seconds(20)) },
];

/** The whole C64 demo: load sequence, then each part in turn, starting music where a part asks for it. */
export const createC64Demo = (audio: DemoAudio): C64Program & { start(): void } => {
  const load = createLoadSequence({
    onSearch: () => void audio.playEffect('search'),
    onLoaderStart: () => void audio.playEffect('loader'),
    onFinished: () => audio.stopEffect(),
  });
  let current: Part = load;
  let next = 0;

  const advance = (vic: Vic) => {
    if (!current.finished || next >= PARTS.length) return;
    const entry = PARTS[next++];
    current = entry.create();
    vic.reset();
    current.init?.(vic);
    if (entry.music) audio.playMusic(entry.music);
  };

  return {
    start: () => load.start(),
    init: (vic) => load.init?.(vic),
    frame(vic, frame) {
      advance(vic);
      current.frame?.(vic, frame);
    },
    rasterLine: (vic, line) => current.rasterLine?.(vic, line),
  };
};
