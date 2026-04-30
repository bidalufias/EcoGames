// Recycle Rush — Tetris-style waste sorting game
// Sort falling waste into the correct bin before it hits the ground

export const BINS = [
  { id: 'recycle', emoji: '♻️', name: 'Recycle', color: '#4CAF50', accepts: ['plastic', 'paper', 'glass', 'metal'] },
  { id: 'compost', emoji: '🌿', name: 'Compost', color: '#8BC34A', accepts: ['food', 'garden'] },
  { id: 'landfill', emoji: '🗑️', name: 'Landfill', color: '#78909C', accepts: ['mixed', 'styrofoam', 'diaper'] },
  { id: 'hazardous', emoji: '⚠️', name: 'Hazardous', color: '#FF5722', accepts: ['battery', 'chemical', 'paint'] },
  { id: 'ewaste', emoji: '💻', name: 'E-Waste', color: '#9C27B0', accepts: ['phone', 'cable', 'circuit'] },
];

// Items are intentionally interleaved by bin in groups of 5 so every
// "round" of 5 covers all 5 bins. `randomWaste(level)` slices the first
// `types` entries — keeping `types` at multiples of 5 guarantees every
// level has equal coverage across bins.
export const WASTE_ITEMS = [
  // Round 1 — one of each bin
  { type: 'plastic',   emoji: '🥤', name: 'Plastic Bottle',  bin: 'recycle',   fact: 'Only 9% of all plastic ever made has been recycled' },
  { type: 'food',      emoji: '🍌', name: 'Banana Peel',     bin: 'compost',   fact: 'Food waste in landfills produces methane — compost instead!' },
  { type: 'foam-cup',  emoji: '🥡', name: 'Foam Container',  bin: 'landfill',  fact: 'Polystyrene foam takes 500+ years to decompose' },
  { type: 'battery',   emoji: '🔋', name: 'Battery',         bin: 'hazardous', fact: 'One battery can pollute 600,000 liters of water' },
  { type: 'phone',     emoji: '📱', name: 'Old Phone',       bin: 'ewaste',    fact: 'E-waste is the fastest growing waste stream globally' },
  // Round 2 — second of each bin
  { type: 'paper',     emoji: '📰', name: 'Newspaper',       bin: 'recycle',   fact: 'Recycling 1 ton of paper saves 17 trees' },
  { type: 'garden',    emoji: '🍂', name: 'Leaves',          bin: 'compost',   fact: 'Composting reduces landfill waste by up to 30%' },
  { type: 'mixed',     emoji: '🧸', name: 'Stuffed Toy',     bin: 'landfill',  fact: 'Most toys end up in landfill — donate or upcycle!' },
  { type: 'chemical',  emoji: '🧴', name: 'Cleaner',         bin: 'hazardous', fact: 'Household chemicals contaminate soil and groundwater' },
  { type: 'cable',     emoji: '🔌', name: 'Cable',           bin: 'ewaste',    fact: 'E-waste contains valuable metals like gold, silver, and copper' },
  // Round 3
  { type: 'glass',     emoji: '🍶', name: 'Glass Jar',       bin: 'recycle',   fact: 'Glass is 100% recyclable and can be recycled endlessly' },
  { type: 'apple',     emoji: '🍎', name: 'Apple Core',      bin: 'compost',   fact: 'An apple core composts in 1-2 months and feeds the soil' },
  { type: 'cigarette', emoji: '🚬', name: 'Cigarette Butt',  bin: 'landfill',  fact: 'Cigarette butts are the most-littered item — toxic in waterways' },
  { type: 'paint',     emoji: '🎨', name: 'Paint',           bin: 'hazardous', fact: 'Latex paint can dry out for landfill; oil paints need hazardous drop-off' },
  { type: 'laptop',    emoji: '💻', name: 'Old Laptop',      bin: 'ewaste',    fact: 'A laptop has 60+ recoverable elements — recycle for the materials' },
  // Round 4
  { type: 'metal',     emoji: '🥫', name: 'Tin Can',         bin: 'recycle',   fact: 'Recycling aluminum saves 95% of the energy vs making new' },
  { type: 'carrot',    emoji: '🥕', name: 'Carrot Scraps',   bin: 'compost',   fact: 'Carrot tops and peels are nitrogen-rich for compost' },
  { type: 'lipstick',  emoji: '💄', name: 'Lipstick',        bin: 'landfill',  fact: 'Most cosmetic packaging is mixed plastic — usually not recyclable' },
  { type: 'pills',     emoji: '💊', name: 'Old Medicine',    bin: 'hazardous', fact: 'Flushed medication pollutes drinking water — return to a pharmacy' },
  { type: 'monitor',   emoji: '🖥️', name: 'Monitor',         bin: 'ewaste',    fact: 'Monitors contain lead and mercury — never bin them' },
  // Round 5
  { type: 'carton',    emoji: '🥛', name: 'Milk Carton',     bin: 'recycle',   fact: 'Cartons mix paper, plastic, and aluminum — many programs accept them' },
  { type: 'eggshells', emoji: '🥚', name: 'Eggshells',       bin: 'compost',   fact: 'Crushed eggshells return calcium to the soil' },
  { type: 'bandage',   emoji: '🩹', name: 'Used Bandage',    bin: 'landfill',  fact: 'Used bandages can’t be recycled — wrap and bin them' },
  { type: 'lab',       emoji: '🧪', name: 'Lab Chemical',    bin: 'hazardous', fact: 'Lab chemicals must go to a certified hazardous waste facility' },
  { type: 'headphones',emoji: '🎧', name: 'Headphones',      bin: 'ewaste',    fact: 'Headphones mix metal, plastic, and circuitry — drop at e-waste' },
  // Round 6
  { type: 'cardboard', emoji: '📦', name: 'Cardboard Box',   bin: 'recycle',   fact: 'Cardboard fibres can be recycled up to 7 times' },
  { type: 'coffee',    emoji: '☕', name: 'Coffee Grounds',   bin: 'compost',   fact: 'Coffee grounds add nitrogen and improve compost drainage' },
  { type: 'toothbrush',emoji: '🪥', name: 'Toothbrush',      bin: 'landfill',  fact: 'Plastic toothbrushes take 400+ years to decompose' },
  { type: 'nailpolish',emoji: '💅', name: 'Nail Polish',     bin: 'hazardous', fact: 'Nail polish contains solvents that pollute waterways' },
  { type: 'mouse',     emoji: '🖱️', name: 'Computer Mouse',  bin: 'ewaste',    fact: 'Computer peripherals are 95% recyclable when properly recovered' },
  // Round 7
  { type: 'bag',       emoji: '🛍️', name: 'Plastic Bag',     bin: 'recycle',   fact: 'Plastic bags need store drop-off — they jam curbside machines' },
  { type: 'bread',     emoji: '🍞', name: 'Stale Bread',     bin: 'compost',   fact: 'Stale bread breaks down quickly — compost it, don\'t bin it' },
  { type: 'receipt',   emoji: '🧾', name: 'Receipt',         bin: 'landfill',  fact: 'Thermal receipts contain BPA and can\'t be recycled' },
  { type: 'thermo',    emoji: '🌡️', name: 'Thermometer',    bin: 'hazardous', fact: 'Old mercury thermometers need special hazmat disposal' },
  { type: 'tv',        emoji: '📺', name: 'Old TV',          bin: 'ewaste',    fact: 'Old CRT TVs contain lead — never put them in the bin' },
];

// Tetris-style ramp with smaller per-level deltas so progression feels
// fair even with a 5-sort-per-round cadence. The spawn loop also enforces
// a "halfway gate" — no new item until the previous one has cleared the
// upper half of the playfield — so spawn rate naturally tracks fall speed.
//   speed         — base fall speed before preset / FALL_STEP
//   spawnInterval — minimum ms between spawns (presets multiply this)
//   maxConcurrent — hard cap on falling waste items (power-ups exempt)
//   types         — how many waste types are in the random pool
export const DIFFICULTY_LEVELS = [
  { speed: 1.0, spawnInterval: 2200, maxConcurrent: 1, types: 5 },   // Level 1
  { speed: 1.2, spawnInterval: 1900, maxConcurrent: 2, types: 10 },  // Level 2
  { speed: 1.4, spawnInterval: 1600, maxConcurrent: 2, types: 18 },  // Level 3
  { speed: 1.7, spawnInterval: 1400, maxConcurrent: 3, types: 25 },  // Level 4
  { speed: 2.0, spawnInterval: 1200, maxConcurrent: 3, types: 30 },  // Level 5
  { speed: 2.3, spawnInterval: 1000, maxConcurrent: 4, types: 35 },  // Level 6: full pool
];

// Items per "round" — sort this many to bump up a level.
export const SORTS_PER_LEVEL = 5;

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
