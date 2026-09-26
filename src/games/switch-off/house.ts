import type { RoomId } from '../../content/energy';

// The Switch Off! house: a small Malaysian home seen from above. This is only the
// layout (walls, doors, furniture, where each appliance stands). logic.ts turns it
// into a walkable floor plan, and SwitchScene.ts draws it.

export interface Tile {
  x: number;
  y: number;
}

export type Dir = 'up' | 'down' | 'left' | 'right';

export type FurnitureKind =
  | 'bed'
  | 'bedside'
  | 'wardrobe'
  | 'desk'
  | 'chair'
  | 'armchair'
  | 'sofa'
  | 'coffee-table'
  | 'tv-unit'
  | 'shelf'
  | 'shoe-rack'
  | 'plant'
  | 'floor-lamp'
  | 'rug'
  | 'runner'
  | 'doormat'
  | 'fridge'
  | 'counter'
  | 'sink'
  | 'hob'
  | 'table'
  | 'pantry'
  | 'bathtub'
  | 'toilet'
  | 'basin'
  | 'mirror'
  | 'bathmat'
  | 'ac-unit'
  | 'heater-unit';

export interface Furniture {
  kind: FurnitureKind;
  /** The top-left tile it covers. Floor decor may use fractions. */
  x: number;
  y: number;
  /** Size in tiles (1 × 1 when left out). */
  w?: number;
  h?: number;
  /** The side people use it from: the foot of the bed, the seat of the sofa. */
  facing?: Dir;
}

/** Furniture people walk over (rugs, chairs) or that hangs on a wall or sits on a counter. */
export const WALK_OVER: ReadonlySet<FurnitureKind> = new Set<FurnitureKind>([
  'rug',
  'runner',
  'doormat',
  'bathmat',
  'chair',
  'sink',
  'hob',
  'mirror',
  'ac-unit',
  'heater-unit',
]);

export interface HouseLayout {
  /**
   * One character per tile: rooms are b (bedroom), l (living room), k (kitchen) and
   * w (bathroom); h is the hallway, s is where the player starts (in the hallway),
   * d is a doorway and # is wall.
   */
  map: readonly string[];
  /** Where each appliance stands. Appliances block walking; people use them from next to them. */
  appliances: Readonly<Record<string, Tile>>;
  furniture: readonly Furniture[];
  /** Stretches of outside wall with a window, as boxes of wall tiles. */
  windows: readonly { x: number; y: number; w: number; h: number }[];
  /** The front door, a tile of outside wall. */
  frontDoor: Tile;
  /** Where each room's name is written on the floor. */
  labels: Readonly<Record<RoomId, { x: number; y: number }>>;
}

export const HOUSE: HouseLayout = {
  map: [
    '#####################',
    '#bbbbbbb#wwwww#kkkkk#',
    '#bbbbbbb#wwwww#kkkkk#',
    '#bbbbbbb#wwwww#kkkkk#',
    '#bbbbbbb###d###kkkkk#',
    '#bbbbbbbdhhhhhdkkkkk#',
    '#bbbbbbb#hhshh#kkkkk#',
    '#########hhhhh###d###',
    '#lllllllllllllllllll#',
    '#lllllllllllllllllll#',
    '#lllllllllllllllllll#',
    '#lllllllllllllllllll#',
    '#lllllllllllllllllll#',
    '#####################',
  ],
  appliances: {
    'bedroom-light': { x: 4, y: 1 },
    aircon: { x: 6, y: 1 },
    computer: { x: 5, y: 6 },
    'bathroom-light': { x: 9, y: 2 },
    'water-heater': { x: 12, y: 1 },
    kettle: { x: 16, y: 1 },
    'rice-cooker': { x: 19, y: 2 },
    'kitchen-light': { x: 17, y: 3 },
    'living-light': { x: 5, y: 8 },
    tv: { x: 1, y: 10 },
    console: { x: 1, y: 11 },
  },
  furniture: [
    // Bedroom: a double bed between two bedside tables, a wardrobe and a desk.
    { kind: 'rug', x: 2, y: 3.4, w: 3, h: 2 },
    { kind: 'bed', x: 2, y: 1, w: 2, h: 3, facing: 'down' },
    { kind: 'bedside', x: 1, y: 1 },
    { kind: 'bedside', x: 4, y: 1 },
    { kind: 'ac-unit', x: 6, y: 1, facing: 'down' },
    { kind: 'plant', x: 7, y: 1 },
    { kind: 'wardrobe', x: 1, y: 5, h: 2, facing: 'right' },
    { kind: 'desk', x: 4, y: 6, w: 3, facing: 'up' },
    { kind: 'chair', x: 5, y: 5, facing: 'down' },
    // Bathroom: bathtub with the water heater over it, toilet, basin and mirror.
    { kind: 'bathmat', x: 10, y: 2, w: 2 },
    { kind: 'bathtub', x: 9, y: 1, w: 3, facing: 'down' },
    { kind: 'heater-unit', x: 12, y: 1, facing: 'down' },
    { kind: 'toilet', x: 13, y: 1, facing: 'down' },
    { kind: 'mirror', x: 9, y: 2, facing: 'right' },
    { kind: 'basin', x: 9, y: 3, facing: 'right' },
    // Hallway.
    { kind: 'runner', x: 10, y: 5.1, w: 3, h: 1.8 },
    { kind: 'plant', x: 13, y: 7 },
    // Kitchen: fridge, an L-shaped counter with sink and hob, and a dining table.
    { kind: 'fridge', x: 15, y: 1, facing: 'down' },
    { kind: 'counter', x: 16, y: 1, w: 4, facing: 'down' },
    { kind: 'counter', x: 19, y: 2, h: 2, facing: 'left' },
    { kind: 'sink', x: 17.5, y: 1, facing: 'down' },
    { kind: 'hob', x: 19, y: 3, facing: 'left' },
    { kind: 'pantry', x: 19, y: 5, h: 2, facing: 'left' },
    { kind: 'chair', x: 15, y: 3, facing: 'right' },
    { kind: 'chair', x: 15, y: 4, facing: 'right' },
    { kind: 'chair', x: 18, y: 3, facing: 'left' },
    { kind: 'chair', x: 18, y: 4, facing: 'left' },
    { kind: 'table', x: 16, y: 3, w: 2, h: 2 },
    // Living room: TV and sofa round a coffee table, bookshelf, and the front door.
    { kind: 'rug', x: 2, y: 9, w: 3, h: 3 },
    { kind: 'tv-unit', x: 1, y: 9, h: 3, facing: 'right' },
    { kind: 'sofa', x: 5, y: 9, h: 3, facing: 'left' },
    { kind: 'armchair', x: 3, y: 8, facing: 'down' },
    { kind: 'coffee-table', x: 3, y: 10 },
    { kind: 'floor-lamp', x: 5, y: 8 },
    { kind: 'plant', x: 19, y: 8 },
    { kind: 'plant', x: 19, y: 12 },
    { kind: 'shelf', x: 15, y: 12, w: 3, facing: 'up' },
    { kind: 'shoe-rack', x: 13, y: 12, facing: 'up' },
    // A reading corner by the window.
    { kind: 'rug', x: 16.4, y: 9.2, w: 3, h: 2.6 },
    { kind: 'armchair', x: 18, y: 10, facing: 'left' },
    { kind: 'bedside', x: 18, y: 9 },
    { kind: 'doormat', x: 11, y: 12 },
  ],
  windows: [
    { x: 0, y: 2, w: 1, h: 2 },
    { x: 10, y: 0, w: 2, h: 1 },
    { x: 17, y: 0, w: 2, h: 1 },
    { x: 20, y: 9, w: 1, h: 3 },
    { x: 3, y: 13, w: 3, h: 1 },
    { x: 15, y: 13, w: 3, h: 1 },
  ],
  frontDoor: { x: 11, y: 13 },
  labels: {
    bedroom: { x: 4.5, y: 4.3 },
    bathroom: { x: 11.5, y: 2.6 },
    kitchen: { x: 16, y: 5.6 },
    living: { x: 12, y: 10 },
  },
};
