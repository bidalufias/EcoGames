import type { ImageName } from '../ui/images';

export interface BeachThing {
  id: string;
  name: string;
  image: ImageName;
  /** One short sentence, shown the first time the player meets it and in the results. */
  fact: string;
}

export interface TurtleFact {
  id: string;
  term: string;
  detail: string;
}

// Turtle Trek: sea turtle hatchlings crawling from their nest to the sea on a Malaysian
// beach at night. See docs/CONTENT.md for the rules.

/** Rubbish washed up on the beach. It blocks the hatchlings' way. */
export const BEACH_RUBBISH: readonly BeachThing[] = [
  {
    id: 'bottle',
    name: 'Plastic bottle',
    image: 'plastic-bottle',
    fact: 'Rubbish on the sand blocks hatchlings on their way to the sea.',
  },
  {
    id: 'bag',
    name: 'Plastic bag',
    image: 'shopping-bags',
    fact: 'In the sea, plastic bags look like jellyfish, which turtles eat.',
  },
  {
    id: 'tin',
    name: 'Tin can',
    image: 'tin',
    fact: 'Beach clean-ups clear the way for hatchlings and keep rubbish out of the sea.',
  },
  {
    id: 'box',
    name: 'Polystyrene box',
    image: 'takeaway-box',
    fact: 'Polystyrene breaks into tiny pieces that sea animals can swallow.',
  },
];

export const GHOST_CRAB: BeachThing = {
  id: 'crab',
  name: 'Ghost crab',
  image: 'crab',
  fact: 'Ghost crabs hunt on the beach at night, and hatchlings are an easy meal.',
};

export const BEACH_LIGHT: BeachThing = {
  id: 'light',
  name: 'Beach light',
  image: 'lightbulb',
  fact: 'Bright lights on the beach lead hatchlings the wrong way. Switch them off in nesting season.',
};

/** Shown in the results after each trek, a few at a time. */
export const TURTLE_FACTS: readonly TurtleFact[] = [
  {
    id: 'find-sea',
    term: 'Finding the sea',
    detail: 'Hatchlings find the sea by crawling towards the brighter horizon over the water.',
  },
  {
    id: 'dark-beaches',
    term: 'Dark beaches',
    detail: 'Beaches where turtles nest keep lights low at night so hatchlings aren’t led astray.',
  },
  {
    id: 'malaysia-turtles',
    term: 'Malaysian turtles',
    detail:
      'Green turtles and hawksbills nest on beaches in places like Terengganu, Sabah and Melaka.',
  },
  {
    id: 'hatcheries',
    term: 'Hatcheries',
    detail: 'Turtle hatcheries keep eggs safe from poachers and predators until they hatch.',
  },
  {
    id: 'warm-sand',
    term: 'Warm sand',
    detail: 'The warmth of the sand decides whether hatchlings become males or females.',
  },
  {
    id: 'coming-home',
    term: 'Coming home',
    detail: 'Female turtles often come back to nest near the beach where they hatched.',
  },
  {
    id: 'few-survive',
    term: 'Every one counts',
    detail:
      'Only a few hatchlings grow up to be adults, so every one that reaches the sea matters.',
  },
  {
    id: 'turtle-eggs',
    term: 'Leave the eggs',
    detail: 'Buying or eating turtle eggs puts turtles at risk. Leave them for the hatcheries.',
  },
];
