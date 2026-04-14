export type GameScreen =
  | 'intro'
  | 'modeselect'
  | 'nameentry'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'leaderboard';

export type GameMode = '1p' | '2p' | '4p' | 'champion';

export type ObjectKind = 'ghg' | 'cleantech' | 'powerup';

export type PowerupType =
  | 'extralife'
  | 'slowmo'
  | 'doublepoints'
  | 'shield'
  | 'cleansweep';

export interface GreenhouseGas {
  id: string;
  name: string;
  formula: string;
  emoji: string;
  color: string;
  source: string;
  fact: string;
  points: number;
}

export interface CleanTechItem {
  id: string;
  name: string;
  emoji: string;
  fact: string;
}

export interface GameObjectDef {
  id: string;
  emoji: string;
  label: string;
  kind: ObjectKind;
  color: string;
  splatColor: string;
  size: number;
  points: number;
  powerupType?: PowerupType;
  formula?: string;
  fact?: string;
}

export interface GameObject {
  instanceId: number;
  def: GameObjectDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  offScreen: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  radius: number;
  life: number;
  maxLife: number;
  emoji?: string;
}

export interface BladePoint {
  x: number;
  y: number;
  time: number;
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
  color: string;
}

export interface FactPopup {
  text: string;
  alpha: number;
}

export interface ActivePowerup {
  type: PowerupType;
  expiresAt: number;
}

export interface PlayerState {
  id: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  itemsSliced: number;
  isAlive: boolean;
  activePowerups: ActivePowerup[];
  streak: number;
  shieldActive: boolean;
}

export interface ZoneConfig {
  playerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  spawnEdge?: 'bottom' | 'top' | 'left' | 'right';
}

export interface FrenzyState {
  active: boolean;
  endsAt: number;
}

export type PlayerResults = {
  playerId: number;
  playerName: string;
  score: number;
  itemsSliced: number;
  maxCombo: number;
  streak: number;
  isWinner: boolean;
};
