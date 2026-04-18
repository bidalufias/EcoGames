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

/** Unique behavior each gas exhibits during gameplay */
export type GasBehavior = 'none' | 'split_on_miss' | 'fog_on_miss' | 'heavy' | 'blink';

export interface GreenhouseGas {
  id: string;
  name: string;
  formula: string;
  emoji: string;
  color: string;
  source: string;
  fact: string;
  points: number;
  behavior: GasBehavior;
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
  behavior?: GasBehavior;
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
  /** For blink behavior — toggles visibility */
  visible?: boolean;
  /** Blink timer (counts down, toggles at 0) */
  blinkTimer?: number;
  /** Gravity multiplier for heavy gases */
  gravityMult?: number;
}

/** A visual half that flies away when an object is sliced */
export interface SlicedHalf {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  /** Which side — -1 = left, 1 = right */
  side: number;
  color: string;
  size: number;
}

/** Fog cloud left by CH₄ when missed */
export interface FogPatch {
  id: number;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  maxRadius: number;
}

/** Wave definition for structured gameplay */
export interface WaveConfig {
  name: string;
  /** Duration in frames (at 60fps) */
  duration: number;
  /** Spawn interval override (overrides default difficulty) */
  spawnInterval: number;
  /** GHG IDs to focus on (empty = all) */
  focusGases?: string[];
  /** Multiplier on spawn count */
  spawnMult: number;
  /** Clean tech chance override */
  cleantechChance: number;
  /** Powerup chance override */
  powerupChance: number;
  /** Announced at wave start */
  announcement: string;
  /** Emoji for announcement */
  announcementEmoji: string;
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
  /** Font size override for criticals */
  fontSize?: number;
  /** Scale bounce animation progress (1 = full, decays to 0) */
  bounce?: number;
}

export interface FactPopup {
  text: string;
  alpha: number;
}

export interface ActivePowerup {
  type: PowerupType;
  expiresAt: number;
}

export interface GameStats {
  /** How many of each gas type were sliced */
  gasSliced: Record<string, number>;
  /** How many of each gas type were missed */
  gasMissed: Record<string, number>;
  /** Total critical hits */
  criticalHits: number;
  /** Total slices attempted */
  totalSlices: number;
  /** Total clean tech items caught (landed safely) */
  cleanTechCaught: number;
  /** Total clean tech items slashed */
  cleanTechSlashed: number;
  /** Highest wave reached */
  waveReached: number;
  /** Total time played (in frames) */
  timePlayed: number;
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
  stats: GameStats;
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
