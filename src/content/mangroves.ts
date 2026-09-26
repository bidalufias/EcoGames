import type { ImageName } from '../ui/images';

export interface MangroveSpecies {
  id: 'api-api' | 'bakau';
  name: string;
  /** A few words on the planting button. */
  tag: string;
  /** Shown the first time it grows up, and in the results. */
  fact: string;
}

export interface MangroveFact {
  id: string;
  term: string;
  detail: string;
}

// Mangrove Guard: mangroves on a Malaysian coast take the strength out of waves
// before they reach a village. See docs/CONTENT.md for the rules.

export const MANGROVE_SPECIES: Record<MangroveSpecies['id'], MangroveSpecies> = {
  'api-api': {
    id: 'api-api',
    name: 'Api-api',
    tag: 'Cheap, grows fast',
    fact: 'Api-api trees send up pencil-like breathing roots from the mud.',
  },
  bakau: {
    id: 'bakau',
    name: 'Bakau',
    tag: 'Strong stilt roots',
    fact: 'Bakau trees stand on arching stilt roots that break up the waves.',
  },
};

/** Rubbish the waves wash into the roots. */
export const MANGROVE_RUBBISH: readonly ImageName[] = ['plastic-bottle', 'shopping-bags', 'tin'];

/** Young sea life that shelters among grown mangroves. */
export const NURSERY_ANIMALS: readonly ImageName[] = ['fish', 'shrimp', 'crab'];

export const RUBBISH_FACT: MangroveFact = {
  id: 'rubbish',
  term: 'Clean roots',
  detail: 'Plastic gets tangled in mangrove roots. Clean-ups help the young trees grow.',
};

/** Shown in the results, a few at a time. */
export const MANGROVE_FACTS: readonly MangroveFact[] = [
  {
    id: 'wave-breakers',
    term: 'Wave breakers',
    detail: 'Mangrove roots slow down waves and help protect the coast from storms.',
  },
  {
    id: 'nursery',
    term: 'Fish nurseries',
    detail: 'Many fish, prawns and crabs grow up among mangrove roots before heading to sea.',
  },
  {
    id: 'carbon',
    term: 'Blue carbon',
    detail: 'Mangroves lock away lots of carbon in the mud around their roots.',
  },
  {
    id: 'salt',
    term: 'Salty water',
    detail: 'Mangroves can live in salty seawater, where most other trees would die.',
  },
  {
    id: 'propagules',
    term: 'Propagules',
    detail: 'Mangrove seeds sprout while still on the tree, then drop into the mud to grow.',
  },
  {
    id: 'matang',
    term: 'Matang',
    detail: 'The Matang mangroves in Perak have been cared for and replanted for over 100 years.',
  },
  {
    id: 'fireflies',
    term: 'Fireflies',
    detail: 'At Kuala Selangor, fireflies gather in the riverside mangroves at night.',
  },
  {
    id: 'replanting',
    term: 'Replanting',
    detail: 'Communities along Malaysia’s coasts replant mangroves to protect their homes.',
  },
];
