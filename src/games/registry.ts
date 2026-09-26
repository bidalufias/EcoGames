import type { CategoryId, GameDefinition } from '../core/types';
import type { IconName } from '../ui/icons';

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconName;
  /** Accent used for the category's icon in navigation. */
  accent: GameDefinition['accent'];
}

export const CATEGORIES: readonly Category[] = [
  { id: 'arcade', label: 'Arcade', icon: 'gamepad', accent: 'coral' },
  { id: 'puzzle', label: 'Puzzle & memory', icon: 'puzzle', accent: 'sky' },
  { id: 'quiz', label: 'Quiz & trivia', icon: 'brain', accent: 'berry' },
];

// The list of games shown on the hub. Each game's code is lazy-loaded when it
// is opened, so adding a game here doesn't slow down the home page.
// To add a game, follow .claude/skills/add-game/SKILL.md.
export const GAMES: readonly GameDefinition[] = [
  {
    id: 'waste-sorter',
    title: 'Waste Sorter',
    tagline: 'Sort Malaysian household rubbish into the right bin before it lands.',
    category: 'arcade',
    icon: 'recycle',
    image: 'recycle',
    art: ['tin', 'banana', 'battery'],
    accent: 'sky',
    minutes: '2–4 min',
    howTo: [
      'Drag each item into the right bin, or tap a bin to send the lowest item there.',
      'Keys 1–4 work too.',
      'Three mistakes and the round ends. Sort several in a row for bonus points!',
    ],
    howToMobile: [
      'Tap a bin to send the lowest item into it. You can drag items too.',
      'Three mistakes and the round ends. Sort several in a row for bonus points!',
    ],
    load: () => import('./sorter'),
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    tagline: 'Flip cards and match pairs of climate words.',
    category: 'puzzle',
    icon: 'puzzle',
    image: 'puzzle',
    art: ['sun', 'tree', 'tiger'],
    accent: 'leaf',
    minutes: '3–6 min',
    howTo: [
      'Flip two cards at a time and find the matching picture and word.',
      'Each match shows what the word means.',
      'Play alone for a high score, or take turns with a friend.',
    ],
    load: () => import('./memory'),
  },
  {
    id: 'eco-quiz',
    title: 'Eco Quiz',
    tagline: 'Quick questions on climate, nature and green living in Malaysia.',
    category: 'quiz',
    icon: 'brain',
    image: 'brain',
    art: ['globe', 'lightbulb', 'turtle'],
    accent: 'berry',
    minutes: '3–5 min',
    howTo: [
      'Pick a topic, or mix them all, then answer up to ten questions.',
      'You’ll see a short explanation after every answer.',
      'Answer several in a row correctly for streak bonus points.',
    ],
    load: () => import('./quiz'),
  },
  {
    id: 'river-rescue',
    title: 'River Rescue',
    tagline: 'Paddle down Sungai Klang and scoop up rubbish before it reaches the sea.',
    category: 'arcade',
    icon: 'waves',
    image: 'canoe',
    art: ['plastic-bottle', 'fish', 'otter'],
    accent: 'sky',
    minutes: '1–2 min',
    howTo: [
      'Steer the boat with the arrow keys or your mouse, and scoop up floating rubbish.',
      'Steer around the river animals. Bumping them costs a life.',
      'Rubbish you miss flows out to sea. Catch several in a row for bonus points!',
    ],
    howToMobile: [
      'Drag anywhere to steer the boat, and scoop up floating rubbish.',
      'Steer around the river animals. Bumping them costs a life.',
      'Rubbish you miss flows out to sea. Catch several in a row for bonus points!',
    ],
    load: () => import('./river-rescue'),
  },
  {
    id: 'switch-off',
    title: 'Switch Off!',
    tagline: 'Follow the family around a Malaysian home and switch off what they leave on.',
    category: 'arcade',
    icon: 'power',
    image: 'lightbulb',
    art: ['television', 'snowflake', 'superhero'],
    accent: 'coral',
    minutes: '2 min',
    howTo: [
      'The family walks around the house switching things on, and leaves them on.',
      'Walk with the arrow keys or click where to go. Walk up to things left on in empty rooms and press Space, or click them.',
      'Keep the electricity bill low until the end of the day. Don’t switch off what someone is using!',
    ],
    howToMobile: [
      'The family walks around the house switching things on, and leaves them on.',
      'Tap where to walk. Tap things left on in empty rooms to go and switch them off.',
      'Keep the electricity bill low until the end of the day. Don’t switch off what someone is using!',
    ],
    load: () => import('./switch-off'),
  },
  {
    id: 'solar-link',
    title: 'Solar Link',
    tagline: 'Turn the cables to carry solar power to every home.',
    category: 'puzzle',
    icon: 'sun',
    image: 'sun',
    art: ['house', 'high-voltage', 'houses'],
    accent: 'sun',
    minutes: '2–5 min',
    howTo: [
      'Tap a tile to turn it and link the cables.',
      'Connect every home to the solar farm to light it up.',
      'Use as few turns as you can for more stars.',
    ],
    load: () => import('./solar-link'),
  },
];

export function findGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/** Case-insensitive search over game titles, taglines and categories. */
export function searchGames(query: string): GameDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...GAMES];
  return GAMES.filter((g) =>
    [g.title, g.tagline, findCategory(g.category)?.label ?? ''].some((t) =>
      t.toLowerCase().includes(q),
    ),
  );
}

/** A different featured game each day. */
export function gameOfTheDay(date = new Date()): GameDefinition {
  const day = Math.floor(date.getTime() / 86_400_000);
  return GAMES[day % GAMES.length] as GameDefinition;
}
