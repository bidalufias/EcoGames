// 3D object images (Microsoft Fluent Emoji, MIT) used for game art. The files live in
// src/assets/3d; see the README there for where they come from and how to add one.

export const IMAGE_NAMES = [
  'banana',
  'bathtub',
  'battery',
  'bed',
  'boy',
  'brain',
  'bucket',
  'butterfly',
  'candy',
  'canoe',
  'car',
  'carrot',
  'child',
  'cigarette',
  'city',
  'coconut',
  'coffee',
  'computer',
  'couch',
  'crab',
  'cup',
  'droplet',
  'duck',
  'egg',
  'envelope',
  'factory',
  'fallen-leaves',
  'fire',
  'fish',
  'fog',
  'footprints',
  'frying-pan',
  'game-controller',
  'girl',
  'globe',
  'grandpa',
  'high-voltage',
  'house',
  'houses',
  'jar',
  'laptop',
  'lightbulb',
  'low-battery',
  'mango',
  'metro',
  'newspaper',
  'otter',
  'paper',
  'parcel',
  'phone',
  'pill',
  'plaster',
  'plastic-bottle',
  'plug',
  'printer',
  'puzzle',
  'radio',
  'rain-cloud',
  'recycle',
  'rice',
  'scales',
  'seedling',
  'shopping-bags',
  'shower',
  'snowflake',
  'sun',
  'superhero',
  'takeaway-box',
  'teapot',
  'television',
  'tiger',
  'tin',
  'tissue',
  'toolbox',
  'toothbrush',
  'tree',
  'turtle',
  'umbrella',
  'wave',
  'woman-headscarf',
] as const;

export type ImageName = (typeof IMAGE_NAMES)[number];

/** Bundled URLs for every file in src/assets/3d, keyed by file path. */
export const IMAGE_FILES = import.meta.glob<string>('../assets/3d/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function imageUrl(name: ImageName): string {
  return IMAGE_FILES[`../assets/3d/${name}.webp`] ?? '';
}

/** An <img> for decorative art; pass `alt` when the image carries meaning. */
export function image(
  name: ImageName,
  opts: { size?: number; alt?: string } = {},
): HTMLImageElement {
  const img = document.createElement('img');
  img.src = imageUrl(name);
  img.alt = opts.alt ?? '';
  img.draggable = false;
  img.decoding = 'async';
  if (opts.size) img.width = img.height = opts.size;
  return img;
}
