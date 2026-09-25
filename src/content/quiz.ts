export type QuizTopic = 'Climate science' | 'Energy' | 'Nature' | 'Everyday actions' | 'Waste';

export interface QuizQuestion {
  id: string;
  topic: QuizTopic;
  question: string;
  /** Exactly four options. */
  options: [string, string, string, string];
  /** Index into `options` of the correct answer. */
  answer: 0 | 1 | 2 | 3;
  /** Shown after answering, right or wrong. One or two sentences. */
  explain: string;
}

// Questions stick to well-established facts that won't go out of date quickly.
// See docs/CONTENT.md for the fact-checking rules.
export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'main-cause',
    topic: 'Climate science',
    question: 'What is the main cause of climate change today?',
    options: [
      'Burning fossil fuels like coal, oil and gas',
      'Changes in the Sun',
      'Volcanoes erupting',
      'The Moon moving closer',
    ],
    answer: 0,
    explain:
      'Burning fossil fuels releases carbon dioxide, which traps heat. Scientists agree human activity is the main driver.',
  },
  {
    id: 'main-ghg',
    topic: 'Climate science',
    question: 'Which greenhouse gas do human activities release the most of?',
    options: ['Oxygen', 'Carbon dioxide', 'Helium', 'Nitrogen'],
    answer: 1,
    explain:
      'Carbon dioxide (CO₂) from burning fossil fuels is the largest human-made greenhouse gas.',
  },
  {
    id: 'methane-source',
    topic: 'Climate science',
    question: 'Methane is a powerful greenhouse gas. Which of these releases a lot of it?',
    options: ['Solar panels', 'Cattle farming', 'Wind turbines', 'Bicycles'],
    answer: 1,
    explain:
      'Cows produce methane as they digest food. Landfills and leaks from gas and oil sites are other big sources.',
  },
  {
    id: 'greenhouse-effect',
    topic: 'Climate science',
    question: 'What does the greenhouse effect do?',
    options: [
      'Makes plants grow faster',
      'Traps heat near Earth’s surface',
      'Makes holes in clouds',
      'Cools the oceans',
    ],
    answer: 1,
    explain:
      'Greenhouse gases trap heat, which keeps Earth warm enough to live on. Adding more of them makes it warmer.',
  },
  {
    id: 'weather-vs-climate',
    topic: 'Climate science',
    question: 'What is the difference between weather and climate?',
    options: [
      'There is no difference',
      'Weather is day to day; climate is the pattern over many years',
      'Climate only means temperature',
      'Weather only happens in summer',
    ],
    answer: 1,
    explain:
      'Weather is what happens today. Climate is the average pattern over decades, usually 30 years or more.',
  },
  {
    id: 'sea-level',
    topic: 'Climate science',
    question: 'Why are sea levels rising?',
    options: [
      'More rain falls on the ocean',
      'Fish are growing bigger',
      'Land ice melts and warmer water expands',
      'Rivers are getting longer',
    ],
    answer: 2,
    explain:
      'Melting glaciers and ice sheets add water to the oceans, and water takes up more space as it warms.',
  },
  {
    id: 'paris',
    topic: 'Climate science',
    question: 'In the Paris Agreement, countries agreed to try to limit warming to…',
    options: ['1.5°C', '5°C', '10°C', '0.1°C'],
    answer: 0,
    explain:
      'The 2015 Paris Agreement aims to keep warming well below 2°C and to try to limit it to 1.5°C above pre-industrial levels.',
  },
  {
    id: 'extreme-weather',
    topic: 'Climate science',
    question: 'As the climate warms, what happens to heatwaves in many places?',
    options: [
      'They stop happening',
      'They become more frequent and intense',
      'They only happen at night',
      'Nothing changes',
    ],
    answer: 1,
    explain: 'A warmer climate makes heatwaves hotter and more common in many parts of the world.',
  },
  {
    id: 'renewable-which',
    topic: 'Energy',
    question: 'Which of these is a renewable energy source?',
    options: ['Coal', 'Natural gas', 'Sunlight', 'Diesel'],
    answer: 2,
    explain: 'Sunlight is naturally replenished every day. Coal, gas and diesel are fossil fuels.',
  },
  {
    id: 'solar-panel',
    topic: 'Energy',
    question: 'What does a solar panel turn sunlight into?',
    options: ['Water', 'Electricity', 'Wind', 'Oil'],
    answer: 1,
    explain: 'Solar panels turn sunlight directly into electricity, with no smoke or exhaust.',
  },
  {
    id: 'wind-turbine',
    topic: 'Energy',
    question: 'How does a wind turbine make electricity?',
    options: [
      'By burning wind',
      'Wind spins its blades, which turn a generator',
      'By storing clouds',
      'By cooling the air',
    ],
    answer: 1,
    explain: 'Moving air turns the blades, which spin a generator to make electricity.',
  },
  {
    id: 'hydro',
    topic: 'Energy',
    question: 'Hydropower makes electricity using…',
    options: ['Moving water', 'Burning wood', 'Volcano ash', 'Batteries'],
    answer: 0,
    explain: 'Hydropower uses flowing water, often from a river or dam, to turn turbines.',
  },
  {
    id: 'led',
    topic: 'Energy',
    question: 'Compared with an old-style incandescent bulb, an LED bulb…',
    options: [
      'Uses much less electricity',
      'Uses much more electricity',
      'Only works in daylight',
      'Needs petrol',
    ],
    answer: 0,
    explain:
      'LEDs use a fraction of the electricity for the same light and last many times longer.',
  },
  {
    id: 'standby',
    topic: 'Energy',
    question: 'Which is a simple way to save energy at home?',
    options: [
      'Leaving lights on in empty rooms',
      'Switching off devices at the plug when not in use',
      'Opening windows with the heating on',
      'Running a half-empty washing machine',
    ],
    answer: 1,
    explain: 'Many devices still use power on standby. Switching them off saves energy and money.',
  },
  {
    id: 'ev',
    topic: 'Energy',
    question: 'What powers an electric vehicle?',
    options: ['A petrol engine', 'A battery and electric motor', 'Steam', 'Pedals only'],
    answer: 1,
    explain:
      'EVs run on electricity stored in a battery and give off no exhaust fumes while driving.',
  },
  {
    id: 'forests',
    topic: 'Nature',
    question: 'How do trees help fight climate change?',
    options: [
      'They absorb carbon dioxide as they grow',
      'They make the Sun weaker',
      'They produce methane',
      'They melt ice',
    ],
    answer: 0,
    explain:
      'Trees take in CO₂ and store carbon in their wood, leaves and roots. That’s why protecting forests matters.',
  },
  {
    id: 'deforestation',
    topic: 'Nature',
    question: 'What happens when large areas of forest are cut down and burned?',
    options: [
      'Carbon stored in trees is released',
      'The air becomes cooler everywhere',
      'Rainfall always increases',
      'More animals find homes',
    ],
    answer: 0,
    explain:
      'Clearing and burning forests releases stored carbon and destroys habitats for wildlife.',
  },
  {
    id: 'biodiversity',
    topic: 'Nature',
    question: 'What does “biodiversity” mean?',
    options: [
      'The number of cars in a city',
      'The variety of all living things',
      'A type of plastic',
      'A weather forecast',
    ],
    answer: 1,
    explain:
      'Biodiversity is the variety of life: plants, animals, fungi and more. Healthy ecosystems need it.',
  },
  {
    id: 'bees',
    topic: 'Nature',
    question: 'Why are bees and other pollinators important?',
    options: [
      'They help many crops and flowers make fruit and seeds',
      'They make electricity',
      'They clean the oceans',
      'They stop the wind',
    ],
    answer: 0,
    explain: 'Pollinators carry pollen between flowers, helping many food crops grow.',
  },
  {
    id: 'ocean-sink',
    topic: 'Nature',
    question: 'Which of these absorbs a large share of the carbon dioxide we release?',
    options: ['The ocean', 'Car tyres', 'Clouds', 'Mountains of sand'],
    answer: 0,
    explain:
      'The ocean absorbs a large share of human CO₂, but this is making seawater more acidic, which harms sea life.',
  },
  {
    id: 'coral',
    topic: 'Nature',
    question: 'What happens to coral reefs when the sea gets too warm?',
    options: [
      'They can bleach and may die',
      'They grow twice as fast',
      'They turn into sand dunes',
      'Nothing at all',
    ],
    answer: 0,
    explain: 'Heat stress makes corals lose the tiny algae that feed them, turning them white.',
  },
  {
    id: 'travel',
    topic: 'Everyday actions',
    question: 'For a short trip to school, which choice has the smallest carbon footprint?',
    options: ['Walking or cycling', 'A petrol car', 'A taxi', 'A private jet'],
    answer: 0,
    explain: 'Walking and cycling give off no exhaust fumes and are good for your health too.',
  },
  {
    id: 'food-waste',
    topic: 'Everyday actions',
    question: 'Why does wasting food harm the climate?',
    options: [
      'Energy, water and land used to make it are wasted, and rotting food in landfill releases methane',
      'It doesn’t: food waste is harmless',
      'It makes fridges colder',
      'It creates more wind',
    ],
    answer: 0,
    explain: 'Planning meals and using leftovers cuts waste and saves money.',
  },
  {
    id: 'plant-based',
    topic: 'Everyday actions',
    question: 'Which food generally has a higher carbon footprint?',
    options: ['Beef', 'Beans', 'Lentils', 'Peas'],
    answer: 0,
    explain:
      'Beef usually needs far more land and produces much more greenhouse gas than beans, lentils or peas.',
  },
  {
    id: 'reusable-bottle',
    topic: 'Everyday actions',
    question: 'Which choice creates the least waste?',
    options: [
      'Refilling a reusable water bottle',
      'Buying a new plastic bottle each day',
      'Using paper cups',
      'Buying bottled water in bulk',
    ],
    answer: 0,
    explain:
      'Reusing beats recycling: a refillable bottle can replace hundreds of single-use ones.',
  },
  {
    id: 'three-rs',
    topic: 'Waste',
    question: 'In “Reduce, Reuse, Recycle”, which should you try first?',
    options: ['Reduce', 'Reuse', 'Recycle', 'They are all equal'],
    answer: 0,
    explain:
      'Not creating waste in the first place saves the most resources. Then reuse, and recycle last.',
  },
  {
    id: 'batteries',
    topic: 'Waste',
    question: 'Where should used batteries go?',
    options: [
      'In a special battery drop-off',
      'In the food waste bin',
      'Down the drain',
      'In the garden',
    ],
    answer: 0,
    explain:
      'Batteries can start fires in bin lorries and contain valuable materials that can be recovered.',
  },
  {
    id: 'compost',
    topic: 'Waste',
    question: 'What can composting food scraps produce?',
    options: ['Rich soil for plants', 'Plastic', 'Petrol', 'Glass'],
    answer: 0,
    explain: 'Compost returns nutrients to the soil and keeps food out of landfill.',
  },
  {
    id: 'aluminium',
    topic: 'Waste',
    question: 'How many times can an aluminium can be recycled?',
    options: ['Once', 'Twice', 'Over and over again', 'Never'],
    answer: 2,
    explain: 'Aluminium can be recycled again and again without losing quality.',
  },
  {
    id: 'plastic-ocean',
    topic: 'Waste',
    question: 'Why is plastic litter a problem in the ocean?',
    options: [
      'Animals can eat it or get tangled in it',
      'It makes the water too sweet',
      'It helps fish grow',
      'It quickly turns into sand',
    ],
    answer: 0,
    explain:
      'Plastic breaks into tiny pieces but lasts a very long time, harming wildlife along the way.',
  },
];
