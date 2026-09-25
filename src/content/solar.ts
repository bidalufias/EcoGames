export interface SolarFact {
  id: string;
  term: string;
  /** One plain-language sentence, readable by ages ~9+. */
  detail: string;
}

// Solar power facts for Solar Link, set in Malaysia. Solar Link shows a few of them after
// each puzzle, taking the next ones each time. See docs/CONTENT.md for the rules.
export const SOLAR_FACTS: readonly SolarFact[] = [
  {
    id: 'equator-sun',
    term: 'Equator sunshine',
    detail: 'Malaysia is close to the equator, so it gets strong sunshine all year round.',
  },
  {
    id: 'sunlight-to-power',
    term: 'Sunlight to power',
    detail: 'Solar panels turn sunlight straight into electricity, with no moving parts.',
  },
  {
    id: 'solar-farms',
    term: 'Solar farms',
    detail: 'Large solar farms send their electricity into the national grid for everyone to use.',
  },
  {
    id: 'rooftop-solar',
    term: 'Rooftop solar',
    detail: 'Homes with solar panels on the roof can send their spare electricity to the grid.',
  },
  {
    id: 'clean-power',
    term: 'Clean power',
    detail: 'Solar panels make electricity without smoke or greenhouse gases while they work.',
  },
  {
    id: 'cloudy-days',
    term: 'Cloudy days',
    detail: 'Solar panels still work on cloudy days, just less than in full sun.',
  },
  {
    id: 'the-grid',
    term: 'The grid',
    detail: 'Cables in the grid carry electricity from where it is made to where it is used.',
  },
  {
    id: 'floating-solar',
    term: 'Floating solar',
    detail: 'Solar panels can sit on roofs and car parks, and some even float on lakes.',
  },
];
