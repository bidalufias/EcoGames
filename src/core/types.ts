import type { IconName } from '../ui/icons';

/** Everything a game needs from the app shell while it is running. */
export interface GameContext {
  /** Play a named sound effect (respects the user's mute setting). */
  sound: (name: SoundName) => void;
  /** Announce a message to screen-reader users. */
  announce: (message: string) => void;
  /** Read the saved best result for this game (null if never played). */
  getBest: () => number | null;
  /** Save a score; returns true if it is a new best. Higher is better. */
  submitScore: (score: number) => boolean;
  /** Show the shared end-of-game dialog. */
  showResult: (result: GameResult) => void;
  /** Navigate back to the game hub. */
  exit: () => void;
}

export interface GameResult {
  title: string;
  /** Headline number, e.g. points. */
  score: number;
  /** 0–3 stars. */
  stars: number;
  isBest: boolean;
  /** Short stat lines, e.g. "Moves: 14". */
  stats: string[];
  /** Key ideas the player met this round, shown as a recap. */
  learned: { term: string; detail: string }[];
  onReplay: () => void;
}

/** A mounted game. Returned from `mount` so the shell can tear it down on navigation. */
export interface GameInstance {
  destroy: () => void;
}

export interface GameModule {
  mount: (host: HTMLElement, ctx: GameContext) => GameInstance;
}

/** Static metadata used by the hub; the game code itself is lazy-loaded via `load`. */
export interface GameDefinition {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: IconName;
  /** CSS colour token name used for the card accent, e.g. "leaf". */
  accent: 'leaf' | 'sky' | 'sun' | 'coral' | 'berry';
  minutes: string;
  topics: string[];
  /** Label for the saved best score on the hub card, e.g. "Best score". */
  bestLabel: string;
  load: () => Promise<GameModule>;
}

export type SoundName = 'tap' | 'flip' | 'good' | 'bad' | 'win' | 'drop';
