import type { IconNode } from 'lucide';
import {
  Info,
  Pause,
  Search,
  Maximize2,
  ChevronRight,
  LayoutGrid,
  History,
  Play,
  Apple,
  ArrowLeft,
  ArrowRight,
  Banana,
  Bandage,
  Battery,
  Bike,
  Bird,
  BottleWine,
  Brain,
  Cable,
  CanSoda,
  Candy,
  Car,
  Carrot,
  Check,
  Cigarette,
  Coffee,
  Cookie,
  CupSoda,
  Egg,
  Factory,
  FileText,
  Flame,
  Footprints,
  Gamepad2,
  Globe,
  HandCoins,
  Handshake,
  Heart,
  House,
  Leaf,
  Lightbulb,
  Mail,
  Milk,
  Moon,
  Newspaper,
  Package,
  PaintBucket,
  PaperBag,
  Pill,
  Pizza,
  Plug,
  Puzzle,
  Recycle,
  RotateCcw,
  Salad,
  Scale,
  Shirt,
  Smartphone,
  Sparkles,
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
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  Wine,
  X,
  Zap,
} from 'lucide';

// One consistent icon family (Lucide, ISC licence) for UI chrome and game art.
// Add icons here and they become available everywhere by name.
const ICONS = {
  info: Info,
  pause: Pause,
  search: Search,
  maximize: Maximize2,
  chevronRight: ChevronRight,
  grid: LayoutGrid,
  history: History,
  play: Play,
  apple: Apple,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  banana: Banana,
  bandage: Bandage,
  battery: Battery,
  bike: Bike,
  bird: Bird,
  bottle: BottleWine,
  brain: Brain,
  cable: Cable,
  can: CanSoda,
  candy: Candy,
  car: Car,
  carrot: Carrot,
  check: Check,
  cigarette: Cigarette,
  coffee: Coffee,
  cookie: Cookie,
  cupSoda: CupSoda,
  egg: Egg,
  factory: Factory,
  fileText: FileText,
  flame: Flame,
  footprints: Footprints,
  gamepad: Gamepad2,
  globe: Globe,
  handCoins: HandCoins,
  handshake: Handshake,
  heart: Heart,
  house: House,
  leaf: Leaf,
  lightbulb: Lightbulb,
  mail: Mail,
  milk: Milk,
  moon: Moon,
  newspaper: Newspaper,
  package: Package,
  paint: PaintBucket,
  paperBag: PaperBag,
  pill: Pill,
  pizza: Pizza,
  plug: Plug,
  puzzle: Puzzle,
  recycle: Recycle,
  replay: RotateCcw,
  salad: Salad,
  scale: Scale,
  shirt: Shirt,
  smartphone: Smartphone,
  sparkles: Sparkles,
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
  users: Users,
  volume: Volume2,
  volumeOff: VolumeX,
  waves: Waves,
  wind: Wind,
  wine: Wine,
  x: X,
  zap: Zap,
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
