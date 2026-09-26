// 3D object images (Microsoft Fluent Emoji, MIT) used for game art. The files live in
// src/assets/3d; see the README there for where they come from and how to add one.

export const IMAGE_NAMES = [
  'airplane',
  'backpack',
  'banana',
  'bathtub',
  'battery',
  'beans',
  'bee',
  'bicycle',
  'books',
  'brain',
  'bucket',
  'bus',
  'butterfly',
  'candy',
  'canoe',
  'car',
  'carrot',
  'chicken',
  'cigarette',
  'city',
  'coat',
  'coconut',
  'coffee',
  'computer',
  'crab',
  'cup',
  'dress',
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
  'game-controller',
  'globe',
  'globe-americas',
  'globe-asia',
  'hamburger',
  'high-voltage',
  'house',
  'houses',
  'jar',
  'juice-box',
  'laptop',
  'letters',
  'lightbulb',
  'low-battery',
  'mango',
  'meat',
  'metro',
  'milk',
  'national-park',
  'newspaper',
  'office',
  'orangutan',
  'otter',
  'palm-tree',
  'paper',
  'parcel',
  'phone',
  'pill',
  'plaster',
  'plastic-bottle',
  'plug',
  'potted-plant',
  'printer',
  'puzzle',
  'radio',
  'rain-cloud',
  'recycle',
  'rice',
  'scales',
  'school',
  'seed',
  'seedling',
  'shop',
  'shopping-bags',
  'shower',
  'shrimp',
  'snowflake',
  'strawberry',
  'sun',
  'superhero',
  't-shirt',
  'takeaway-box',
  'teapot',
  'television',
  'thermometer',
  'tiger',
  'tin',
  'tissue',
  'toolbox',
  'toothbrush',
  'train',
  'tree',
  'turtle',
  'umbrella',
  'wastebasket',
  'wave',
  'wind',
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
