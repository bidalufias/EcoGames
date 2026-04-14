import type { BladePoint } from './types';

const BLADE_TRAIL_DURATION = 180;
const MAX_BLADE_POINTS = 28;

export class BladeTracker {
  private points: BladePoint[] = [];
  public isActive = false;

  addPoint(x: number, y: number): void {
    const now = performance.now();
    this.points.push({ x, y, time: now });
    if (this.points.length > MAX_BLADE_POINTS) {
      this.points.shift();
    }
  }

  update(): void {
    const now = performance.now();
    this.points = this.points.filter((p) => now - p.time < BLADE_TRAIL_DURATION);
  }

  getPoints(): BladePoint[] {
    return this.points;
  }

  getActiveSlice(): Array<{ x: number; y: number }> {
    return this.points.slice(-8);
  }

  clear(): void {
    this.points = [];
  }
}
