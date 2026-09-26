import type { ImageName } from '../ui/images';

export type BuildingKind = 'home' | 'park' | 'shop' | 'station' | 'solar' | 'factory';

export interface Building {
  kind: BuildingKind;
  name: string;
  image: ImageName;
  /** How the building scores, in a few words, shown on its card. */
  rule: string;
  /** Why it matters for a greener city: shown in the results. */
  fact: string;
}

// Green City: place buildings on a small town grid. Each scores by what is next to
// it, so a good layout is a walkable, green, clean-powered town. See docs/CONTENT.md.
export const BUILDINGS: Record<BuildingKind, Building> = {
  home: {
    kind: 'home',
    name: 'Home',
    image: 'house',
    rule: '+1 next to a park, shop or station. −2 next to a factory.',
    fact: 'Homes near shops, parks and transport let people walk instead of drive.',
  },
  park: {
    kind: 'park',
    name: 'Park',
    image: 'tree',
    rule: '+1 next to a home or another park.',
    fact: 'Parks and trees cool the city, soak up rain and give wildlife a home.',
  },
  shop: {
    kind: 'shop',
    name: 'Kedai',
    image: 'shop',
    rule: '+1 next to a home or station.',
    fact: 'A kedai you can walk to means fewer car trips for everyday things.',
  },
  station: {
    kind: 'station',
    name: 'Station',
    image: 'metro',
    rule: '+1 next to a home, shop or factory.',
    fact: 'Trains and buses near homes and work mean fewer cars and cleaner air.',
  },
  solar: {
    kind: 'solar',
    name: 'Solar panels',
    image: 'sun',
    rule: '+1 next to any building it can power.',
    fact: 'Solar panels make clean electricity right next to where it is used.',
  },
  factory: {
    kind: 'factory',
    name: 'Factory',
    image: 'factory',
    rule: '+3. +1 next to a station or solar panels.',
    fact: 'Factories give jobs, but their noise and fumes are best kept away from homes.',
  },
};

/** Shown in the results with the building facts. */
export const CITY_FACT = {
  term: 'Low carbon cities',
  detail: 'Malaysia’s Low Carbon Cities Framework helps towns plan greener places to live.',
};
