import type { IconName } from '../ui/icons';

export type BinId = 'recycle' | 'compost' | 'general' | 'dropoff';

export interface Bin {
  id: BinId;
  label: string;
  /** Hex colour used by the game renderer. */
  color: number;
  icon: IconName;
  /** Keyboard shortcut shown on the bin. */
  key: string;
}

export interface WasteItem {
  id: string;
  name: string;
  icon: IconName;
  bin: BinId;
  /** Shown when the player gets it wrong: why it belongs in its bin. */
  tip: string;
}

export const BINS: readonly Bin[] = [
  { id: 'recycle', label: 'Recycling', color: 0x2f7fd8, icon: 'recycle', key: '1' },
  { id: 'compost', label: 'Food & garden', color: 0x3a9d5d, icon: 'sprout', key: '2' },
  { id: 'general', label: 'General waste', color: 0x6b7280, icon: 'trash', key: '3' },
  { id: 'dropoff', label: 'Special drop-off', color: 0xe07a2f, icon: 'battery', key: '4' },
];

// Items are chosen to be unambiguous in most places. Local rules vary, and
// the game says so. See docs/CONTENT.md before adding items.
export const WASTE_ITEMS: readonly WasteItem[] = [
  {
    id: 'newspaper',
    name: 'Newspaper',
    icon: 'newspaper',
    bin: 'recycle',
    tip: 'Clean paper is recycled into new paper.',
  },
  {
    id: 'cardboard',
    name: 'Cardboard box',
    icon: 'package',
    bin: 'recycle',
    tip: 'Flatten boxes and recycle them.',
  },
  {
    id: 'can',
    name: 'Drink can',
    icon: 'can',
    bin: 'recycle',
    tip: 'Aluminium cans can be recycled again and again.',
  },
  {
    id: 'glass-bottle',
    name: 'Glass bottle',
    icon: 'bottle',
    bin: 'recycle',
    tip: 'Rinsed glass bottles are melted down into new glass.',
  },
  {
    id: 'milk-bottle',
    name: 'Plastic milk bottle',
    icon: 'milk',
    bin: 'recycle',
    tip: 'Rinse plastic bottles and recycle them.',
  },
  {
    id: 'envelope',
    name: 'Envelope',
    icon: 'mail',
    bin: 'recycle',
    tip: 'Paper envelopes go in the paper recycling.',
  },
  {
    id: 'paper-bag',
    name: 'Paper bag',
    icon: 'paperBag',
    bin: 'recycle',
    tip: 'Clean paper bags can be recycled, or reused first!',
  },
  {
    id: 'apple-core',
    name: 'Apple core',
    icon: 'apple',
    bin: 'compost',
    tip: 'Food scraps can be composted into healthy soil.',
  },
  {
    id: 'banana-peel',
    name: 'Banana peel',
    icon: 'banana',
    bin: 'compost',
    tip: 'Peels rot down quickly in compost.',
  },
  {
    id: 'eggshells',
    name: 'Eggshells',
    icon: 'egg',
    bin: 'compost',
    tip: 'Eggshells add minerals to compost.',
  },
  {
    id: 'leaves',
    name: 'Fallen leaves',
    icon: 'leaf',
    bin: 'compost',
    tip: 'Garden waste like leaves makes great compost.',
  },
  {
    id: 'carrot-tops',
    name: 'Vegetable peelings',
    icon: 'carrot',
    bin: 'compost',
    tip: 'Veg peelings belong with food waste.',
  },
  {
    id: 'salad',
    name: 'Leftover salad',
    icon: 'salad',
    bin: 'compost',
    tip: 'Uneaten food should go to food waste, not landfill.',
  },
  {
    id: 'toothbrush',
    name: 'Old toothbrush',
    icon: 'toothbrush',
    bin: 'general',
    tip: 'Mixed plastic and bristles are hard to recycle, so it is general waste.',
  },
  {
    id: 'sweet-wrapper',
    name: 'Sweet wrapper',
    icon: 'candy',
    bin: 'general',
    tip: 'Most crinkly wrappers cannot be recycled at home.',
  },
  {
    id: 'plaster',
    name: 'Used plaster',
    icon: 'bandage',
    bin: 'general',
    tip: 'Used plasters and dressings go in general waste.',
  },
  {
    id: 'cigarette',
    name: 'Cigarette butt',
    icon: 'cigarette',
    bin: 'general',
    tip: 'Cigarette filters contain plastic: bin them, never drop them.',
  },
  {
    id: 'battery',
    name: 'Battery',
    icon: 'battery',
    bin: 'dropoff',
    tip: 'Batteries can cause fires in bin lorries: take them to a battery drop-off.',
  },
  {
    id: 'phone',
    name: 'Old phone',
    icon: 'smartphone',
    bin: 'dropoff',
    tip: 'Phones contain valuable metals: take them to an e-waste drop-off.',
  },
  {
    id: 'bulb',
    name: 'Light bulb',
    icon: 'lightbulb',
    bin: 'dropoff',
    tip: 'Many bulbs need special recycling at a drop-off point.',
  },
  {
    id: 'paint',
    name: 'Paint tin',
    icon: 'paint',
    bin: 'dropoff',
    tip: 'Leftover paint is hazardous and needs a special drop-off.',
  },
  {
    id: 'medicine',
    name: 'Old medicine',
    icon: 'pill',
    bin: 'dropoff',
    tip: 'Return unused medicine to a pharmacy.',
  },
  {
    id: 'cable',
    name: 'Charger cable',
    icon: 'cable',
    bin: 'dropoff',
    tip: 'Cables and chargers are e-waste: take them to a drop-off.',
  },
];
