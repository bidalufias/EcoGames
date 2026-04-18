import type { GreenhouseGas, CleanTechItem, GameObjectDef, PowerupType, WaveConfig } from './types';

export const GREENHOUSE_GASES: GreenhouseGas[] = [
  {
    id: 'co2', name: 'Carbon Dioxide', formula: 'CO₂', emoji: '⬛', color: '#555555',
    source: 'Fossil fuel combustion, deforestation, cement production',
    fact: 'CO₂ accounts for ~76% of all greenhouse gas emissions globally',
    points: 15,
    behavior: 'split_on_miss',
  },
  {
    id: 'ch4', name: 'Methane', formula: 'CH₄', emoji: '🐄', color: '#8B4513',
    source: 'Livestock (cattle), rice paddies, landfills, natural gas leaks',
    fact: 'CH₄ is 80x more potent than CO₂ at trapping heat over 20 years',
    points: 20,
    behavior: 'fog_on_miss',
  },
  {
    id: 'n2o', name: 'Nitrous Oxide', formula: 'N₂O', emoji: '🧪', color: '#9B59B6',
    source: 'Agricultural fertilizers, industrial processes, burning biomass',
    fact: 'N₂O has 265x the warming potential of CO₂ over 100 years',
    points: 25,
    behavior: 'none',
  },
  {
    id: 'hfcs', name: 'Hydrofluorocarbons', formula: 'HFCs', emoji: '❄️', color: '#3498DB',
    source: 'Refrigerators, air conditioning, foam blowing agents',
    fact: 'Some HFCs are thousands of times more potent than CO₂',
    points: 25,
    behavior: 'none',
  },
  {
    id: 'pfcs', name: 'Perfluorocarbons', formula: 'PFCs', emoji: '💻', color: '#2C3E50',
    source: 'Electronics manufacturing, aluminum production',
    fact: 'PFCs can remain in the atmosphere for up to 50,000 years',
    points: 30,
    behavior: 'none',
  },
  {
    id: 'sf6', name: 'Sulfur Hexafluoride', formula: 'SF₆', emoji: '⚡', color: '#F39C12',
    source: 'Electrical power grid insulation, magnesium production',
    fact: 'SF₆ is the most potent GHG — 23,500x more warming than CO₂',
    points: 35,
    behavior: 'heavy',
  },
  {
    id: 'nf3', name: 'Nitrogen Trifluoride', formula: 'NF₃', emoji: '🖥️', color: '#1ABC9C',
    source: 'LCD and LED display manufacturing, semiconductor production',
    fact: 'NF₃ is 17,200x more potent than CO₂ and used in making your screens',
    points: 40,
    behavior: 'blink',
  },
];

export const CLEAN_TECH: CleanTechItem[] = [
  { id: 'solar', name: 'Solar Panel', emoji: '☀️', fact: 'Solar energy is now the cheapest form of electricity in history' },
  { id: 'wind', name: 'Wind Turbine', emoji: '🌬️', fact: 'A single wind turbine can power 1,500 homes' },
  { id: 'bicycle', name: 'Bicycle', emoji: '🚲', fact: 'Cycling produces zero emissions and improves health' },
  { id: 'ev', name: 'Electric Vehicle', emoji: '🔋', fact: 'EVs produce 50-80% less emissions than gas cars over their lifetime' },
  { id: 'recycle', name: 'Recycling', emoji: '♻️', fact: 'Recycling one aluminum can saves enough energy to run a TV for 3 hours' },
  { id: 'water', name: 'Water Efficiency', emoji: '💧', fact: 'Efficient water use reduces the energy needed for water treatment' },
  { id: 'tree', name: 'Reforestation', emoji: '🌳', fact: 'One tree absorbs about 22 kg of CO₂ per year' },
  { id: 'compost', name: 'Composting', emoji: '🌿', fact: 'Composting food waste reduces methane emissions from landfills' },
  { id: 'green-build', name: 'Green Building', emoji: '🏠', fact: 'Green buildings use 25-35% less energy than conventional buildings' },
];

// GHG spawn weights — common gases more frequent, rare ones less frequent
const GHG_WEIGHTS: Record<string, number> = {
  co2: 30,
  ch4: 25,
  n2o: 15,
  hfcs: 12,
  pfcs: 8,
  sf6: 6,
  nf3: 4,
};

function buildWeightedGhgList(): GreenhouseGas[] {
  const list: GreenhouseGas[] = [];
  for (const gas of GREENHOUSE_GASES) {
    const w = GHG_WEIGHTS[gas.id] ?? 10;
    for (let i = 0; i < w; i++) list.push(gas);
  }
  return list;
}

const WEIGHTED_GHG_LIST = buildWeightedGhgList();

export function pickRandomGHG(): GreenhouseGas {
  return WEIGHTED_GHG_LIST[Math.floor(Math.random() * WEIGHTED_GHG_LIST.length)];
}

/** Pick a GHG focused on a specific subset (for wave system) */
export function pickFocusedGHG(focusIds: string[]): GreenhouseGas {
  if (focusIds.length === 0) return pickRandomGHG();
  const filtered = GREENHOUSE_GASES.filter(g => focusIds.includes(g.id));
  if (filtered.length === 0) return pickRandomGHG();
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function pickRandomCleanTech(): CleanTechItem {
  return CLEAN_TECH[Math.floor(Math.random() * CLEAN_TECH.length)];
}

export function gasToGameObject(gas: GreenhouseGas): GameObjectDef {
  return {
    id: gas.id,
    emoji: gas.emoji,
    label: gas.formula,
    kind: 'ghg',
    color: gas.color,
    splatColor: gas.color,
    size: 52,
    points: gas.points,
    formula: gas.formula,
    fact: gas.fact,
    behavior: gas.behavior,
  };
}

export function cleanTechToGameObject(item: CleanTechItem): GameObjectDef {
  return {
    id: item.id,
    emoji: item.emoji,
    label: item.name,
    kind: 'cleantech',
    color: '#27ae60',
    splatColor: '#2ecc71',
    size: 56,
    points: 50, // Points for catching (letting land safely)
    fact: item.fact,
  };
}

export const POWERUP_DEFS: Record<PowerupType, GameObjectDef> = {
  extralife: {
    id: 'powerup_extralife', emoji: '💚', label: 'Carbon Offset', kind: 'powerup',
    color: '#2ecc71', splatColor: '#27ae60', size: 54, points: 0, powerupType: 'extralife',
  },
  slowmo: {
    id: 'powerup_slowmo', emoji: '⏳', label: 'Carbon Tax', kind: 'powerup',
    color: '#40c4ff', splatColor: '#0288d1', size: 54, points: 0, powerupType: 'slowmo',
  },
  doublepoints: {
    id: 'powerup_doublepoints', emoji: '✨', label: 'Green Bonus', kind: 'powerup',
    color: '#FFD700', splatColor: '#FFA000', size: 54, points: 0, powerupType: 'doublepoints',
  },
  shield: {
    id: 'powerup_shield', emoji: '🛡️', label: 'Climate Shield', kind: 'powerup',
    color: '#448aff', splatColor: '#1565c0', size: 54, points: 0, powerupType: 'shield',
  },
  cleansweep: {
    id: 'powerup_cleansweep', emoji: '🌪️', label: 'Carbon Capture', kind: 'powerup',
    color: '#b2dfdb', splatColor: '#26a69a', size: 54, points: 0, powerupType: 'cleansweep',
  },
};

export const POWERUP_DURATION_MS: Record<PowerupType, number> = {
  extralife: 0,
  slowmo: 7000,
  doublepoints: 10000,
  shield: 0,
  cleansweep: 0,
};

const POWERUP_TYPES = Object.keys(POWERUP_DEFS) as PowerupType[];

export function pickRandomPowerup(): GameObjectDef {
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return POWERUP_DEFS[type];
}

export function pickRandomObject(
  score: number,
  isFrenzy = false,
  cleantechOverride?: number,
  powerupOverride?: number,
  focusGases?: string[],
): GameObjectDef {
  const rand = Math.random();

  // Powerup chance
  const powerupChance = powerupOverride ?? 0.06;
  if (!isFrenzy && rand < powerupChance) {
    return pickRandomPowerup();
  }

  // Clean tech (avoid/catch) chance
  const difficultyLevel = Math.floor(score / 50);
  const protectedChance = cleantechOverride ?? (isFrenzy ? 0 : Math.min(0.05 + difficultyLevel * 0.02, 0.18));

  if (!isFrenzy && (rand - powerupChance) < protectedChance) {
    return cleanTechToGameObject(pickRandomCleanTech());
  }

  // GHG (slash target) — use focused pick if wave has focus
  if (focusGases && focusGases.length > 0) {
    return gasToGameObject(pickFocusedGHG(focusGases));
  }
  return gasToGameObject(pickRandomGHG());
}

export function getPowerupLabel(type: PowerupType): string {
  const labels: Record<PowerupType, string> = {
    extralife: '💚 Carbon Offset (+1 Life)',
    slowmo: '⏳ Carbon Tax (Slowed!)',
    doublepoints: '✨ Green Bonus (2x Points!)',
    shield: '🛡️ Climate Shield!',
    cleansweep: '🌪️ Carbon Capture!',
  };
  return labels[type];
}

export function getPowerupColor(type: PowerupType): string {
  return POWERUP_DEFS[type].color;
}

// Difficulty progression
export const DIFFICULTY_TABLE = {
  baseSpawnInterval: 120,
  minSpawnInterval: 35,
  maxReduction: 65,
  frenzyBaseInterval: 45,
  frenzyMinInterval: 20,
  reductionPerScore: 12,
  protectedChanceBase: 0.05,
  protectedChancePerLevel: 0.02,
  protectedChanceMax: 0.18,
  powerupChance: 0.06,
};

// Critical slice — minimum blade velocity (px/frame) for critical
export const CRITICAL_VELOCITY_THRESHOLD = 18;
export const CRITICAL_BONUS_MULT = 1.5;
export const CRITICAL_FREEZE_FRAMES = 4;

// Combo milestones
export const COMBO_MILESTONES = [10, 20, 30, 50];

// Clean tech catch bonus
export const CLEAN_TECH_CATCH_POINTS = 50;

// Game constants
export const MAX_LIVES = 5;
export const COMBO_RESET_FRAMES = 30;
export const CARBON_SPIKE_DURATION_MS = 8000;
export const CARBON_SPIKE_COMBO_THRESHOLD = 5;
export const FACT_POPUP_INTERVAL = 500;

export const GAME_ID = 'climate-ninja';

// ─── Wave System ────────────────────────────────────────────────────────────

export const WAVES: WaveConfig[] = [
  {
    name: 'Carbon Dawn',
    duration: 540, // 9 seconds
    spawnInterval: 100,
    spawnMult: 1,
    cleantechChance: 0.03,
    powerupChance: 0.08,
    announcement: 'Wave 1 — Carbon Dawn',
    announcementEmoji: '🌅',
    focusGases: ['co2'],
  },
  {
    name: 'Methane Surge',
    duration: 540,
    spawnInterval: 80,
    spawnMult: 1.2,
    cleantechChance: 0.05,
    powerupChance: 0.07,
    announcement: 'Wave 2 — Methane Surge',
    announcementEmoji: '🐄',
    focusGases: ['co2', 'ch4'],
  },
  {
    name: 'Industrial Cloud',
    duration: 600,
    spawnInterval: 70,
    spawnMult: 1.3,
    cleantechChance: 0.06,
    powerupChance: 0.07,
    announcement: 'Wave 3 — Industrial Cloud',
    announcementEmoji: '🏭',
    focusGases: ['n2o', 'hfcs'],
  },
  {
    name: 'Toxic Legacy',
    duration: 600,
    spawnInterval: 65,
    spawnMult: 1.4,
    cleantechChance: 0.08,
    powerupChance: 0.06,
    announcement: 'Wave 4 — Toxic Legacy',
    announcementEmoji: '⚡',
    focusGases: ['pfcs', 'sf6'],
  },
  {
    name: 'The Invisible Threat',
    duration: 660,
    spawnInterval: 55,
    spawnMult: 1.5,
    cleantechChance: 0.08,
    powerupChance: 0.06,
    announcement: 'Wave 5 — The Invisible Threat',
    announcementEmoji: '🖥️',
    focusGases: ['nf3', 'sf6'],
  },
  {
    name: 'Greenhouse Effect',
    duration: 720,
    spawnInterval: 50,
    spawnMult: 1.6,
    cleantechChance: 0.10,
    powerupChance: 0.05,
    announcement: 'Wave 6 — Greenhouse Effect',
    announcementEmoji: '🌡️',
    // All gases
  },
  {
    name: 'Climate Crisis',
    duration: 780,
    spawnInterval: 45,
    spawnMult: 1.8,
    cleantechChance: 0.12,
    powerupChance: 0.05,
    announcement: 'Wave 7 — Climate Crisis',
    announcementEmoji: '🔥',
    // All gases, high intensity
  },
  {
    name: 'ENDLESS MODE',
    duration: Infinity,
    spawnInterval: 40,
    spawnMult: 2.0,
    cleantechChance: 0.14,
    powerupChance: 0.05,
    announcement: '∞ Endless Mode',
    announcementEmoji: '♾️',
  },
];

export function makeEmptyStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const gas of GREENHOUSE_GASES) {
    stats[gas.id] = 0;
  }
  return stats;
}
