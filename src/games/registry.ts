import type { GameDefinition } from '../core/types';

// The list of games shown on the hub. Each game's code is lazy-loaded when it
// is opened, so adding a game here doesn't slow down the home page.
// To add a game, follow .claude/skills/add-game/SKILL.md.
export const GAMES: readonly GameDefinition[] = [
  {
    id: 'waste-sorter',
    title: 'Waste Sorter',
    tagline: 'Drag the rubbish into the right bin before it hits the ground.',
    description: 'A fast sorting game about recycling, composting and special drop-offs.',
    icon: 'recycle',
    accent: 'sky',
    minutes: '2–4 min',
    topics: ['Waste', 'Recycling'],
    bestLabel: 'Best score',
    load: () => import('./sorter'),
  },
  {
    id: 'eco-memory',
    title: 'Eco Memory',
    tagline: 'Flip cards and match pairs of climate words.',
    description: 'A memory game for one or two players that builds climate vocabulary.',
    icon: 'puzzle',
    accent: 'leaf',
    minutes: '3–6 min',
    topics: ['Climate words', '1–2 players'],
    bestLabel: 'Best score',
    load: () => import('./memory'),
  },
  {
    id: 'eco-quiz',
    title: 'Eco Quiz',
    tagline: 'Ten quick questions about climate, energy and nature.',
    description: 'A multiple-choice quiz with an explanation after every answer.',
    icon: 'brain',
    accent: 'berry',
    minutes: '3–5 min',
    topics: ['Science', 'Energy', 'Nature'],
    bestLabel: 'Best score',
    load: () => import('./quiz'),
  },
];

export function findGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
