// Tiny Web-Audio cue layer for Eco Memory. No assets — every sound is a
// shaped sine/triangle envelope, so it ships in <1 KB and works offline.
//
// All entry points are no-ops when muted or before the first user gesture
// (browsers refuse to start an AudioContext without one).

const MUTE_KEY = 'eco-memory:muted';

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== 'undefined') {
  muted = window.localStorage.getItem(MUTE_KEY) === '1';
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, duration, type = 'sine', gain = 0.08, delay = 0 }: ToneOpts) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const audio = {
  isMuted(): boolean {
    return muted;
  },
  setMuted(next: boolean) {
    muted = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    }
  },
  toggleMuted(): boolean {
    audio.setMuted(!muted);
    return muted;
  },
  /** Soft tick on flip. */
  flip() {
    tone({ freq: 660, duration: 0.08, type: 'triangle', gain: 0.05 });
  },
  /** Low thud on a missed pair. */
  miss() {
    tone({ freq: 220, duration: 0.18, type: 'sine', gain: 0.06 });
  },
  /** Two-note rising chime on a successful match. */
  match() {
    tone({ freq: 740, duration: 0.16, type: 'triangle', gain: 0.08 });
    tone({ freq: 988, duration: 0.22, type: 'triangle', gain: 0.08, delay: 0.09 });
  },
  /** Three-note fanfare when the last pair lands. */
  win() {
    tone({ freq: 660, duration: 0.16, type: 'triangle', gain: 0.09 });
    tone({ freq: 880, duration: 0.16, type: 'triangle', gain: 0.09, delay: 0.12 });
    tone({ freq: 1175, duration: 0.32, type: 'triangle', gain: 0.1, delay: 0.24 });
  },
};
