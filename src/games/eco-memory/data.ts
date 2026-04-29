// Eco Memory — pair definitions. Each pair links a greenhouse gas to its
// real-world source so a successful match teaches a cause→effect mapping.

export interface PairDef {
  emoji: string;
  label: string;
  sourceEmoji: string;
  source: string;
  color: string;
  fact: string;
}

export const GHG_PAIRS: PairDef[] = [
  { emoji: '⬛', label: 'CO₂',          sourceEmoji: '🏭', source: 'Fossil Fuels',  color: '#555',     fact: 'CO₂ makes up 76% of all GHG emissions.' },
  { emoji: '🐄', label: 'CH₄',          sourceEmoji: '🌾', source: 'Agriculture',   color: '#8B4513', fact: 'Methane is 80× more potent than CO₂ over 20 years.' },
  { emoji: '🧪', label: 'N₂O',          sourceEmoji: '🧬', source: 'Fertilizers',   color: '#9B59B6', fact: 'N₂O has 265× the warming potential of CO₂.' },
  { emoji: '❄️', label: 'HFCs',         sourceEmoji: '🧊', source: 'Refrigerants',  color: '#3498DB', fact: 'Some HFCs are thousands of times more potent than CO₂.' },
  { emoji: '💻', label: 'PFCs',         sourceEmoji: '🔧', source: 'Electronics',   color: '#2C3E50', fact: 'PFCs can last 50,000 years in the atmosphere.' },
  { emoji: '⚡', label: 'SF₆',          sourceEmoji: '🔌', source: 'Power Grid',    color: '#F39C12', fact: 'SF₆ is 23,500× more warming than CO₂.' },
  { emoji: '🖥️', label: 'NF₃',         sourceEmoji: '📺', source: 'Displays',      color: '#1ABC9C', fact: 'NF₃ is used in making the screens you read this on.' },
  { emoji: '🌍', label: 'Net Zero',     sourceEmoji: '🌱', source: 'All Solutions', color: '#0D9B4A', fact: 'We need to reach Net Zero by 2050 to limit warming.' },
  // Hard-mode extensions — short-lived climate forcers and abundant gases.
  { emoji: '🖤', label: 'Black Carbon', sourceEmoji: '🚛', source: 'Diesel Engines', color: '#1F1F1F', fact: 'Black carbon (soot) absorbs sunlight; cutting it gives near-term climate gains.' },
  { emoji: '🧴', label: 'CFCs',         sourceEmoji: '💨', source: 'Aerosol Sprays', color: '#7F8C8D', fact: 'CFCs were banned by the Montreal Protocol in 1987 to heal the ozone layer.' },
  { emoji: '💧', label: 'H₂O Vapour',   sourceEmoji: '🌊', source: 'Evaporation',   color: '#2980B9', fact: 'Water vapour is the most abundant GHG and amplifies CO₂ warming.' },
  { emoji: '🌫️', label: 'O₃',          sourceEmoji: '🌆', source: 'Smog',          color: '#E67E22', fact: 'Ground-level ozone is a short-lived but powerful greenhouse gas.' },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyDef {
  id: Difficulty;
  label: string;
  emoji: string;
  pairCount: number;
  cols: number;
  rows: number;
  description: string;
}

// Layouts pick column counts that read well in both portrait and landscape on
// an iPad. The board itself self-caps to a square that fits the viewport, so
// these numbers only set how the cards are arranged within it.
export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🌱',
    pairCount: 4,
    cols: 4,
    rows: 2,
    description: '4 pairs · 4×2 grid',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🌿',
    pairCount: 8,
    cols: 4,
    rows: 4,
    description: '8 pairs · 4×4 grid',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🌳',
    pairCount: 12,
    cols: 6,
    rows: 4,
    description: '12 pairs · 6×4 grid',
  },
};

export function getPairsForDifficulty(difficulty: Difficulty): PairDef[] {
  return GHG_PAIRS.slice(0, DIFFICULTIES[difficulty].pairCount);
}

export function getLayoutForDifficulty(difficulty: Difficulty): { cols: number; rows: number } {
  const def = DIFFICULTIES[difficulty];
  return { cols: def.cols, rows: def.rows };
}
