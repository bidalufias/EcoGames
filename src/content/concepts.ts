import type { ImageName } from '../ui/images';

export interface Concept {
  id: string;
  term: string;
  /** One plain-language sentence, readable by ages ~9+. */
  detail: string;
  image: ImageName;
}

// Core climate vocabulary shared by Eco Memory and the hub's fact card, set in Malaysia.
// See docs/CONTENT.md for the writing and fact-checking rules.
export const CONCEPTS: readonly Concept[] = [
  {
    id: 'climate-change',
    term: 'Climate change',
    detail:
      'Long-term changes in weather. In Malaysia that means hotter days and heavier downpours.',
    image: 'globe',
  },
  {
    id: 'greenhouse-gases',
    term: 'Greenhouse gases',
    detail:
      'Gases like carbon dioxide and methane that trap heat, from burning fuel and rotting waste.',
    image: 'factory',
  },
  {
    id: 'carbon-footprint',
    term: 'Carbon footprint',
    detail: 'The greenhouse gases caused by what we do, from car trips to the food we eat.',
    image: 'footprints',
  },
  {
    id: 'solar-power',
    term: 'Solar power',
    detail: 'Electricity from sunlight. Malaysia gets strong sunshine all year round.',
    image: 'sun',
  },
  {
    id: 'hydropower',
    term: 'Hydropower',
    detail: "Electricity from flowing water, like the big dams on Sarawak's rivers.",
    image: 'droplet',
  },
  {
    id: 'energy-efficiency',
    term: 'Energy efficiency',
    detail:
      'Doing the same job with less energy. More stars on an appliance label means it uses less.',
    image: 'lightbulb',
  },
  {
    id: 'recycling',
    term: 'Recycling',
    detail: 'Turning used paper, plastic, glass and metal into new things. In Malay: kitar semula.',
    image: 'recycle',
  },
  {
    id: 'composting',
    term: 'Composting',
    detail: 'Turning food scraps and leaves into rich soil instead of sending them to landfill.',
    image: 'seedling',
  },
  {
    id: 'reuse-repair',
    term: 'Reuse & repair',
    detail: 'Keeping things in use for longer, like bringing your own tub when you tapau food.',
    image: 'toolbox',
  },
  {
    id: 'rainforest',
    term: 'Rainforest',
    detail: "Malaysia's forests shelter countless species and store huge amounts of carbon.",
    image: 'tree',
  },
  {
    id: 'peat-swamp',
    term: 'Peat swamp',
    detail:
      'Waterlogged forest soil packed with carbon. When drained, peat can burn and cause haze.',
    image: 'fire',
  },
  {
    id: 'mangroves',
    term: 'Mangroves',
    detail: 'Coastal trees that shield the shore from waves and shelter crabs and baby fish.',
    image: 'crab',
  },
  {
    id: 'haze',
    term: 'Haze',
    detail:
      'Smoky air from forest and peat fires. Check the Air Pollutant Index (API) on hazy days.',
    image: 'fog',
  },
  {
    id: 'biodiversity',
    term: 'Biodiversity',
    detail: "The variety of life. Malaysia is one of the world's most species-rich countries.",
    image: 'butterfly',
  },
  {
    id: 'flash-flood',
    term: 'Flash flood',
    detail: 'A sudden flood after very heavy rain. Clear drains help rainwater flow away.',
    image: 'rain-cloud',
  },
  {
    id: 'public-transport',
    term: 'Public transport',
    detail: 'Buses and trains like the LRT and MRT move many people at once, with less traffic.',
    image: 'metro',
  },
  {
    id: 'electric-vehicle',
    term: 'Electric vehicle',
    detail: 'A car or bus powered by a battery and electric motor instead of petrol.',
    image: 'car',
  },
  {
    id: 'urban-heat',
    term: 'Urban heat',
    detail: 'Cities trap heat in concrete and roads. Trees and parks help cool them down.',
    image: 'city',
  },
  {
    id: 'net-zero',
    term: 'Net zero',
    detail: 'Cutting emissions and balancing the rest. Malaysia aims for it as early as 2050.',
    image: 'scales',
  },
  {
    id: 'adaptation',
    term: 'Adaptation',
    detail: 'Preparing for climate impacts, like better flood defences and shady trees.',
    image: 'umbrella',
  },
];
