import type { IconNode } from 'lucide';
import {
  Pause,
  Search,
  Maximize2,
  LayoutGrid,
  Play,
  ArrowLeft,
  ArrowRight,
  Banana,
  Battery,
  Brain,
  Cable,
  Candy,
  Car,
  Carrot,
  Check,
  Cigarette,
  Coffee,
  Egg,
  Factory,
  Flame,
  Footprints,
  Gamepad2,
  Globe,
  Heart,
  House,
  Leaf,
  Lightbulb,
  Moon,
  Newspaper,
  PaintBucket,
  Pill,
  Plug,
  Puzzle,
  Recycle,
  RotateCcw,
  Salad,
  Sprout,
  Star,
  Sun,
  Thermometer,
  Timer,
  Toothbrush,
  Trash2,
  TreeDeciduous,
  Trees,
  Trophy,
  Umbrella,
  User,
  Volume2,
  VolumeX,
  Waves,
  X,
  Zap,
  TrainFront,
  CloudRain,
  Haze,
  ChevronDown,
  Power,
  PlugZap,
  Fish,
  RotateCw,
  Bed,
  Sofa,
  CookingPot,
  Bath,
  Gauge,
  LightbulbOff,
} from 'lucide';

// One consistent icon family (Lucide, ISC licence) for UI chrome and game art.
// Add icons here and they become available everywhere by name.
const ICONS = {
  pause: Pause,
  search: Search,
  maximize: Maximize2,
  grid: LayoutGrid,
  play: Play,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  banana: Banana,
  battery: Battery,
  brain: Brain,
  cable: Cable,
  candy: Candy,
  car: Car,
  carrot: Carrot,
  check: Check,
  cigarette: Cigarette,
  coffee: Coffee,
  egg: Egg,
  factory: Factory,
  flame: Flame,
  footprints: Footprints,
  gamepad: Gamepad2,
  globe: Globe,
  heart: Heart,
  house: House,
  leaf: Leaf,
  lightbulb: Lightbulb,
  moon: Moon,
  newspaper: Newspaper,
  paint: PaintBucket,
  pill: Pill,
  plug: Plug,
  puzzle: Puzzle,
  recycle: Recycle,
  replay: RotateCcw,
  salad: Salad,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  thermometer: Thermometer,
  timer: Timer,
  toothbrush: Toothbrush,
  trash: Trash2,
  tree: TreeDeciduous,
  trees: Trees,
  trophy: Trophy,
  umbrella: Umbrella,
  user: User,
  volume: Volume2,
  volumeOff: VolumeX,
  waves: Waves,
  x: X,
  zap: Zap,
  trainFront: TrainFront,
  cloudRain: CloudRain,
  haze: Haze,
  chevronDown: ChevronDown,
  power: Power,
  plugZap: PlugZap,
  fish: Fish,
  rotateCw: RotateCw,
  bed: Bed,
  sofa: Sofa,
  cookingPot: CookingPot,
  bath: Bath,
  gauge: Gauge,
  lightbulbOff: LightbulbOff,
} satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export function hasIcon(name: string): name is IconName {
  return name in ICONS;
}

function renderNode(node: IconNode): string {
  return node
    .map(([tag, attrs]) => {
      const attrText = Object.entries(attrs)
        .map(([k, v]) => `${k}="${String(v)}"`)
        .join(' ');
      return `<${tag} ${attrText}/>`;
    })
    .join('');
}

interface IconOptions {
  size?: number;
  strokeWidth?: number;
  color?: string;
  /** Accessible label; when omitted the icon is hidden from screen readers. */
  label?: string;
}

/** Returns SVG markup for an icon. */
export function iconSvg(name: IconName, opts: IconOptions = {}): string {
  const { size = 24, strokeWidth = 2, color = 'currentColor', label } = opts;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" ` +
    `stroke-linejoin="round" ${a11y}>${renderNode(ICONS[name])}</svg>`
  );
}

/** Returns an icon as a DOM element. */
export function icon(name: IconName, opts: IconOptions = {}): SVGElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = iconSvg(name, opts);
  return tpl.content.firstElementChild as SVGElement;
}

/** Returns an icon as a base64 data URL (the form Phaser's loader accepts). */
export function iconDataUrl(name: IconName, opts: IconOptions = {}): string {
  // Icon markup is plain ASCII, so btoa is safe here.
  return `data:image/svg+xml;base64,${btoa(iconSvg(name, opts))}`;
}
