// Recycle Rush — Tetris-style waste sorting game
// Sort falling waste into the correct bin before it hits the ground

export const BINS = [
  { id: 'recycle', emoji: '♻️', name: 'Recycle', color: '#4CAF50', accepts: ['plastic', 'paper', 'glass', 'metal'] },
  { id: 'compost', emoji: '🌿', name: 'Compost', color: '#8BC34A', accepts: ['food', 'garden'] },
  { id: 'landfill', emoji: '🗑️', name: 'Landfill', color: '#78909C', accepts: ['mixed', 'styrofoam', 'diaper'] },
  { id: 'hazardous', emoji: '⚠️', name: 'Hazardous', color: '#FF5722', accepts: ['battery', 'chemical', 'paint'] },
  { id: 'ewaste', emoji: '💻', name: 'E-Waste', color: '#9C27B0', accepts: ['phone', 'cable', 'circuit'] },
];

// Items are intentionally interleaved by bin: index 0 covers each bin
// once (recycle, compost, landfill, hazardous, e-waste), then index
// 5–9 adds a second item from each bin, then 10+ rounds out the pool.
// `randomWaste(level)` slices the first `types` entries, so this order
// guarantees every level has variety across all five bins.
export const WASTE_ITEMS = [
  // Round 1 — one of each bin
  { type: 'plastic',   emoji: '🥤', name: 'Plastic Bottle', bin: 'recycle',   fact: 'Only 9% of all plastic ever made has been recycled' },
  { type: 'food',      emoji: '🍌', name: 'Banana Peel',    bin: 'compost',   fact: 'Food waste in landfills produces methane — compost instead!' },
  { type: 'styrofoam', emoji: '📦', name: 'Styrofoam',      bin: 'landfill',  fact: 'Styrofoam takes 500+ years to decompose' },
  { type: 'battery',   emoji: '🔋', name: 'Battery',        bin: 'hazardous', fact: 'One battery can pollute 600,000 liters of water' },
  { type: 'phone',     emoji: '📱', name: 'Old Phone',      bin: 'ewaste',    fact: 'E-waste is the fastest growing waste stream globally' },
  // Round 2 — second of each bin
  { type: 'paper',     emoji: '📰', name: 'Newspaper',      bin: 'recycle',   fact: 'Recycling 1 ton of paper saves 17 trees' },
  { type: 'garden',    emoji: '🍂', name: 'Leaves',         bin: 'compost',   fact: 'Composting reduces landfill waste by up to 30%' },
  { type: 'mixed',     emoji: '🧸', name: 'Stuffed Toy',    bin: 'landfill',  fact: 'Most toys end up in landfill — donate or upcycle!' },
  { type: 'chemical',  emoji: '🧴', name: 'Cleaner',        bin: 'hazardous', fact: 'Household chemicals contaminate soil and groundwater' },
  { type: 'cable',     emoji: '🔌', name: 'Cable',          bin: 'ewaste',    fact: 'E-waste contains valuable metals like gold, silver, and copper' },
  // Round 3 — fills out recycle
  { type: 'glass',     emoji: '🍶', name: 'Glass Jar',      bin: 'recycle',   fact: 'Glass is 100% recyclable and can be recycled endlessly' },
  { type: 'metal',     emoji: '🥫', name: 'Tin Can',        bin: 'recycle',   fact: 'Recycling aluminum saves 95% of the energy vs making new' },
];

// Tetris-style ramp: level 1 has a single slow item at a time so new
// players can read each emoji and plan a sort. Speed, spawn rate, and
// the cap on simultaneous items all rise together.
//   speed         — base fall speed before preset / FALL_STEP
//   spawnInterval — ms between spawns (presets multiply this)
//   maxConcurrent — hard cap on falling waste items (power-ups exempt)
//   types         — how many waste types are in the random pool
export const DIFFICULTY_LEVELS = [
  { speed: 1.0, spawnInterval: 2400, maxConcurrent: 1, types: 5 },   // Level 1: one of each bin
  { speed: 1.3, spawnInterval: 1900, maxConcurrent: 2, types: 7 },   // Level 2
  { speed: 1.6, spawnInterval: 1500, maxConcurrent: 3, types: 9 },   // Level 3
  { speed: 2.0, spawnInterval: 1100, maxConcurrent: 4, types: 11 },  // Level 4
  { speed: 2.4, spawnInterval: 850,  maxConcurrent: 5, types: 12 },  // Level 5
];

export const POWER_UPS = [
  { id: 'heart', emoji: '❤️', name: 'Extra Life', desc: 'Restore one life' },
  { id: 'slowmo', emoji: '⏱️', name: 'Slow Motion', desc: 'Half speed for 5s' },
  { id: 'magnet', emoji: '🧲', name: 'Auto-Sort', desc: 'Auto-sort next 3 items' },
] as const;

export type PowerUp = typeof POWER_UPS[number];

export function randomPowerUp(): PowerUp {
  return POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
}

// speedMul scales fall speed. spawnMul scales the spawn interval (so
// values > 1 mean LONGER waits between spawns, i.e. easier).
export const SPEED_PRESETS = {
  chill:  { id: 'chill',  label: 'Chill',  emoji: '🧘', speedMul: 0.6, spawnMul: 1.4 },
  normal: { id: 'normal', label: 'Normal', emoji: '⚡', speedMul: 1.0, spawnMul: 1.0 },
  rush:   { id: 'rush',   label: 'Rush',   emoji: '🔥', speedMul: 1.4, spawnMul: 0.8 },
} as const;

export type SpeedKey = keyof typeof SPEED_PRESETS;

// Combo multiplier brackets — applied to the base 10-point sort.
export function comboMultiplier(streak: number): number {
  if (streak >= 15) return 3;
  if (streak >= 10) return 2;
  if (streak >= 5) return 1.5;
  return 1;
}

// Playfield geometry — wider cells and taller field so falling items have
// real breathing room and are easier to track / aim at the bins below.
export const PLAYFIELD_W = 5;
export const CELL_W = 90;
export const CELL_H = 54;
export const ITEM_SIZE = 60;
export const MISS_ROW = 10;            // item is "missed" at this row
export const PLAYFIELD_H_PX = MISS_ROW * CELL_H + ITEM_SIZE; // 600
export const PLAYFIELD_W_PX = PLAYFIELD_W * CELL_W;          // 450
// Bin tray height in natural pixels — bins live inside the same scaled
// container as the playfield so each bin is exactly under its lane.
export const BIN_TRAY_H = 110;
// Per-tick fall step (rows / 16ms tick) before level/preset multipliers.
// Halved from the previous build so even Rush feels manageable.
export const FALL_STEP = 0.025;

export function randomWaste(level: number) {
  const types = Math.min(DIFFICULTY_LEVELS[Math.min(level, 4)].types, WASTE_ITEMS.length);
  return WASTE_ITEMS[Math.floor(Math.random() * types)];
}
