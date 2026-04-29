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
  { emoji: '⬛', label: 'CO₂',      sourceEmoji: '🏭', source: 'Fossil Fuels',  color: '#555',     fact: 'CO₂ makes up 76% of all GHG emissions.' },
  { emoji: '🐄', label: 'CH₄',      sourceEmoji: '🌾', source: 'Agriculture',   color: '#8B4513', fact: 'Methane is 80× more potent than CO₂ over 20 years.' },
  { emoji: '🧪', label: 'N₂O',      sourceEmoji: '🧬', source: 'Fertilizers',   color: '#9B59B6', fact: 'N₂O has 265× the warming potential of CO₂.' },
  { emoji: '❄️', label: 'HFCs',     sourceEmoji: '🧊', source: 'Refrigerants',  color: '#3498DB', fact: 'Some HFCs are thousands of times more potent than CO₂.' },
  { emoji: '💻', label: 'PFCs',     sourceEmoji: '🔧', source: 'Electronics',   color: '#2C3E50', fact: 'PFCs can last 50,000 years in the atmosphere.' },
  { emoji: '⚡', label: 'SF₆',      sourceEmoji: '🔌', source: 'Power Grid',    color: '#F39C12', fact: 'SF₆ is 23,500× more warming than CO₂.' },
  { emoji: '🖥️', label: 'NF₃',     sourceEmoji: '📺', source: 'Displays',      color: '#1ABC9C', fact: 'NF₃ is used in making the screens you read this on.' },
  { emoji: '🌍', label: 'Net Zero', sourceEmoji: '🌱', source: 'All Solutions', color: '#0D9B4A', fact: 'We need to reach Net Zero by 2050 to limit warming.' },
];
