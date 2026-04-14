import type { PlayerState, PowerupType, GameObject } from './types';
import { MAX_LIVES } from './data';

export function applyPowerup(
  state: PlayerState,
  powerupType: PowerupType,
  objects?: GameObject[],
): void {
  switch (powerupType) {
    case 'extralife':
      state.lives = Math.min(state.lives + 1, MAX_LIVES);
      break;
    case 'slowmo':
      state.activePowerups = state.activePowerups.filter(p => p.type !== 'slowmo');
      state.activePowerups.push({ type: 'slowmo', expiresAt: 420 });
      break;
    case 'doublepoints':
      state.activePowerups = state.activePowerups.filter(p => p.type !== 'doublepoints');
      state.activePowerups.push({ type: 'doublepoints', expiresAt: 600 });
      break;
    case 'shield':
      state.shieldActive = true;
      break;
    case 'cleansweep':
      if (objects) {
        for (const obj of objects) {
          if (!obj.sliced && !obj.offScreen && obj.def.kind === 'ghg') {
            obj.sliced = true;
          }
        }
      }
      break;
  }
}

export function tickPowerups(state: PlayerState): void {
  for (const p of state.activePowerups) {
    p.expiresAt -= 1;
  }
  state.activePowerups = state.activePowerups.filter(p => p.expiresAt > 0);

  // Shield is always active until explicitly consumed (by a miss)
  // It's not timer-based — cleared in GameEngine when a miss occurs
}

export function hasPowerup(state: PlayerState, type: PowerupType): boolean {
  return state.activePowerups.some(p => p.type === type);
}

export function getRemainingFrames(state: PlayerState, type: PowerupType): number {
  const p = state.activePowerups.find(p => p.type === type);
  return p ? p.expiresAt : 0;
}
