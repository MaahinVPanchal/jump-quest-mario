type SfxName =
  | "jump"
  | "land"
  | "coin"
  | "block"
  | "break"
  | "powerup"
  | "hurt"
  | "stomp"
  | "shoot"
  | "checkpoint"
  | "pipe"
  | "goal"
  | "life"
  | "death"
  | "menu";

interface Recipe {
  freq: number;
  to?: number;
  dur: number;
  type: OscillatorType;
  gain?: number;
  steps?: number[];
}

const RECIPES: Record<SfxName, Recipe> = {
  jump: { freq: 300, to: 720, dur: 0.16, type: "square", gain: 0.22 },
  land: { freq: 200, to: 90, dur: 0.09, type: "triangle", gain: 0.16 },
  coin: { freq: 900, to: 1500, dur: 0.12, type: "square", gain: 0.16 },
  block: { freq: 220, to: 160, dur: 0.1, type: "square", gain: 0.2 },
  break: { freq: 400, to: 60, dur: 0.22, type: "sawtooth", gain: 0.2 },
  powerup: { freq: 380, dur: 0.5, type: "square", gain: 0.2, steps: [380, 520, 660, 880, 1180] },
  hurt: { freq: 420, to: 90, dur: 0.35, type: "sawtooth", gain: 0.24 },
  stomp: { freq: 520, to: 140, dur: 0.14, type: "square", gain: 0.22 },
  shoot: { freq: 700, to: 420, dur: 0.1, type: "sawtooth", gain: 0.16 },
  checkpoint: { freq: 500, dur: 0.4, type: "triangle", gain: 0.2, steps: [520, 700, 940] },
  pipe: { freq: 600, to: 120, dur: 0.3, type: "sine", gain: 0.2 },
  goal: { freq: 400, dur: 1.1, type: "square", gain: 0.2, steps: [523, 659, 784, 1046, 1318] },
  life: { freq: 660, dur: 0.4, type: "triangle", gain: 0.2, steps: [660, 880, 1320] },
  death: { freq: 400, to: 60, dur: 0.9, type: "square", gain: 0.24 },
  menu: { freq: 620, to: 760, dur: 0.07, type: "square", gain: 0.12 },
};

/** Original, fully synthesized audio - no sampled or third-party assets. */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private currentTrack: "level" | "star" | "bonus" | null = null;

  settings = { master: 0.8, music: 0.5, sfx: 0.8 };

  private ensure(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return true;
  }

  applyVolumes(): void {
    if (!this.master || !this.musicGain || !this.sfxGain) return;
    this.master.gain.value = this.settings.master;
    this.musicGain.gain.value = this.settings.music;
    this.sfxGain.gain.value = this.settings.sfx;
  }

  unlock(): void {
    this.ensure();
  }

  play(name: SfxName): void {
    if (!this.ensure() || !this.ctx || !this.sfxGain) return;
    const r = RECIPES[name];
    const now = this.ctx.currentTime;
    if (r.steps) {
      r.steps.forEach((f, i) => this.blip(f, undefined, r.dur / r.steps!.length, r.type, r.gain ?? 0.2, now + i * (r.dur / r.steps!.length)));
      return;
    }
    this.blip(r.freq, r.to, r.dur, r.type, r.gain ?? 0.2, now);
  }

  private blip(
    freq: number,
    to: number | undefined,
    dur: number,
    type: OscillatorType,
    gain: number,
    at: number,
  ): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  /** Simple original loop; three moods share one sequencer. */
  startMusic(track: "level" | "star" | "bonus"): void {
    if (!this.ensure() || !this.ctx) return;
    if (this.currentTrack === track && this.musicTimer !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    this.musicStep = 0;
    const tempo = track === "star" ? 105 : track === "bonus" ? 130 : 150;
    this.musicTimer = window.setInterval(() => this.tick(track), tempo);
  }

  private tick(track: "level" | "star" | "bonus"): void {
    if (!this.ctx || !this.musicGain) return;
    const melodies: Record<string, number[]> = {
      level: [523, 0, 659, 784, 0, 659, 587, 0, 523, 0, 440, 523, 587, 0, 494, 0],
      star: [784, 880, 988, 880, 784, 880, 1046, 880, 784, 880, 988, 1174, 1046, 988, 880, 784],
      bonus: [659, 784, 880, 1046, 988, 880, 784, 659, 587, 659, 784, 880, 784, 659, 587, 523],
    };
    const bass = [131, 0, 0, 0, 165, 0, 0, 0, 175, 0, 0, 0, 147, 0, 0, 0];
    const mel = melodies[track]!;
    const i = this.musicStep % mel.length;
    const now = this.ctx.currentTime;
    const note = mel[i]!;
    if (note > 0) this.musicNote(note, 0.14, "square", 0.06, now);
    const b = bass[i]!;
    if (b > 0) this.musicNote(b, 0.3, "triangle", 0.08, now);
    this.musicStep++;
  }

  private musicNote(freq: number, dur: number, type: OscillatorType, gain: number, at: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.currentTrack = null;
  }
}

export const audio = new AudioManager();
