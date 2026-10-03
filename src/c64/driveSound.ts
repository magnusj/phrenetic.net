// 1541 disk drive sounds (EdR, Pixabay Content License), cut into the search/load and the IRQ loader
const SOUNDS = {
  search: '/c64/drive-search.mp3',
  loader: '/c64/drive-loader.mp3',
} as const;

export type DriveSoundName = keyof typeof SOUNDS;

/** Plays the drive sounds through Web Audio. Call unlock() from a user gesture first. */
export class DriveSound {
  private ctx: AudioContext | null = null;
  private readonly buffers = new Map<DriveSoundName, Promise<AudioBuffer>>();
  private playing: AudioBufferSourceNode | null = null;

  unlock() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    void this.ctx.resume();
    for (const [name, url] of Object.entries(SOUNDS) as [DriveSoundName, string][]) {
      const ctx = this.ctx;
      this.buffers.set(
        name,
        fetch(url)
          .then((res) => res.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data)),
      );
    }
  }

  async play(name: DriveSoundName) {
    const ctx = this.ctx;
    const buffer = await this.buffers.get(name)?.catch(() => null);
    if (!ctx || !buffer || ctx.state === 'closed') return;
    this.stop();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    this.playing = source;
  }

  stop() {
    this.playing?.stop();
    this.playing = null;
  }

  dispose() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}
