// Eco Memory — Concentration card game matching GHGs to their sources
export interface Card {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
  color: string;
  fact: string;
  flipped: boolean;
  matched: boolean;
}

export const GHG_PAIRS = [
  { emoji: '⬛', label: 'CO₂', source: '🏭 Fossil Fuels', color: '#555', fact: 'CO₂ makes up 76% of all GHG emissions' },
  { emoji: '🐄', label: 'CH₄', source: '🌾 Agriculture', color: '#8B4513', fact: 'Methane is 80x more potent than CO₂' },
  { emoji: '🧪', label: 'N₂O', source: '🧬 Fertilizers', color: '#9B59B6', fact: 'N₂O has 265x the warming potential of CO₂' },
  { emoji: '❄️', label: 'HFCs', source: '🧊 Refrigerants', color: '#3498DB', fact: 'Some HFCs are thousands of times more potent than CO₂' },
  { emoji: '💻', label: 'PFCs', source: '🔧 Electronics', color: '#2C3E50', fact: 'PFCs can last 50,000 years in the atmosphere' },
  { emoji: '⚡', label: 'SF₆', source: '🔌 Power Grid', color: '#F39C12', fact: 'SF₆ is 23,500x more warming than CO₂' },
  { emoji: '🖥️', label: 'NF₃', source: '📺 Displays', color: '#1ABC9C', fact: 'NF₃ is used in making your screens' },
  { emoji: '🌍', label: 'Net Zero', source: '🌱 All Solutions', color: '#0D9B4A', fact: 'We need to reach Net Zero by 2050' },
];

export function createCards(): Card[] {
  let id = 0;
  const cards: Card[] = [];
  for (let i = 0; i < GHG_PAIRS.length; i++) {
    const pair = GHG_PAIRS[i];
    cards.push({ id: id++, pairId: i, emoji: pair.emoji, label: pair.label, color: pair.color, fact: pair.fact, flipped: false, matched: false });
    cards.push({ id: id++, pairId: i, emoji: pair.source, label: pair.source, color: pair.color, fact: pair.fact, flipped: false, matched: false });
  }
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
