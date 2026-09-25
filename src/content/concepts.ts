import type { IconName } from '../ui/icons';

export interface Concept {
  id: string;
  term: string;
  /** One plain-language sentence, readable by ages ~9+. */
  detail: string;
  icon: IconName;
}

// Core climate vocabulary shared by Eco Memory and other games.
// See docs/CONTENT.md for the writing and fact-checking rules.
export const CONCEPTS: readonly Concept[] = [
  {
    id: 'climate-change',
    term: 'Climate change',
    detail:
      "Long-term shifts in Earth's temperature and weather, now driven mainly by burning fossil fuels.",
    icon: 'globe',
  },
  {
    id: 'greenhouse-gases',
    term: 'Greenhouse gases',
    detail: 'Gases such as carbon dioxide and methane that trap heat in the atmosphere.',
    icon: 'factory',
  },
  {
    id: 'carbon-footprint',
    term: 'Carbon footprint',
    detail: 'The total greenhouse gases released by a person, product or activity.',
    icon: 'footprints',
  },
  {
    id: 'renewable-energy',
    term: 'Renewable energy',
    detail: 'Power from sources that naturally refill, like sunlight, wind and flowing water.',
    icon: 'sun',
  },
  {
    id: 'wind-power',
    term: 'Wind power',
    detail: 'Electricity made by wind turning the blades of a turbine.',
    icon: 'wind',
  },
  {
    id: 'energy-efficiency',
    term: 'Energy efficiency',
    detail: 'Doing the same job while using less energy, like switching to LED bulbs.',
    icon: 'lightbulb',
  },
  {
    id: 'recycling',
    term: 'Recycling',
    detail: 'Turning used materials into new products instead of throwing them away.',
    icon: 'recycle',
  },
  {
    id: 'reuse-repair',
    term: 'Reuse & repair',
    detail: 'Keeping things in use for longer by mending, sharing or passing them on.',
    icon: 'shirt',
  },
  {
    id: 'biodiversity',
    term: 'Biodiversity',
    detail: 'The variety of all life in a place, from tiny insects to giant trees.',
    icon: 'bird',
  },
  {
    id: 'carbon-sink',
    term: 'Carbon sink',
    detail: 'Something, like a forest or the ocean, that absorbs more carbon than it releases.',
    icon: 'trees',
  },
  {
    id: 'electric-vehicle',
    term: 'Electric vehicle',
    detail: 'A vehicle powered by a battery and electric motor instead of petrol or diesel.',
    icon: 'car',
  },
  {
    id: 'active-travel',
    term: 'Active travel',
    detail: 'Getting around by walking or cycling, which gives off no exhaust fumes.',
    icon: 'bike',
  },
  {
    id: 'net-zero',
    term: 'Net zero',
    detail:
      'Cutting emissions as far as possible and removing the same amount as is still released.',
    icon: 'scale',
  },
  {
    id: 'adaptation',
    term: 'Adaptation',
    detail: 'Preparing for climate impacts, like building flood defences or planting shade trees.',
    icon: 'umbrella',
  },
  {
    id: 'sea-level-rise',
    term: 'Sea level rise',
    detail: 'Oceans rising as land ice melts and warming seawater expands.',
    icon: 'waves',
  },
  {
    id: 'sustainability',
    term: 'Sustainability',
    detail: 'Meeting our needs today without harming the future for people and nature.',
    icon: 'sprout',
  },
];
