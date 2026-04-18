import type { PowerupType } from './types';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private baseBpm = 112;
  private currentBpm = 112;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    gainVal = 0.25,
    delay = 0,
    detune = 0,
  ): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.getMaster());
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  playSlash(combo = 1): void {
    const base = 500 + combo * 70;
    this.playTone(base, 'sine', 0.09, 0.2);
    this.playTone(base * 1.5, 'sine', 0.06, 0.12, 0.03);
    if (combo >= 3) {
      this.playTone(base * 2, 'sine', 0.07, 0.15, 0.06);
    }
    const ctx = this.getCtx();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();
    noise.type = 'sawtooth';
    noise.frequency.value = 180 + Math.random() * 80;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    noise.connect(gain);
    gain.connect(this.getMaster());
    noise.start();
    noise.stop(ctx.currentTime + 0.04);
  }

  /** Critical hit — bright, sharp, satisfying */
  playCritical(): void {
    // Sharp rising arpeggio
    this.playTone(880, 'sine', 0.08, 0.3);
    this.playTone(1175, 'sine', 0.06, 0.25, 0.04);
    this.playTone(1397, 'sine', 0.06, 0.2, 0.08);
    // Shimmer
    this.playTone(1760, 'triangle', 0.1, 0.15, 0.12);
    // Impact noise
    const ctx = this.getCtx();
    const noise = ctx.createOscillator();
    const gain = ctx.createGain();
    noise.type = 'sawtooth';
    noise.frequency.value = 300;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    noise.connect(gain);
    gain.connect(this.getMaster());
    noise.start();
    noise.stop(ctx.currentTime + 0.07);
  }

  /** Clean tech caught safely — gentle positive chime */
  playCatch(): void {
    this.playTone(523, 'sine', 0.12, 0.2);
    this.playTone(659, 'sine', 0.1, 0.15, 0.08);
    this.playTone(784, 'sine', 0.08, 0.12, 0.16);
  }

  /** Wave start fanfare */
  playWaveStart(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.playTone(f, 'sine', 0.15, 0.2, i * 0.08);
    });
  }

  /** Gas behavior sounds */
  playSplitMiss(): void {
    this.playTone(200, 'sawtooth', 0.15, 0.1);
    this.playTone(150, 'square', 0.12, 0.08, 0.05);
  }

  playMiss(): void {
    this.playTone(110, 'sawtooth', 0.3, 0.15);
    this.playTone(80, 'square', 0.25, 0.1, 0.05);
  }

  playProtectedHit(): void {
    this.playTone(75, 'sawtooth', 0.5, 0.3);
    this.playTone(50, 'square', 0.4, 0.25, 0.1);
    this.playTone(38, 'sawtooth', 0.3, 0.2, 0.2);
  }

  playCombo(combo: number): void {
    const notes = [494, 587, 698, 880, 1047];
    const idx = Math.min(combo - 2, notes.length - 1);
    this.playTone(notes[idx], 'triangle', 0.15, 0.25);
    this.playTone(notes[idx] * 1.25, 'sine', 0.1, 0.15, 0.05);
  }

  playPowerup(type: PowerupType): void {
    const freqs: Record<PowerupType, number[]> = {
      extralife: [494, 587, 698, 880],
      slowmo: [392, 330, 262, 196],
      doublepoints: [587, 698, 880, 1047],
      shield: [370, 440, 523, 698],
      cleansweep: [494, 587, 698, 880, 1047],
    };
    const notes = freqs[type];
    notes.forEach((f, i) => {
      this.playTone(f, 'sine', 0.13, 0.2, i * 0.07);
    });
  }

  playCarbonSpikeStart(): void {
    [494, 587, 698, 880, 1047, 1319].forEach((f, i) => {
      this.playTone(f, 'sawtooth', 0.14, 0.25, i * 0.04);
    });
  }

  playGameOver(): void {
    [392, 330, 262, 131].forEach((f, i) => {
      this.playTone(f, 'sawtooth', 0.4, 0.25, i * 0.15);
    });
  }

  setSlowMo(active: boolean): void {
    this.currentBpm = active ? Math.round(this.baseBpm * 0.6) : this.baseBpm;
    if (this.musicInterval !== null) {
      this.stopMusic();
      this.startMusic();
    }
  }

  startMusic(): void {
    if (this.musicInterval !== null) return;
    const stepMs = (60 / this.currentBpm / 4) * 1000;

    const bassPattern = [49, 0, 49, 0, 49, 0, 65, 0, 49, 0, 49, 0, 44, 0, 44, 0];
    const melodyPattern = [0, 0, 294, 0, 0, 0, 370, 0, 0, 0, 440, 0, 0, 0, 294, 0];

    this.musicStep = 0;
    this.musicInterval = setInterval(() => {
      const step = this.musicStep % 16;
      const bFreq = bassPattern[step];
      const mFreq = melodyPattern[step];

      if (bFreq > 0) this.playTone(bFreq, 'triangle', stepMs * 0.7 / 1000, 0.1);
      if (mFreq > 0) this.playTone(mFreq, 'sine', stepMs * 0.45 / 1000, 0.06);

      this.musicStep++;
    }, stepMs);
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audio = new AudioManager();
