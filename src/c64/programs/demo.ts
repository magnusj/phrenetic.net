import { createLoadSequence } from './loadSequence';
import { createLogoPart } from './logoPart';
import { createMultiplexerPart } from './multiplexerPart';
import { createDycpPart } from './dycpPart';
import { createPlasmaPart } from './plasmaPart';
import { createTwisterPart } from './twisterPart';
import { createRotozoomerPart, createTunnelPart } from './chunkyParts';
import { createVectorPart } from './vectorPart';
import { createScrollWorldPart } from './scrollWorldPart';
import { createFliPart } from './fliPart';
import { createEndPart } from './endPart';
import { createBootScreen } from './bootScreen';
import type { DemoAudio, MusicName } from '../demoAudio';
import type { C64Program, Vic } from '../vic';

/** A demo part runs until `finished`, then the next part takes over. */
export interface Part extends C64Program {
  readonly finished: boolean;
}

interface PartEntry {
  seconds: number;
  create: (frames: number) => Part;
  /** Music to start when the part begins */
  music?: MusicName;
  /** Fade the music out over this many seconds at the end of the part */
  fadeOutMusic?: number;
}

const FPS = 50;

// Parts after the load sequence, in order. The last part keeps running when it finishes.
const PARTS: PartEntry[] = [
  { seconds: 20, create: createLogoPart, music: 'alive' },
  { seconds: 20, create: createMultiplexerPart },
  { seconds: 20, create: createDycpPart },
  { seconds: 10, create: createPlasmaPart },
  { seconds: 10, create: createTwisterPart },
  { seconds: 11, create: createRotozoomerPart },
  { seconds: 11, create: createTunnelPart },
  { seconds: 22, create: createVectorPart },
  // Alive's recording stops at its loop point, so fade it out instead of cutting to For You
  { seconds: 21, create: createScrollWorldPart, fadeOutMusic: 3 },
  { seconds: 35, create: createFliPart, music: 'forYou' },
  { seconds: 165.5, create: createEndPart },
  // After For You ends, the demo "exits" to the BASIC prompt
  { seconds: Infinity, create: () => ({ ...createBootScreen(), finished: false }) },
];

/** The whole C64 demo: load sequence, then each part in turn, starting music where a part asks for it. */
export const createC64Demo = (audio: DemoAudio): C64Program & { start(): void } => {
  const load = createLoadSequence({
    onSearch: () => void audio.playEffect('search'),
    onLoaderStart: () => void audio.playEffect('loader'),
    onFinished: () => audio.stopEffect(),
  });
  let current: Part = load;
  let entry: PartEntry | null = null;
  let next = 0;
  let partFrame = 0;

  const advance = (vic: Vic) => {
    if (!current.finished || next >= PARTS.length) return;
    entry = PARTS[next++];
    current = entry.create(Math.round(entry.seconds * FPS));
    partFrame = 0;
    vic.reset();
    current.init?.(vic);
    if (entry.music) audio.playMusic(entry.music);
  };

  const cueFade = () => {
    if (!entry?.fadeOutMusic) return;
    if (partFrame === Math.round((entry.seconds - entry.fadeOutMusic) * FPS)) audio.fadeOutMusic(entry.fadeOutMusic);
  };

  return {
    start: () => load.start(),
    init: (vic) => load.init?.(vic),
    frame(vic, frame) {
      advance(vic);
      cueFade();
      partFrame++;
      current.frame?.(vic, frame);
    },
    rasterLine: (vic, line) => current.rasterLine?.(vic, line),
  };
};
