export interface EcoWord {
  /** Five capital letters. */
  word: string;
  /** A short clue that doesn't give the word away. */
  clue: string;
  /** Shown once the word is solved (or given away), and in the results. */
  fact: string;
}

// Eco Word answers: five-letter words about climate, nature and green living in
// Malaysia. See docs/CONTENT.md for the rules.
export const ECO_WORDS: readonly EcoWord[] = [
  {
    word: 'SOLAR',
    clue: 'Power that comes from sunshine',
    fact: 'Solar panels turn sunlight into electricity. Malaysia gets strong sunshine all year.',
  },
  {
    word: 'OZONE',
    clue: 'A layer high in the sky that blocks harmful rays',
    fact: 'The ozone layer shields Earth from the sun’s harmful UV rays.',
  },
  {
    word: 'WASTE',
    clue: 'Everything we throw away',
    fact: 'Reduce, reuse and recycle to make less waste, and separate it at home.',
  },
  {
    word: 'PLANT',
    clue: 'It makes its own food from sunlight',
    fact: 'Plants use sunlight, water and carbon dioxide to grow, and give out oxygen.',
  },
  {
    word: 'OCEAN',
    clue: 'It soaks up lots of the world’s extra heat',
    fact: 'The ocean takes in heat and carbon dioxide, which is changing life in the sea.',
  },
  {
    word: 'CORAL',
    clue: 'Tiny animals that build reefs',
    fact: 'Coral reefs are home to many fish. Seas that get too warm can turn corals white.',
  },
  {
    word: 'RIVER',
    clue: 'Sungai, in Malay',
    fact: 'Rivers carry rubbish out to sea, so keeping rivers clean helps the ocean too.',
  },
  {
    word: 'TIGER',
    clue: 'A striped big cat of Malaysian forests',
    fact: 'The Malayan tiger is critically endangered and needs large, joined-up forests.',
  },
  {
    word: 'TAPIR',
    clue: 'A black and white forest animal with a short trunk',
    fact: 'The Malayan tapir lives in Malaysia’s forests. Its black and white coat hides it at night.',
  },
  {
    word: 'OTTER',
    clue: 'A playful swimmer of rivers and mangroves',
    fact: 'Smooth-coated otters live along Malaysian rivers and coasts, and even in some cities.',
  },
  {
    word: 'FLOOD',
    clue: 'Too much water where it should be dry',
    fact: 'Floods happen when heavy rain overfills rivers and drains, often in the monsoon.',
  },
  {
    word: 'STORM',
    clue: 'Thunder, lightning and heavy rain',
    fact: 'Warmer air can hold more water, so storms can bring heavier rain.',
  },
  {
    word: 'REUSE',
    clue: 'Use it again instead of throwing it away',
    fact: 'Bring your own bottle or container when you tapau to reuse instead of throwing away.',
  },
  {
    word: 'EARTH',
    clue: 'Our home planet',
    fact: 'Earth is the only planet we know of with life, so it is worth looking after.',
  },
  {
    word: 'CLOUD',
    clue: 'Tiny drops of water floating in the sky',
    fact: 'Clouds are made of tiny drops of water or ice. They bring the rain that fills our dams.',
  },
  {
    word: 'WATER',
    clue: 'Turn off the tap to save it',
    fact: 'Turn off the tap while you brush your teeth to save clean water.',
  },
  {
    word: 'GREEN',
    clue: 'The colour of leaves, and of living kindly to the planet',
    fact: 'Going green means choosing things that are kinder to the planet.',
  },
  {
    word: 'PAPER',
    clue: 'It goes in the blue recycling bin',
    fact: 'Clean paper and cardboard go in the blue recycling bin in Malaysia.',
  },
  {
    word: 'GLASS',
    clue: 'It goes in the brown recycling bin',
    fact: 'Glass bottles and jars go in the brown recycling bin, and can be recycled again and again.',
  },
  {
    word: 'POWER',
    clue: 'Another word for electricity',
    fact: 'Power stations that burn coal or gas give off carbon dioxide.',
  },
  {
    word: 'FUELS',
    clue: 'Coal, oil and gas are fossil ones',
    fact: 'Fossil fuels give off carbon dioxide when they are burned, which warms the planet.',
  },
  {
    word: 'ALGAE',
    clue: 'Tiny plant-like life in water',
    fact: 'Tiny algae in the sea make a lot of the oxygen we breathe.',
  },
  {
    word: 'SMOKE',
    clue: 'It rises from fires and causes haze',
    fact: 'Smoke from forest and peat fires causes the haze that sometimes covers Malaysia.',
  },
  {
    word: 'CROPS',
    clue: 'Plants that farmers grow for food',
    fact: 'Crops need the right rain and heat, so a changing climate affects farming.',
  },
  {
    word: 'PADDY',
    clue: 'A wet field where rice grows',
    fact: 'Paddy fields grow rice, Malaysia’s main food, and need plenty of water.',
  },
  {
    word: 'BEACH',
    clue: 'Where sea turtles lay their eggs',
    fact: 'Turtles nest on Malaysian beaches. Keeping beaches clean and dark at night helps them.',
  },
  {
    word: 'SEEDS',
    clue: 'New plants grow from these',
    fact: 'Many forest seeds are carried to new places by birds and other animals.',
  },
  {
    word: 'TREES',
    clue: 'They give shade and store carbon',
    fact: 'Trees give shade, clean the air and store carbon in their wood and roots.',
  },
  {
    word: 'CYCLE',
    clue: 'Ride a bike',
    fact: 'Cycling short trips makes no exhaust fumes, and it keeps you fit too.',
  },
  {
    word: 'LIGHT',
    clue: 'Switch it off when you leave the room',
    fact: 'Switch off lights when you leave a room. LED bulbs use much less electricity.',
  },
  {
    word: 'SHADE',
    clue: 'Cool cover from the sun under a tree',
    fact: 'Trees along streets give shade that keeps pavements and homes cooler.',
  },
  {
    word: 'TRAIN',
    clue: 'The MRT and LRT are these',
    fact: 'Trains carry many people at once, so each trip makes less pollution than driving.',
  },
];
