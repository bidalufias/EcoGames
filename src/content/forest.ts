import type { ImageName } from '../ui/images';

export interface ForestStage {
  /** 1 for the seed, up to FOREST_STAGES.length for the top tile. */
  stage: number;
  id: string;
  name: string;
  image: ImageName;
  /** Shown the first time a player grows this stage, and in the results. */
  fact: string;
}

// Grow the Forest: each merge grows the next stage of a Malaysian rainforest, from a
// seed to the animals that live there. See docs/CONTENT.md for the rules.
export const FOREST_STAGES: readonly ForestStage[] = [
  {
    stage: 1,
    id: 'seed',
    name: 'Seed',
    image: 'seed',
    fact: 'Many rainforest trees rely on animals to carry their seeds to new places.',
  },
  {
    stage: 2,
    id: 'seedling',
    name: 'Seedling',
    image: 'seedling',
    fact: 'Seedlings can wait for years in the shade until a fallen tree lets the light in.',
  },
  {
    stage: 3,
    id: 'sapling',
    name: 'Sapling',
    image: 'herb',
    fact: 'Saplings race upwards towards the light that reaches the forest floor.',
  },
  {
    stage: 4,
    id: 'tree',
    name: 'Tree',
    image: 'tree',
    fact: 'Trees take in carbon dioxide as they grow and store the carbon in their wood.',
  },
  {
    stage: 5,
    id: 'fungi',
    name: 'Fungi',
    image: 'mushroom',
    fact: 'Fungi break down fallen leaves and wood, and give the goodness back to the soil.',
  },
  {
    stage: 6,
    id: 'butterfly',
    name: 'Birdwing',
    image: 'butterfly',
    fact: 'Rajah Brooke’s birdwing, with its bright green wings, is Malaysia’s national butterfly.',
  },
  {
    stage: 7,
    id: 'frog',
    name: 'Frog',
    image: 'frog',
    fact: 'Frogs are harmed easily by pollution, so lots of frogs is a sign of a healthy forest.',
  },
  {
    stage: 8,
    id: 'hornbill',
    name: 'Hornbill',
    image: 'bird',
    fact: 'Malaysia has ten kinds of hornbill. They spread the seeds of the fruit they eat.',
  },
  {
    stage: 9,
    id: 'orangutan',
    name: 'Orangutan',
    image: 'orangutan',
    fact: 'Wild orangutans in Malaysia live in the rainforests of Sabah and Sarawak.',
  },
  {
    stage: 10,
    id: 'elephant',
    name: 'Elephant',
    image: 'elephant',
    fact: 'Elephants need big, joined-up forests to find enough food as they roam.',
  },
  {
    stage: 11,
    id: 'tiger',
    name: 'Malayan tiger',
    image: 'tiger',
    fact: 'The Malayan tiger is critically endangered. Protecting its forest helps it survive.',
  },
];
