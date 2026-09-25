import type { IconName } from '../ui/icons';
import type { ImageName } from '../ui/images';

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
  image: ImageName;
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
    image: 'newspaper',
    bin: 'recycle',
    tip: 'Clean paper is recycled into new paper. Paper goes in the blue recycling bin.',
  },
  {
    id: 'cardboard',
    name: 'Parcel box',
    image: 'parcel',
    bin: 'recycle',
    tip: 'Flatten boxes from online orders and put them out with the recycling.',
  },
  {
    id: 'tin',
    name: 'Food tin',
    image: 'tin',
    bin: 'recycle',
    tip: 'Metal tins can be recycled again and again. Rinse them for the orange bin.',
  },
  {
    id: 'glass-jar',
    name: 'Kaya jar',
    image: 'jar',
    bin: 'recycle',
    tip: 'Rinse glass jars and bottles. Glass goes in the brown recycling bin.',
  },
  {
    id: 'plastic-bottle',
    name: 'Shampoo bottle',
    image: 'plastic-bottle',
    bin: 'recycle',
    tip: 'Empty and rinse plastic bottles, then recycle them in the orange bin.',
  },
  {
    id: 'envelope',
    name: 'Envelope',
    image: 'envelope',
    bin: 'recycle',
    tip: 'Paper envelopes go with the paper recycling.',
  },
  {
    id: 'scrap-paper',
    name: 'Scrap paper',
    image: 'paper',
    bin: 'recycle',
    tip: 'Used school paper can be recycled. Write on both sides first!',
  },
  // Food & garden: not collected separately everywhere, but composting keeps it out
  // of landfill, where rotting food makes methane.
  {
    id: 'banana-peel',
    name: 'Banana peel',
    image: 'banana',
    bin: 'compost',
    tip: 'Peels rot down quickly in a compost bin.',
  },
  {
    id: 'mango-peel',
    name: 'Mango peel',
    image: 'mango',
    bin: 'compost',
    tip: 'Fruit peel and seeds are food waste that can be composted.',
  },
  {
    id: 'leftover-rice',
    name: 'Leftover rice',
    image: 'rice',
    bin: 'compost',
    tip: 'Food scraps can become compost instead of rotting in a landfill.',
  },
  {
    id: 'coconut',
    name: 'Coconut shell',
    image: 'coconut',
    bin: 'compost',
    tip: 'Coconut shells and husks are plant material. They can be composted or used in gardens.',
  },
  {
    id: 'coffee-grounds',
    name: 'Used coffee grounds',
    image: 'coffee',
    bin: 'compost',
    tip: 'Coffee grounds and used tea leaves are great for compost.',
  },
  {
    id: 'eggshells',
    name: 'Eggshells',
    image: 'egg',
    bin: 'compost',
    tip: 'Eggshells add minerals to compost.',
  },
  {
    id: 'veg-peelings',
    name: 'Vegetable peelings',
    image: 'carrot',
    bin: 'compost',
    tip: 'Vegetable peelings belong with food waste.',
  },
  {
    id: 'fallen-leaves',
    name: 'Fallen leaves',
    image: 'fallen-leaves',
    bin: 'compost',
    tip: 'Garden waste like leaves makes great compost.',
  },
  // General waste (sisa baki): things that can't be recycled or composted.
  {
    id: 'polystyrene',
    name: 'Polystyrene takeaway box',
    image: 'takeaway-box',
    bin: 'general',
    tip: 'Polystyrene is rarely recycled. Bring your own container when you tapau!',
  },
  {
    id: 'sweet-wrapper',
    name: 'Sweet wrapper',
    image: 'candy',
    bin: 'general',
    tip: 'Shiny wrappers are made of mixed layers that are hard to recycle.',
  },
  {
    id: 'toothbrush',
    name: 'Old toothbrush',
    image: 'toothbrush',
    bin: 'general',
    tip: 'Mixed plastic and bristles are hard to recycle, so it is general waste.',
  },
  {
    id: 'tissue',
    name: 'Used tissue',
    image: 'tissue',
    bin: 'general',
    tip: 'Used tissues are dirty paper, so they go in general waste, not recycling.',
  },
  {
    id: 'plaster',
    name: 'Used plaster',
    image: 'plaster',
    bin: 'general',
    tip: 'Used plasters and dressings go in general waste.',
  },
  {
    id: 'cigarette',
    name: 'Cigarette butt',
    image: 'cigarette',
    bin: 'general',
    tip: 'Cigarette filters contain plastic: bin them, never drop them.',
  },
  // E-waste and hazardous waste: never in the normal bin.
  {
    id: 'battery',
    name: 'Used battery',
    image: 'battery',
    bin: 'dropoff',
    tip: 'Batteries are hazardous. Take them to an e-waste collection point.',
  },
  {
    id: 'power-bank',
    name: 'Old power bank',
    image: 'low-battery',
    bin: 'dropoff',
    tip: 'Power banks hold lithium batteries that can start fires. They are e-waste.',
  },
  {
    id: 'phone',
    name: 'Old phone',
    image: 'phone',
    bin: 'dropoff',
    tip: 'Phones contain valuable metals: take them to an e-waste collection point.',
  },
  {
    id: 'laptop',
    name: 'Broken laptop',
    image: 'laptop',
    bin: 'dropoff',
    tip: 'Computers are e-waste. Their metals and plastics can be recovered safely.',
  },
  {
    id: 'bulb',
    name: 'Old light bulb',
    image: 'lightbulb',
    bin: 'dropoff',
    tip: 'Some bulbs, like fluorescent ones, contain mercury, so they need an e-waste drop-off.',
  },
  {
    id: 'cable',
    name: 'Charger and plug',
    image: 'plug',
    bin: 'dropoff',
    tip: 'Cables and chargers are e-waste: take them to a drop-off point.',
  },
  {
    id: 'paint',
    name: 'Leftover paint',
    image: 'bucket',
    bin: 'dropoff',
    tip: 'Leftover paint is hazardous. Ask your council where to take it.',
  },
  {
    id: 'medicine',
    name: 'Old medicine',
    image: 'pill',
    bin: 'dropoff',
    tip: 'Return unused medicine to a clinic or pharmacy for safe disposal.',
  },
];
