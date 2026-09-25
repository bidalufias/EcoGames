import type { ImageName } from '../ui/images';

export type RiverItemKind = 'rubbish' | 'animal';

export interface RiverItem {
  id: string;
  name: string;
  image: ImageName;
  /** Rubbish is scooped up; animals must be steered around. */
  kind: RiverItemKind;
  /** One or two short sentences, shown in toasts and the results recap. */
  fact: string;
}

export interface RiverFact {
  id: string;
  term: string;
  detail: string;
}

// Things floating down Sungai Klang in River Rescue: rubbish from streets and drains,
// and the animals that live in and along Malaysian rivers. See docs/CONTENT.md.
export const RIVER_ITEMS: readonly RiverItem[] = [
  {
    id: 'bottle',
    name: 'Plastic bottle',
    image: 'plastic-bottle',
    kind: 'rubbish',
    fact: 'Plastic does not rot. It slowly breaks into tiny pieces that stay in rivers and the sea.',
  },
  {
    id: 'bag',
    name: 'Plastic bag',
    image: 'shopping-bags',
    kind: 'rubbish',
    fact: 'Turtles can mistake floating plastic bags for jellyfish, which they eat. Carry a reusable bag.',
  },
  {
    id: 'cup',
    name: 'Cup and straw',
    image: 'cup',
    kind: 'rubbish',
    fact: 'Skip the straw with your teh ais if you don’t need one. Small straws are easily lost to drains.',
  },
  {
    id: 'polystyrene',
    name: 'Polystyrene box',
    image: 'takeaway-box',
    kind: 'rubbish',
    fact: 'Polystyrene breaks into tiny pieces that fish can swallow. Bring your own container to tapau.',
  },
  {
    id: 'tin',
    name: 'Tin can',
    image: 'tin',
    kind: 'rubbish',
    fact: 'Metal tins can be recycled again and again. Rinse them for the orange recycling bin.',
  },
  {
    id: 'wrapper',
    name: 'Sweet wrapper',
    image: 'candy',
    kind: 'rubbish',
    fact: 'Small wrappers blow into drains easily. Keep yours in your pocket until you find a bin.',
  },
  {
    id: 'fish',
    name: 'River fish',
    image: 'fish',
    kind: 'animal',
    fact: 'Fish breathe oxygen in the water. Rotting rubbish and sewage use it up, so clean rivers keep fish alive.',
  },
  {
    id: 'otter',
    name: 'Otter',
    image: 'otter',
    kind: 'animal',
    fact: 'Smooth-coated otters live along Malaysian rivers and mangroves. They need clean water and fish.',
  },
  {
    id: 'turtle',
    name: 'Turtle',
    image: 'turtle',
    kind: 'animal',
    fact: 'Sea turtles lay eggs on Malaysian beaches. Rivers can carry rubbish onto those beaches.',
  },
  {
    id: 'duck',
    name: 'Duck',
    image: 'duck',
    kind: 'animal',
    fact: 'Ducks can get tangled in plastic rings and fishing line. Snip loops before you throw them away.',
  },
];

/** General river facts that fill the results recap. */
export const RIVER_FACTS: readonly RiverFact[] = [
  {
    id: 'drains',
    term: 'Drains to the sea',
    detail: 'Rubbish dropped in drains can flow into rivers, and rivers carry it out to the sea.',
  },
  {
    id: 'log-booms',
    term: 'River traps',
    detail:
      'Floating barriers called log booms catch rubbish on Sungai Klang before it reaches the sea.',
  },
  {
    id: 'klang',
    term: 'Sungai Klang',
    detail: 'Sungai Klang flows through Kuala Lumpur and meets the sea near Port Klang.',
  },
];
