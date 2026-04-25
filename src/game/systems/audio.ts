// Procedural audio manager for Claude Code RPG.
// Generates a cozy lo-fi piano/pad loop via Web Audio (no external audio files),
// exposes a master/music/sfx volume bus, and persists settings to localStorage.

type Volumes = {
  master: number; // 0..1
  music: number;  // 0..1
  sfx: number;    // 0..1
  muted: boolean;
};

const STORAGE_KEY = "claude-code-rpg-audio";
const DEFAULTS: Volumes = { master: 0.8, music: 0.7, sfx: 0.7, muted: false };

// 8-second cozy loop in C major-ish: Cmaj7 → Fmaj7 → Am7 → G7sus.
// Chord notes (Hz) for warm triangle-wave pads.
const PROGRESSION: number[][] = [
  [130.81, 164.81, 196.00, 246.94], // C3 E3 G3 B3  (Cmaj7)
  [174.61, 220.00, 261.63, 329.63], // F3 A3 C4 E4  (Fmaj7)
  [110.00, 164.81, 196.00, 261.63], // A2 E3 G3 C4  (Am7)
  [146.83, 196.00, 246.94, 293.66], // D3 G3 B3 D4  (G7sus-ish)
];

// Melody — sparse, pentatonic, four notes per bar (half a second each).
// Frequencies chosen to sit above the pad without clashing.
const MELODY: number[][] = [
  [523.25, 659.25, 783.99, 659.25], // C5 E5 G5 E5
  [698.46, 523.25, 659.25, 523.25], // F5 C5 E5 C5
  [440.00, 523.25, 659.25, 783.99], // A4 C5 E5 G5
  [587.33, 493.88, 440.00, 392.00], // D5 B4 A4 G4
];

const BAR_SECONDS = 2.0;
const LOOP_SECONDS = BAR_SECONDS * PROGRESSION.length;
const MELODY_STEP = BAR_SECONDS / 4;

// Track each scheduled node with its stop time so pruning is accurate.
type TrackedNode = { node: AudioScheduledSourceNode; stopAt: number };

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private volumes: Volumes = this.load();
  private listeners = new Set<(v: Volumes) => void>();

  private musicRunning = false;
  private nextLoopTimer: number | null = null;
  private trackedNodes: TrackedNode[] = [];

  // Whether music was playing before the tab became hidden, so we can resume.
  private wasPlayingBeforeHide = false;

  constructor() {
    if (typeof document !== "undefined") {
      // Stop the music loop whenever the tab is hidden, so background tabs
      // don't leak audio. Restart it when the tab becomes visible again.
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.wasPlayingBeforeHide = this.musicRunning;
          if (this.musicRunning) this.stopMusic();
          if (this.ctx && this.ctx.state === "running") {
            void this.ctx.suspend();
          }
        } else if (this.wasPlayingBeforeHide) {
          this.wasPlayingBeforeHide = false;
          if (this.ctx && this.ctx.state === "suspended") {
            void this.ctx.resume();
          }
          this.startMusic();
        }
      });
    }
    if (typeof window !== "undefined") {
      // On tab close / navigation away, fully tear down the audio context
      // so it can't keep producing sound from a backgrounded process.
      const teardown = () => {
        this.stopMusic();
        if (this.ctx) {
          try { void this.ctx.close(); } catch { /* ignore */ }
          this.ctx = null;
          this.masterGain = null;
          this.musicGain = null;
          this.sfxGain = null;
        }
      };
      window.addEventListener("pagehide", teardown);
      window.addEventListener("beforeunload", teardown);
    }
  }

  // ─── persistence ───────────────────────────────────────────────

  private load(): Volumes {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      // ignore — fall through to defaults
    }
    return { ...DEFAULTS };
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.volumes));
    } catch {
      // ignore quota / privacy-mode failures
    }
  }

  // ─── public volume API ────────────────────────────────────────

  getVolumes(): Volumes {
    return { ...this.volumes };
  }

  onChange(fn: (v: Volumes) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const snap = this.getVolumes();
    for (const fn of this.listeners) fn(snap);
  }

  setMaster(v: number) {
    this.volumes.master = clamp(v);
    this.applyGain(this.masterGain, this.effectiveMaster());
    this.save();
    this.notify();
  }

  setMusic(v: number) {
    this.volumes.music = clamp(v);
    this.applyGain(this.musicGain, this.volumes.music);
    this.save();
    this.notify();
  }

  setSfx(v: number) {
    this.volumes.sfx = clamp(v);
    this.applyGain(this.sfxGain, this.volumes.sfx);
    this.save();
    this.notify();
  }

  toggleMute() {
    this.volumes.muted = !this.volumes.muted;
    this.applyGain(this.masterGain, this.effectiveMaster());
    this.save();
    this.notify();
    return this.volumes.muted;
  }

  // ─── engine lifecycle ─────────────────────────────────────────

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor: typeof AudioContext | undefined =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    this.ctx = new Ctor();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.effectiveMaster(), 0);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.volumes.music, 0);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.volumes.sfx, 0);
    this.sfxGain.connect(this.masterGain);

    return this.ctx;
  }

  // Call this from any user gesture handler to unlock the context.
  resume() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  private effectiveMaster(): number {
    return this.volumes.muted ? 0 : this.volumes.master;
  }

  // Use setValueAtTime at context.currentTime for an immediate, reliable change
  // that isn't overridden by any prior automation on the same param.
  private applyGain(node: GainNode | null, value: number) {
    if (!node || !this.ctx) return;
    const now = this.ctx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(value, now);
  }

  // ─── music loop ───────────────────────────────────────────────

  startMusic() {
    if (this.musicRunning) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    this.musicRunning = true;
    this.scheduleLoop();
  }

  stopMusic() {
    this.musicRunning = false;
    if (this.nextLoopTimer !== null) {
      window.clearTimeout(this.nextLoopTimer);
      this.nextLoopTimer = null;
    }
    for (const { node } of this.trackedNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    this.trackedNodes = [];
  }

  private scheduleLoop() {
    if (!this.musicRunning || !this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const start = now + 0.05;

    // Prune nodes whose scheduled stop time is in the past.
    this.trackedNodes = this.trackedNodes.filter((t) => t.stopAt > now);

    for (let bar = 0; bar < PROGRESSION.length; bar++) {
      const barStart = start + bar * BAR_SECONDS;
      const chord = PROGRESSION[bar];
      for (const freq of chord) this.playPad(freq, barStart, BAR_SECONDS);

      const melody = MELODY[bar];
      for (let step = 0; step < melody.length; step++) {
        this.playMelodyNote(melody[step], barStart + step * MELODY_STEP, MELODY_STEP * 0.9);
      }
    }

    // Schedule the next loop just before this one ends so there's no gap.
    const delayMs = (LOOP_SECONDS - 0.1) * 1000;
    this.nextLoopTimer = window.setTimeout(() => this.scheduleLoop(), delayMs);
  }

  private track(node: AudioScheduledSourceNode, stopAt: number) {
    this.trackedNodes.push({ node, stopAt });
  }

  private playPad(freq: number, start: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    // Raised from 0.055 to 0.16 so volume changes are clearly audible.
    const peak = 0.16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.4);
    gain.gain.linearRampToValueAtTime(peak * 0.7, start + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, start + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
    this.track(osc, start + duration + 0.1);
  }

  private playMelodyNote(freq: number, start: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    // Soft piano-ish tone: sine carrier + subtle octave shimmer.
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const shimmer = this.ctx.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = freq * 2;

    const gain = this.ctx.createGain();
    // Raised from 0.14 to 0.32 for audibility.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.32, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, start);
    shimmerGain.gain.linearRampToValueAtTime(0.06, start + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, start + duration * 0.6);

    osc.connect(gain);
    shimmer.connect(shimmerGain);
    gain.connect(this.musicGain);
    shimmerGain.connect(this.musicGain);

    const stopAt = start + duration + 0.1;
    osc.start(start);
    osc.stop(start + duration + 0.05);
    shimmer.start(start);
    shimmer.stop(start + duration + 0.05);
    this.track(osc, stopAt);
    this.track(shimmer, stopAt);
  }

  // ─── UI sound effects ─────────────────────────────────────────

  playBlip(kind: "move" | "select" | "back" = "move") {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const freq = kind === "select" ? 880 : kind === "back" ? 420 : 660;
    const duration = kind === "select" ? 0.12 : 0.06;

    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const audio = new AudioManager();
