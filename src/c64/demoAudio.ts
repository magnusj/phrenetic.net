// 1541 disk drive sounds (EdR, Pixabay Content License), cut into the search/load and the IRQ loader
const EFFECTS = {
  search: '/c64/drive-search.mp3',
  loader: '/c64/drive-loader.mp3',
} as const;

// Music by Chock of Maniax, recorded on a real MOS 6581R4 (Stone Oakvalley's Authentic SID Collection)
const MUSIC = {
  alive: '/c64/alive.mp3',
  forYou: '/c64/for-you.mp3',
} as const;

const EFFECTS_VOLUME = 0.5;

export type EffectName = keyof typeof EFFECTS;
export type MusicName = keyof typeof MUSIC;

/**
 * All C64 demo audio. Short effects play from decoded buffers; music streams from audio elements.
 * Call unlock() from a user gesture before anything can play (required by mobile Safari).
 * One shared instance (`demoAudio`) lives for the whole page, so the selector can unlock it in the
 * click that opens the C64 demo.
 */
export class DemoAudio {
  private ctx: AudioContext | null = null;
  private effectsGain: GainNode | null = null;
  private readonly effects = new Map<EffectName, Promise<AudioBuffer>>();
  private readonly music = new Map<MusicName, HTMLAudioElement>();
  private playingEffect: AudioBufferSourceNode | null = null;
  private playingMusic: HTMLAudioElement | null = null;

  get unlocked() {
    return this.ctx !== null;
  }

  unlock() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    void ctx.resume();
    this.effectsGain = ctx.createGain();
    this.effectsGain.gain.value = EFFECTS_VOLUME;
    this.effectsGain.connect(ctx.destination);

    for (const [name, url] of Object.entries(EFFECTS) as [EffectName, string][]) {
      this.effects.set(
        name,
        fetch(url)
          .then((res) => res.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data)),
      );
    }

    for (const [name, url] of Object.entries(MUSIC) as [MusicName, string][]) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      // Starting playback inside the gesture unlocks the element for later play() calls on iOS
      audio.muted = true;
      void audio
        .play()
        .then(() => audio.pause())
        .catch(() => {});
      this.music.set(name, audio);
    }
  }

  async playEffect(name: EffectName) {
    const ctx = this.ctx;
    const buffer = await this.effects.get(name)?.catch(() => null);
    const gain = this.effectsGain;
    if (!ctx || !gain || !buffer || ctx.state === 'closed') return;
    this.stopEffect();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start();
    this.playingEffect = source;
  }

  stopEffect() {
    this.playingEffect?.stop();
    this.playingEffect = null;
  }

  playMusic(name: MusicName) {
    const audio = this.music.get(name);
    if (!audio) return;
    this.playingMusic?.pause();
    audio.currentTime = 0;
    audio.muted = false;
    void audio.play().catch(() => {});
    this.playingMusic = audio;
  }

  /** Silence everything, keeping the unlocked context and elements for the next visit. */
  stopAll() {
    this.stopEffect();
    this.playingMusic?.pause();
    this.playingMusic = null;
  }
}

export const demoAudio = new DemoAudio();
