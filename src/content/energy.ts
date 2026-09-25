import type { ImageName } from '../ui/images';

// Switch Off! content: the rooms and appliances of a busy Malaysian home, and a
// short, practical tip for each appliance. See docs/CONTENT.md.

export type RoomId = 'bedroom' | 'living' | 'kitchen' | 'bathroom';

export interface Room {
  id: RoomId;
  name: string;
  /** Label used on narrow phone screens. */
  shortName: string;
  /** The Malay name for the room. */
  malay: string;
  image: ImageName;
}

export interface Appliance {
  id: string;
  name: string;
  room: RoomId;
  image: ImageName;
  /** How much electricity it uses while on, from 1 (a little) to 3 (a lot). */
  power: 1 | 2 | 3;
  /** Shown in the results: how to save energy with it. */
  tip: string;
}

export const ROOMS: readonly Room[] = [
  { id: 'bedroom', name: 'Bedroom', shortName: 'Bedroom', malay: 'bilik tidur', image: 'bed' },
  { id: 'living', name: 'Living room', shortName: 'Living', malay: 'ruang tamu', image: 'couch' },
  { id: 'kitchen', name: 'Kitchen', shortName: 'Kitchen', malay: 'dapur', image: 'frying-pan' },
  { id: 'bathroom', name: 'Bathroom', shortName: 'Bath', malay: 'bilik air', image: 'bathtub' },
];

const LIGHT_TIP =
  'Switch off lights when you leave a room. LED bulbs use much less power than old bulbs.';
const STANDBY_TIP = 'Things on standby still use some power. Switch them off at the wall.';

export const APPLIANCES: readonly Appliance[] = [
  {
    id: 'bedroom-light',
    name: 'Light',
    room: 'bedroom',
    image: 'lightbulb',
    power: 1,
    tip: LIGHT_TIP,
  },
  {
    id: 'aircon',
    name: 'Air-con',
    room: 'bedroom',
    image: 'snowflake',
    power: 3,
    tip: 'Air-con often uses the most electricity at home. Set it to 24°C and keep doors and windows shut.',
  },
  {
    id: 'computer',
    name: 'Computer',
    room: 'bedroom',
    image: 'computer',
    power: 2,
    tip: 'Shut down the computer when you finish, then switch it off at the wall.',
  },
  {
    id: 'living-light',
    name: 'Light',
    room: 'living',
    image: 'lightbulb',
    power: 1,
    tip: LIGHT_TIP,
  },
  { id: 'tv', name: 'TV', room: 'living', image: 'television', power: 2, tip: STANDBY_TIP },
  {
    id: 'console',
    name: 'Game console',
    room: 'living',
    image: 'game-controller',
    power: 2,
    tip: STANDBY_TIP,
  },
  {
    id: 'kitchen-light',
    name: 'Light',
    room: 'kitchen',
    image: 'lightbulb',
    power: 1,
    tip: LIGHT_TIP,
  },
  {
    id: 'kettle',
    name: 'Kettle',
    room: 'kitchen',
    image: 'teapot',
    power: 2,
    tip: 'Only boil the water you need. A full kettle for one cup wastes energy.',
  },
  {
    id: 'rice-cooker',
    name: 'Rice cooker',
    room: 'kitchen',
    image: 'rice',
    power: 1,
    tip: 'A rice cooker on “keep warm” uses power all the time. Switch it off after the meal.',
  },
  {
    id: 'bathroom-light',
    name: 'Light',
    room: 'bathroom',
    image: 'lightbulb',
    power: 1,
    tip: LIGHT_TIP,
  },
  {
    id: 'water-heater',
    name: 'Water heater',
    room: 'bathroom',
    image: 'shower',
    power: 3,
    tip: 'Water heaters use a lot of power. Switch yours off after your shower.',
  },
];

/** Names for the family members who wander around the house. */
export const FAMILY: readonly string[] = ['Adik', 'Kakak', 'Abang'];

/** General energy tips, used when the player met no appliance tips. */
export const ENERGY_TIPS: readonly { term: string; detail: string }[] = [
  {
    term: 'Energy label',
    detail: 'More stars on an energy label means an appliance uses less electricity.',
  },
  {
    term: 'Fans',
    detail: 'A fan uses much less electricity than air-con. Try a fan first on cooler days.',
  },
];
