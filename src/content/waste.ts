import type { IconName } from '../ui/icons';

export type BinId = 'recycle' | 'compost' | 'general' | 'dropoff';

export interface Bin {
  id: BinId;
  label: string;
  /** Label used on narrow phone screens. */
  shortLabel: string;
  /** The Malay name players see on bins and signs in Malaysia. */
  malay: string;
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
  {
    id: 'recycle',
    label: 'Recycling',
    shortLabel: 'Recycle',
    malay: 'Kitar semula',
    color: 0x0079c2,
    icon: 'recycle',
    key: '1',
  },
  {
    id: 'compost',
    label: 'Food & garden',
    shortLabel: 'Food',
    malay: 'Sisa makanan',
    color: 0x3a9d5d,
    icon: 'sprout',
    key: '2',
  },
  {
    id: 'general',
    label: 'General waste',
    shortLabel: 'General',
    malay: 'Sisa baki',
    color: 0x6b7280,
    icon: 'trash',
    key: '3',
  },
  {
    id: 'dropoff',
    label: 'E-waste',
    shortLabel: 'E-waste',
    malay: 'E-sisa',
    color: 0xe07a2f,
    icon: 'battery',
    key: '4',
  },
];

// Everyday rubbish from Malaysian homes, sorted the way Malaysia's separation-at-source
// scheme and recycling campaigns teach it. Rules still vary by council, and the game
// says so. See docs/CONTENT.md before adding items.
export const WASTE_ITEMS: readonly WasteItem[] = [
  // Recycling: in public recycling bins, blue is for paper, orange for plastic and
  // metal, and brown for glass.
  {
    id: 'newspaper',
    name: 'Old newspaper',
    icon: 'newspaper',
    bin: 'recycle',
    tip: 'Clean paper is recycled into new paper. Paper goes in the blue recycling bin.',
  },
  {
    id: 'cardboard',
    name: 'Parcel box',
    icon: 'package',
    bin: 'recycle',
    tip: 'Flatten boxes from online orders and put them out with the recycling.',
  },
  {
    id: 'can',
    name: 'Drink can',
    icon: 'can',
    bin: 'recycle',
    tip: 'Aluminium cans can be recycled again and again. Cans go in the orange bin.',
  },
  {
    id: 'glass-bottle',
    name: 'Kicap bottle',
    icon: 'bottle',
    bin: 'recycle',
    tip: 'Rinse glass bottles like soy sauce bottles. Glass goes in the brown recycling bin.',
  },
  {
    id: 'water-bottle',
    name: 'Mineral water bottle',
    icon: 'milk',
    bin: 'recycle',
    tip: 'Empty plastic bottles, squash them and recycle them in the orange bin.',
  },
  {
    id: 'envelope',
    name: 'Envelope',
    icon: 'mail',
    bin: 'recycle',
    tip: 'Paper envelopes go with the paper recycling.',
  },
  {
    id: 'paper-bag',
    name: 'Paper bag',
    icon: 'paperBag',
    bin: 'recycle',
    tip: 'Clean paper bags can be recycled, or reused first!',
  },
  // Food & garden: not collected separately everywhere, but composting keeps it out
  // of landfill, where rotting food makes methane.
  {
    id: 'banana-peel',
    name: 'Banana peel',
    icon: 'banana',
    bin: 'compost',
    tip: 'Peels rot down quickly in a compost bin.',
  },
  {
    id: 'durian-husk',
    name: 'Durian husk',
    icon: 'sprout',
    bin: 'compost',
    tip: 'Durian husks are plant waste. Chopped up, they can be composted.',
  },
  {
    id: 'leftover-rice',
    name: 'Leftover rice',
    icon: 'soup',
    bin: 'compost',
    tip: 'Food scraps can become compost instead of rotting in a landfill.',
  },
  {
    id: 'banana-leaf',
    name: 'Banana leaf wrap',
    icon: 'leaf',
    bin: 'compost',
    tip: 'Banana leaves from nasi lemak are plant material, so they compost well.',
  },
  {
    id: 'coffee-grounds',
    name: 'Used coffee grounds',
    icon: 'coffee',
    bin: 'compost',
    tip: 'Coffee grounds and used tea leaves are great for compost.',
  },
  {
    id: 'eggshells',
    name: 'Eggshells',
    icon: 'egg',
    bin: 'compost',
    tip: 'Eggshells add minerals to compost.',
  },
  {
    id: 'coconut-husk',
    name: 'Coconut husk',
    icon: 'nut',
    bin: 'compost',
    tip: 'Coconut husk is plant fibre. It can be composted or used in gardens.',
  },
  {
    id: 'veg-peelings',
    name: 'Vegetable peelings',
    icon: 'carrot',
    bin: 'compost',
    tip: 'Vegetable peelings belong with food waste.',
  },
  // General waste (sisa baki): things that can't be recycled or composted.
  {
    id: 'polystyrene',
    name: 'Polystyrene food box',
    icon: 'box',
    bin: 'general',
    tip: 'Polystyrene is rarely recycled. Bring your own container when you tapau!',
  },
  {
    id: 'snack-packet',
    name: 'Snack packet',
    icon: 'popcorn',
    bin: 'general',
    tip: 'Shiny snack packets are made of mixed layers that are hard to recycle.',
  },
  {
    id: 'straw',
    name: 'Plastic straw',
    icon: 'cupSoda',
    bin: 'general',
    tip: 'Straws are too small to recycle. Better still, skip the straw!',
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
    tip: 'Most crinkly wrappers cannot be recycled.',
  },
  {
    id: 'diaper',
    name: 'Used diaper',
    icon: 'baby',
    bin: 'general',
    tip: 'Used diapers go in general waste.',
  },
  {
    id: 'cigarette',
    name: 'Cigarette butt',
    icon: 'cigarette',
    bin: 'general',
    tip: 'Cigarette filters contain plastic: bin them, never drop them.',
  },
  // E-waste and hazardous waste: never in the normal bin.
  {
    id: 'battery',
    name: 'Used battery',
    icon: 'battery',
    bin: 'dropoff',
    tip: 'Batteries are hazardous. Take them to an e-waste collection point.',
  },
  {
    id: 'power-bank',
    name: 'Old power bank',
    icon: 'batteryCharging',
    bin: 'dropoff',
    tip: 'Power banks hold lithium batteries that can start fires. They are e-waste.',
  },
  {
    id: 'phone',
    name: 'Old phone',
    icon: 'smartphone',
    bin: 'dropoff',
    tip: 'Phones contain valuable metals: take them to an e-waste collection point.',
  },
  {
    id: 'bulb',
    name: 'Fluorescent bulb',
    icon: 'lightbulb',
    bin: 'dropoff',
    tip: 'Fluorescent bulbs contain mercury, so they need an e-waste drop-off.',
  },
  {
    id: 'cable',
    name: 'Charger cable',
    icon: 'cable',
    bin: 'dropoff',
    tip: 'Cables and chargers are e-waste: take them to a drop-off point.',
  },
  {
    id: 'paint',
    name: 'Paint tin',
    icon: 'paint',
    bin: 'dropoff',
    tip: 'Leftover paint is hazardous. Ask your council where to take it.',
  },
  {
    id: 'medicine',
    name: 'Old medicine',
    icon: 'pill',
    bin: 'dropoff',
    tip: 'Return unused medicine to a clinic or pharmacy for safe disposal.',
  },
];
