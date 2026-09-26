import type { ImageName } from '../ui/images';

export type ChoiceTopic = 'travel' | 'food' | 'home' | 'stuff';

export interface Choice {
  name: string;
  image: ImageName;
}

export interface ChoicePair {
  id: string;
  topic: ChoiceTopic;
  /** The choice that is kinder to the planet. */
  greener: Choice;
  other: Choice;
  /** Why the greener choice wins: one short sentence, shown after each answer. */
  why: string;
}

export const TOPIC_LABELS: Record<ChoiceTopic, string> = {
  travel: 'Getting around',
  food: 'Food and drink',
  home: 'At home',
  stuff: 'Shopping and waste',
};

// Greener Choice: pairs of everyday choices where one is clearly kinder to the planet.
// Only use comparisons with a big, well-established gap (see docs/CONTENT.md), and
// explain the reason rather than quoting numbers.
export const CHOICE_PAIRS: readonly ChoicePair[] = [
  // ---------- Getting around ----------
  {
    id: 'mrt-car',
    topic: 'travel',
    greener: { name: 'MRT to work', image: 'metro' },
    other: { name: 'Driving alone', image: 'car' },
    why: 'A full train carries hundreds of people, so each rider’s share of the energy is small.',
  },
  {
    id: 'bike-car',
    topic: 'travel',
    greener: { name: 'Cycling to the kedai', image: 'bicycle' },
    other: { name: 'Driving to the kedai', image: 'car' },
    why: 'A bicycle runs on your own energy and makes no exhaust fumes at all.',
  },
  {
    id: 'bus-car',
    topic: 'travel',
    greener: { name: 'Taking the bus', image: 'bus' },
    other: { name: 'Driving alone', image: 'car' },
    why: 'One bus can take dozens of cars off the road, so each passenger adds far less pollution.',
  },
  {
    id: 'train-plane',
    topic: 'travel',
    greener: { name: 'Train from KL to Penang', image: 'train' },
    other: { name: 'Flying from KL to Penang', image: 'airplane' },
    why: 'For trips within Malaysia, the electric train makes much less pollution than a plane.',
  },
  {
    id: 'walk-drive',
    topic: 'travel',
    greener: { name: 'Walking to school', image: 'footprints' },
    other: { name: 'Being driven to school', image: 'car' },
    why: 'Walking makes no pollution, and it’s good exercise too.',
  },
  {
    id: 'call-flight',
    topic: 'travel',
    greener: { name: 'A video call', image: 'laptop' },
    other: { name: 'Flying to a meeting', image: 'airplane' },
    why: 'A video call uses a little electricity. A flight burns a lot of fuel.',
  },

  // ---------- Food and drink ----------
  {
    id: 'chicken-beef',
    topic: 'food',
    greener: { name: 'Chicken burger', image: 'chicken' },
    other: { name: 'Beef burger', image: 'hamburger' },
    why: 'Cattle need lots of land and feed, and they burp methane, a strong greenhouse gas.',
  },
  {
    id: 'tempeh-beef',
    topic: 'food',
    greener: { name: 'Tempeh and tofu', image: 'beans' },
    other: { name: 'Beef rendang', image: 'meat' },
    why: 'Soya beans give us protein with a tiny share of the emissions of beef.',
  },
  {
    id: 'local-flown',
    topic: 'food',
    greener: { name: 'Local mangoes', image: 'mango' },
    other: { name: 'Fruit flown from overseas', image: 'strawberry' },
    why: 'Food flown in by plane has a much bigger footprint than fruit grown nearby.',
  },
  {
    id: 'tap-bottled',
    topic: 'food',
    greener: { name: 'Refilling your own bottle', image: 'droplet' },
    other: { name: 'Buying bottled water', image: 'plastic-bottle' },
    why: 'Every plastic bottle takes oil and energy to make and to truck to the shop.',
  },
  {
    id: 'leftovers',
    topic: 'food',
    greener: { name: 'Tapau your leftovers', image: 'takeaway-box' },
    other: { name: 'Throw leftovers away', image: 'wastebasket' },
    why: 'Food in landfill rots and gives off methane, a strong greenhouse gas.',
  },
  {
    id: 'soy-milk',
    topic: 'food',
    greener: { name: 'Soy milk', image: 'juice-box' },
    other: { name: 'Cow’s milk', image: 'milk' },
    why: 'Plant drinks like soy milk usually have a smaller footprint than cow’s milk.',
  },

  // ---------- At home ----------
  {
    id: 'fan-aircon',
    topic: 'home',
    greener: { name: 'Ceiling fan', image: 'wind' },
    other: { name: 'Aircon', image: 'snowflake' },
    why: 'A fan uses much less electricity than an aircon. Try it on cooler nights.',
  },
  {
    id: 'aircon-24',
    topic: 'home',
    greener: { name: 'Aircon at 24°C', image: 'thermometer' },
    other: { name: 'Aircon at 18°C', image: 'snowflake' },
    why: 'Every degree colder makes the aircon work harder and use more electricity.',
  },
  {
    id: 'sun-dryer',
    topic: 'home',
    greener: { name: 'Drying clothes in the sun', image: 't-shirt' },
    other: { name: 'Using a tumble dryer', image: 'high-voltage' },
    why: 'Malaysian sunshine dries clothes for free. A dryer uses lots of electricity.',
  },
  {
    id: 'shower-bath',
    topic: 'home',
    greener: { name: 'A quick shower', image: 'shower' },
    other: { name: 'A full bath', image: 'bathtub' },
    why: 'A quick shower uses less water than a bath, and less energy to heat it.',
  },
  {
    id: 'plug-standby',
    topic: 'home',
    greener: { name: 'Switch off at the wall', image: 'plug' },
    other: { name: 'Leave the TV on standby', image: 'television' },
    why: 'Things on standby still use a little electricity all day and all night.',
  },
  {
    id: 'solar-coal',
    topic: 'home',
    greener: { name: 'Power from solar panels', image: 'sun' },
    other: { name: 'Power from coal', image: 'factory' },
    why: 'Solar panels make electricity from sunlight without burning anything.',
  },

  // ---------- Shopping and waste ----------
  {
    id: 'own-bag',
    topic: 'stuff',
    greener: { name: 'Bring your own bag', image: 'backpack' },
    other: { name: 'A new plastic bag each time', image: 'shopping-bags' },
    why: 'Using one bag again and again saves the oil and energy to make new ones.',
  },
  {
    id: 'repair-phone',
    topic: 'stuff',
    greener: { name: 'Repair your phone', image: 'toolbox' },
    other: { name: 'Buy a new phone', image: 'phone' },
    why: 'Most of a phone’s footprint comes from making it, so using it longer helps.',
  },
  {
    id: 'tumbler',
    topic: 'stuff',
    greener: { name: 'Teh tarik in your own mug', image: 'coffee' },
    other: { name: 'A throwaway cup every day', image: 'cup' },
    why: 'A cup you reuse every day saves hundreds of throwaway cups a year.',
  },
  {
    id: 'recycle-can',
    topic: 'stuff',
    greener: { name: 'Recycle the can', image: 'tin' },
    other: { name: 'Bin the can', image: 'wastebasket' },
    why: 'Making a can from recycled aluminium takes far less energy than making a new one.',
  },
  {
    id: 'recycle-burn',
    topic: 'stuff',
    greener: { name: 'Sort it for recycling', image: 'recycle' },
    other: { name: 'Burn rubbish in the garden', image: 'fire' },
    why: 'Open burning makes smoke that harms our lungs and adds to climate change.',
  },
  {
    id: 'preloved',
    topic: 'stuff',
    greener: { name: 'Pre-loved clothes', image: 'coat' },
    other: { name: 'New clothes worn once', image: 'dress' },
    why: 'Making new clothes uses lots of water and energy. Pre-loved clothes skip that.',
  },
  {
    id: 'library',
    topic: 'stuff',
    greener: { name: 'Borrow from the library', image: 'books' },
    other: { name: 'Buy a new book to read once', image: 'newspaper' },
    why: 'Sharing books means fewer trees cut down and less energy to print new ones.',
  },
];
