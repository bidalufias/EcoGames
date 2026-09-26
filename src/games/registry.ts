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
  {
    id: 'forest-merge',
    title: 'Grow the Forest',
    tagline: 'Merge seeds into trees, then into the wildlife of a Malaysian rainforest.',
    category: 'puzzle',
    icon: 'trees',
    image: 'tree',
    art: ['seedling', 'orangutan', 'butterfly'],
    accent: 'leaf',
    minutes: '3–8 min',
    isNew: true,
    howTo: [
      'Slide every tile with the arrow keys. Two matching tiles that meet grow into the next stage.',
      'A new seed appears after every move. Plan ahead so the board doesn’t fill up!',
      'Grow from a seed all the way to a Malayan tiger.',
    ],
    howToMobile: [
      'Swipe to slide every tile. Two matching tiles that meet grow into the next stage.',
      'A new seed appears after every move. Plan ahead so the board doesn’t fill up!',
      'Grow from a seed all the way to a Malayan tiger.',
    ],
    load: () => import('./forest-merge'),
  },
  {
    id: 'eco-word',
    title: 'Eco Word',
    tagline: 'Guess the five-letter word about nature and green living in six tries.',
    category: 'quiz',
    icon: 'wholeWord',
    image: 'letters',
    art: ['books', 'globe', 'seedling'],
    accent: 'berry',
    minutes: '3–6 min',
    isNew: true,
    howTo: [
      'Type a five-letter word and press Enter. Green letters are in the right place, yellow ones are in the word but somewhere else.',
      'You have six tries for each word, and a clue to help.',
      'Solve three words in a round. Fewer guesses score more points!',
    ],
    howToMobile: [
      'Tap the letters to make a five-letter word, then tap Enter. Green letters are in the right place, yellow ones are in the word but somewhere else.',
      'You have six tries for each word, and a clue to help.',
      'Solve three words in a round. Fewer guesses score more points!',
    ],
    load: () => import('./eco-word'),
  },
  {
    id: 'turtle-trek',
    title: 'Turtle Trek',
    tagline: 'Guide baby sea turtles down a Malaysian beach to the sea before sunrise.',
    category: 'arcade',
    icon: 'turtle',
    image: 'turtle',
    art: ['crab', 'wave', 'lightbulb'],
    accent: 'sky',
    minutes: '2 min',
    isNew: true,
    howTo: [
      'Guide each hatchling from the nest to the sea with the arrow keys, or click where to crawl.',
      'Dodge the ghost crabs and crawl around rubbish. Waves can carry you out to sea!',
      'Bright beach lights pull hatchlings the wrong way. Press Space or click a light to switch it off.',
    ],
    howToMobile: [
      'Touch and hold where you want the hatchling to crawl. Get it from the nest to the sea.',
      'Dodge the ghost crabs and crawl around rubbish. Waves can carry you out to sea!',
      'Bright beach lights pull hatchlings the wrong way. Tap a light to switch it off.',
    ],
    load: () => import('./turtle-trek'),
  },
  {
    id: 'greener-choice',
    title: 'Greener Choice',
    tagline: 'Two everyday choices: pick the one that’s kinder to the planet.',
    category: 'quiz',
    icon: 'scale',
    image: 'scales',
    art: ['bicycle', 'car', 'hamburger'],
    accent: 'leaf',
    minutes: '2–3 min',
    isNew: true,
    howTo: [
      'You’ll see two everyday choices. Pick the one that’s greener, with 1 and 2 or the arrow keys, or click it.',
      'Find out why after every answer.',
      'Pick several greener choices in a row for bonus points. Against the clock, quick answers score more!',
    ],
    howToMobile: [
      'You’ll see two everyday choices. Tap the one that’s greener.',
      'Find out why after every answer.',
      'Pick several greener choices in a row for bonus points. Against the clock, quick answers score more!',
    ],
    load: () => import('./greener-choice'),
  },
  {
    id: 'green-city',
    title: 'Green City',
    tagline: 'Plan a town where people can walk, breathe clean air and keep cool.',
    category: 'puzzle',
    icon: 'building',
    image: 'city',
    art: ['metro', 'tree', 'house'],
    accent: 'sun',
    minutes: '3–6 min',
    isNew: true,
    howTo: [
      'Each turn, pick one of two buildings and place it on the town grid.',
      'Every building scores for what is next to it: homes like parks, shops and stations, but not factories.',
      'Point at a square to see the points before you build. Fill the town for your final score!',
    ],
    howToMobile: [
      'Each turn, pick one of two buildings and place it on the town grid.',
      'Every building scores for what is next to it: homes like parks, shops and stations, but not factories.',
      'Tap a square to see the points, then tap it again to build. Fill the town for your final score!',
    ],
    load: () => import('./green-city'),
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

/**
 * Games in the order the home page features them: new games first (the carousel and
 * the grid beside it), then the rest in registry order.
 */
export function featuredGames(): GameDefinition[] {
  return [...GAMES.filter((g) => g.isNew), ...GAMES.filter((g) => !g.isNew)];
}

/** A different featured game each day. */
export function gameOfTheDay(date = new Date()): GameDefinition {
  const day = Math.floor(date.getTime() / 86_400_000);
  return GAMES[day % GAMES.length] as GameDefinition;
}
