import type { SoundName } from './types';
import { readJSON, writeJSON } from './storage';

// Tiny synthesised sound effects via Web Audio: no audio files to download.

interface Note {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

const SOUNDS: Record<SoundName, Note[]> = {
  tap: [{ freq: 660, at: 0, dur: 0.05, type: 'triangle', gain: 0.12 }],
  flip: [{ freq: 520, at: 0, dur: 0.07, type: 'triangle', gain: 0.14 }],
  drop: [{ freq: 300, at: 0, dur: 0.08, type: 'sine', gain: 0.18 }],
  good: [
    { freq: 660, at: 0, dur: 0.09, type: 'triangle' },
    { freq: 990, at: 0.08, dur: 0.14, type: 'triangle' },
  ],
  bad: [
    { freq: 220, at: 0, dur: 0.12, type: 'sawtooth', gain: 0.08 },
    { freq: 170, at: 0.1, dur: 0.16, type: 'sawtooth', gain: 0.08 },
  ],
  win: [
    { freq: 523, at: 0, dur: 0.12, type: 'triangle' },
    { freq: 659, at: 0.12, dur: 0.12, type: 'triangle' },
    { freq: 784, at: 0.24, dur: 0.12, type: 'triangle' },
    { freq: 1047, at: 0.36, dur: 0.3, type: 'triangle' },
  ],
};

let ctx: AudioContext | null = null;
let muted = readJSON<boolean>('muted', false);
const listeners = new Set<(muted: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  writeJSON('muted', value);
  listeners.forEach((fn) => fn(value));
}

export function onMuteChange(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function playSound(name: SoundName): void {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    for (const note of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type ?? 'sine';
      osc.frequency.value = note.freq;
      const start = now + note.at;
      const peak = note.gain ?? 0.15;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + note.dur + 0.02);
    }
  } catch {
    // Audio unavailable (e.g. autoplay policy, old browser): stay silent.
  }
}
