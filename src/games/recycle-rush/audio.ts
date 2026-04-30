// Tiny WebAudio + haptics helper. No assets — synthesised tones only.
// All calls are best-effort and silently fail if the platform refuses
// (autoplay policies, missing AudioContext, missing vibrate API, etc.).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

function tone(freq: number, dur = 0.08, type: OscillatorType = 'sine', vol = 0.06) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch { /* ignore */ }
}

export function chord(freqs: number[], dur = 0.18, type: OscillatorType = 'triangle') {
  freqs.forEach(f => tone(f, dur, type, 0.05));
}

export function sfxCorrect()   { tone(880, 0.08, 'triangle'); setTimeout(() => tone(1320, 0.08, 'triangle'), 60); }
export function sfxWrong()     { tone(220, 0.16, 'sawtooth', 0.05); }
export function sfxLevelUp()   { chord([523, 659, 784], 0.22); }
export function sfxPowerUp()   { chord([659, 988], 0.16, 'triangle'); }
export function sfxGameOver()  { tone(440, 0.18, 'sine', 0.05); setTimeout(() => tone(294, 0.32, 'sine', 0.05), 160); }

export function haptic(pattern: number | number[]) {
  try {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    nav.vibrate?.(pattern);
  } catch { /* ignore */ }
}
