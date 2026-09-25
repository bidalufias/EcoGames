// Browser storage can be missing or throw (private mode, blocked cookies), so
// every access is wrapped and the app always works without it.

const PREFIX = 'ecogames:';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable: settings simply won't persist.
  }
}

type BestScores = Record<string, number>;

export function getBest(gameId: string): number | null {
  const scores = readJSON<BestScores>('best', {});
  const value = scores[gameId];
  return typeof value === 'number' ? value : null;
}

/** Saves the score if it beats the previous best. Returns true when it is a new best. */
export function submitScore(gameId: string, score: number): boolean {
  const scores = readJSON<BestScores>('best', {});
  const previous = scores[gameId];
  if (typeof previous === 'number' && previous >= score) return false;
  scores[gameId] = score;
  writeJSON('best', scores);
  return true;
}

const MAX_RECENT = 6;

/** Remembers that a game was opened, most recent first. */
export function recordPlay(gameId: string): void {
  const recent = recentGames().filter((id) => id !== gameId);
  writeJSON('recent', [gameId, ...recent].slice(0, MAX_RECENT));
}

export function recentGames(): string[] {
  const value = readJSON<unknown>('recent', []);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}
