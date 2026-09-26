import type { ImageName } from '../ui/images';

/** Where an extra picture sits around a stage's main picture. */
export type ArtSpot = 'left' | 'right' | 'back' | 'corner';

export interface ForestStage {
  /** 1 for the seed, up to FOREST_STAGES.length for the top tile. */
  stage: number;
  id: string;
  name: string;
  /** A shorter name for small tiles, when the full name is long. */
  short?: string;
  /** The main picture, in front. */
  image: ImageName;
  /** More pictures around it, so a grove or a forest shows several trees. */
  extras?: { image: ImageName; at: ArtSpot }[];
  /** Shown the first time a player grows this stage, and in the results. */
  fact: string;
}

// Grow the Forest: each merge grows something bigger, from a seed to a tree, then from
// a grove to a rainforest, and on to the great rainforests of the world. See
// docs/CONTENT.md for the rules.
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
    image: 'potted-plant',
    fact: 'Tree nurseries grow saplings like this one to replant forests that were cut down.',
  },
  {
    stage: 4,
    id: 'tree',
    name: 'Young tree',
    image: 'tree',
    fact: 'Trees take in carbon dioxide as they grow and store the carbon in their wood.',
  },
  {
    stage: 5,
    id: 'tualang',
    name: 'Tualang',
    image: 'tree',
    extras: [{ image: 'bee', at: 'corner' }],
    fact: 'Tualang trees tower over the rainforest, and wild bees hang their hives from them.',
  },
  {
    stage: 6,
    id: 'grove',
    name: 'Grove',
    image: 'tree',
    extras: [
      { image: 'tree', at: 'left' },
      { image: 'tree', at: 'right' },
    ],
    fact: 'Trees growing close together shade the ground and keep it cool and damp.',
  },
  {
    stage: 7,
    id: 'forest',
    name: 'Forest',
    image: 'tree',
    extras: [
      { image: 'tree', at: 'back' },
      { image: 'palm-tree', at: 'left' },
      { image: 'tree', at: 'right' },
    ],
    fact: 'Forests soak up rain like a sponge, which helps prevent floods and landslides.',
  },
  {
    stage: 8,
    id: 'rainforest',
    name: 'Rainforest',
    image: 'tree',
    extras: [
      { image: 'palm-tree', at: 'left' },
      { image: 'tree', at: 'right' },
      { image: 'rain-cloud', at: 'corner' },
    ],
    fact: 'Rainforests are home to more kinds of plants and animals than anywhere else on land.',
  },
  {
    stage: 9,
    id: 'taman-negara',
    name: 'Taman Negara',
    image: 'national-park',
    fact: 'Taman Negara, Malaysia’s first national park, protects one of the oldest rainforests on Earth.',
  },
  {
    stage: 10,
    id: 'borneo',
    name: 'Heart of Borneo',
    short: 'Borneo',
    image: 'globe-asia',
    fact: 'Malaysia, Indonesia and Brunei work together to protect the Heart of Borneo’s rainforests.',
  },
  {
    stage: 11,
    id: 'amazon',
    name: 'Amazon rainforest',
    short: 'Amazon',
    image: 'globe-americas',
    fact: 'The Amazon is the biggest rainforest on Earth, and it stretches across nine countries.',
  },
];
