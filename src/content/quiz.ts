import type { IconName } from '../ui/icons';

export type QuizTopicId =
  | 'climate'
  | 'weather'
  | 'energy'
  | 'transport'
  | 'nature'
  | 'oceans'
  | 'waste'
  | 'food'
  | 'living'
  | 'malaysia';

export interface QuizTopic {
  id: QuizTopicId;
  label: string;
  icon: IconName;
}

/** Topics players can pick on the quiz start screen, in display order. */
export const QUIZ_TOPICS: readonly QuizTopic[] = [
  { id: 'climate', label: 'Climate science', icon: 'thermometer' },
  { id: 'weather', label: 'Weather & haze', icon: 'cloudRain' },
  { id: 'energy', label: 'Energy', icon: 'zap' },
  { id: 'transport', label: 'Getting around', icon: 'trainFront' },
  { id: 'nature', label: 'Forests & wildlife', icon: 'trees' },
  { id: 'oceans', label: 'Seas & coasts', icon: 'waves' },
  { id: 'waste', label: 'Waste & recycling', icon: 'recycle' },
  { id: 'food', label: 'Food & water', icon: 'salad' },
  { id: 'living', label: 'Green living', icon: 'house' },
  { id: 'malaysia', label: 'Malaysia’s climate action', icon: 'globe' },
];

export interface QuizQuestion {
  id: string;
  topic: QuizTopicId;
  question: string;
  /** Exactly four options. */
  options: [string, string, string, string];
  /** Index into `options` of the correct answer. */
  answer: 0 | 1 | 2 | 3;
  /** Shown after answering, right or wrong. One or two sentences. */
  explain: string;
}

// Questions are set in Malaysia and stick to well-established facts that won't go out
// of date quickly. See docs/CONTENT.md for the fact-checking rules.
export const QUESTIONS: readonly QuizQuestion[] = [
  // ---------- Climate science ----------
  {
    id: 'main-cause',
    topic: 'climate',
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
    topic: 'climate',
    question: 'Which greenhouse gas do human activities release the most of?',
    options: ['Oxygen', 'Carbon dioxide', 'Helium', 'Nitrogen'],
    answer: 1,
    explain:
      'Carbon dioxide (CO₂) from burning fossil fuels is the largest human-made greenhouse gas.',
  },
  {
    id: 'methane-source',
    topic: 'climate',
    question: 'Methane is a powerful greenhouse gas. Which of these releases a lot of it?',
    options: ['Solar panels', 'Rotting rubbish in landfills', 'Wind turbines', 'Bicycles'],
    answer: 1,
    explain:
      'Food and other waste rotting in landfills gives off methane. Farm animals and gas leaks are other big sources.',
  },
  {
    id: 'greenhouse-effect',
    topic: 'climate',
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
    topic: 'climate',
    question: 'What is the difference between weather and climate?',
    options: [
      'There is no difference',
      'Weather is day to day; climate is the pattern over many years',
      'Climate only means temperature',
      'Weather only happens during the monsoon',
    ],
    answer: 1,
    explain:
      'Weather is today’s rain or sunshine. Climate is the average pattern over decades, usually 30 years or more.',
  },
  {
    id: 'sea-level',
    topic: 'climate',
    question: 'Why are sea levels rising?',
    options: [
      'More rain falls on the ocean',
      'Fish are growing bigger',
      'Land ice melts and warmer water expands',
      'Rivers are getting longer',
    ],
    answer: 2,
    explain:
      'Melting glaciers and ice sheets add water to the oceans, and water takes up more space as it warms. Low-lying coasts are most at risk.',
  },
  {
    id: 'paris',
    topic: 'climate',
    question: 'In the Paris Agreement, countries agreed to try to limit warming to…',
    options: ['1.5°C', '5°C', '10°C', '0.1°C'],
    answer: 0,
    explain:
      'The 2015 Paris Agreement aims to keep warming well below 2°C and to try to limit it to 1.5°C above pre-industrial levels.',
  },
  {
    id: 'heavy-rain',
    topic: 'climate',
    question: 'As the climate warms, what is expected to happen to very heavy rainstorms?',
    options: [
      'They become more intense',
      'They stop completely',
      'They only fall at night',
      'They turn into snow',
    ],
    answer: 0,
    explain:
      'Warmer air holds more water, so downpours can get heavier. That raises the risk of floods in places like Malaysia.',
  },

  // ---------- Weather & haze ----------
  {
    id: 'monsoon-floods',
    topic: 'weather',
    question:
      'Which season often brings heavy rain and floods to the east coast of Peninsular Malaysia?',
    options: [
      'The northeast monsoon, around November to March',
      'The southwest monsoon, around June to September',
      'Only the week of Hari Raya',
      'Malaysia has no rainy season',
    ],
    answer: 0,
    explain:
      'The northeast monsoon brings heavy rain to states such as Kelantan, Terengganu and Pahang. Floods are common in these months.',
  },
  {
    id: 'haze-cause',
    topic: 'weather',
    question: 'What usually causes the haze that sometimes covers Malaysia?',
    options: [
      'Smoke from forest and peatland fires in the region',
      'Sea spray from the beach',
      'Too many rain clouds',
      'Steam from cooking',
    ],
    answer: 0,
    explain:
      'Haze is mostly smoke from forest and peat fires, often in the dry months. Wind can carry it across borders.',
  },
  {
    id: 'api',
    topic: 'weather',
    question: 'On a hazy day, which reading tells you how clean the air is?',
    options: [
      'The Air Pollutant Index (API)',
      'The tide table',
      'The rainfall gauge',
      'The shoe size chart',
    ],
    answer: 0,
    explain:
      'The Department of Environment publishes API readings. When the API is high, stay indoors more and skip outdoor sport.',
  },
  {
    id: 'peat-fire',
    topic: 'weather',
    question: 'Why are peat swamp fires so hard to put out?',
    options: [
      'Fire can smoulder underground in the dry peat',
      'Peat is made of rock',
      'Peat fires only happen underwater',
      'Rain makes peat burn faster',
    ],
    answer: 0,
    explain:
      'Peat is packed with old plant matter. When it is drained and dry, fire can creep underground for weeks, releasing smoke and carbon.',
  },
  {
    id: 'flash-flood',
    topic: 'weather',
    question: 'In a city, what can make a flash flood worse after a heavy downpour?',
    options: ['Drains blocked by rubbish', 'Parks full of trees', 'Rainbows', 'Cool weather'],
    answer: 0,
    explain:
      'Litter clogs drains, so rainwater can’t flow away. Clear drains and green spaces that soak up rain both help.',
  },
  {
    id: 'smart-tunnel',
    topic: 'weather',
    question: 'Kuala Lumpur’s SMART Tunnel has two jobs. What are they?',
    options: [
      'A road for cars and a channel for floodwater',
      'A train line and a shopping mall',
      'A water park and a car park',
      'A zoo and a museum',
    ],
    answer: 0,
    explain:
      'Most days, cars drive through it. In big storms it can be closed to traffic and used to carry floodwater away from the city centre.',
  },
  {
    id: 'urban-heat',
    topic: 'weather',
    question: 'Why is a city centre often hotter than the countryside nearby?',
    options: [
      'Concrete and roads soak up heat, and there are fewer trees',
      'Cities are closer to the Sun',
      'Tall buildings make their own sunshine',
      'Traffic lights give off heat',
    ],
    answer: 0,
    explain:
      'This is called the urban heat island effect. Trees, parks and light-coloured roofs help cool cities down.',
  },
  {
    id: 'heat-safety',
    topic: 'weather',
    question: 'What is a sensible way to stay safe on a very hot day?',
    options: [
      'Drink water often and rest in the shade',
      'Play football at midday',
      'Wear thick, dark clothes',
      'Stop drinking water',
    ],
    answer: 0,
    explain:
      'Hot spells are becoming more common as the climate warms. Drink water and avoid the hottest part of the day.',
  },

  // ---------- Energy ----------
  {
    id: 'renewable-which',
    topic: 'energy',
    question: 'Which of these is a renewable energy source?',
    options: ['Coal', 'Natural gas', 'Sunlight', 'Diesel'],
    answer: 2,
    explain: 'Sunlight is naturally replenished every day. Coal, gas and diesel are fossil fuels.',
  },
  {
    id: 'solar-malaysia',
    topic: 'energy',
    question: 'Why is solar power a good fit for Malaysia?',
    options: [
      'It is sunny all year round near the equator',
      'It snows every winter',
      'The Sun never sets in Malaysia',
      'Solar panels work best in the dark',
    ],
    answer: 0,
    explain:
      'Being close to the equator, Malaysia gets strong sunshine all year. Rooftop panels can power homes, schools and factories.',
  },
  {
    id: 'hydro-sarawak',
    topic: 'energy',
    question: 'Large dams in Sarawak, such as Bakun, make electricity from what?',
    options: ['Flowing water', 'Burning coal', 'Wind', 'Volcano heat'],
    answer: 0,
    explain:
      'Hydropower spins turbines with flowing water and releases far less CO₂ than coal. Big dams also change rivers and forests, so they need careful planning.',
  },
  {
    id: 'star-rating',
    topic: 'energy',
    question: 'On a Malaysian energy label for appliances, what do more stars mean?',
    options: ['It uses less electricity', 'It costs more to run', 'It is louder', 'It is older'],
    answer: 0,
    explain:
      'Energy labels rate appliances such as air conditioners and fridges. More stars means more efficient, which saves money and emissions.',
  },
  {
    id: 'aircon-24',
    topic: 'energy',
    question: 'Which air-conditioner setting saves energy while keeping you comfortable?',
    options: ['24°C or a little warmer', '16°C', 'As cold as it goes', 'On all day, even when out'],
    answer: 0,
    explain:
      'Every degree cooler makes an air conditioner work harder. Around 24°C, with a fan, saves a lot of electricity.',
  },
  {
    id: 'led',
    topic: 'energy',
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
    topic: 'energy',
    question: 'Which is a simple way to save energy at home?',
    options: [
      'Leaving the TV on in an empty room',
      'Switching off devices at the plug when not in use',
      'Opening windows with the air-con on',
      'Charging phones all night, every night',
    ],
    answer: 1,
    explain: 'Many devices still use power on standby. Switching them off saves energy and money.',
  },
  {
    id: 'solar-spare',
    topic: 'energy',
    question:
      'What can a home with rooftop solar panels do with electricity it doesn’t use straight away?',
    options: [
      'Send it into the grid for others to use',
      'Nothing, it disappears',
      'Turn it into petrol',
      'Keep it in the fridge',
    ],
    answer: 0,
    explain:
      'Spare solar power can flow into the grid. Malaysian schemes let solar homes earn credit for the clean power they share.',
  },

  // ---------- Getting around ----------
  {
    id: 'travel',
    topic: 'transport',
    question: 'For a short trip to school, which choice has the smallest carbon footprint?',
    options: ['Walking or cycling', 'A petrol car', 'A taxi', 'A helicopter'],
    answer: 0,
    explain: 'Walking and cycling give off no exhaust fumes and are good for your health too.',
  },
  {
    id: 'mrt',
    topic: 'transport',
    question: 'Why is a full MRT or LRT train better for the air than lots of cars?',
    options: [
      'One electric train carries hundreds of people',
      'Trains never need any energy',
      'Cars are made of paper',
      'Trains only run at night',
    ],
    answer: 0,
    explain:
      'One train can replace hundreds of car trips, and electric trains give off no exhaust fumes on the street.',
  },
  {
    id: 'carpool',
    topic: 'transport',
    question: 'Four friends are going to the same place. What is the greener choice?',
    options: ['Share one car', 'Drive four cars', 'Take four taxis', 'Drive the long way round'],
    answer: 0,
    explain:
      'Carpooling shares one car’s fuel and emissions between everyone, and it means fewer traffic jams.',
  },
  {
    id: 'ev',
    topic: 'transport',
    question: 'What powers an electric vehicle?',
    options: ['A petrol engine', 'A battery and electric motor', 'Steam', 'Pedals only'],
    answer: 1,
    explain:
      'EVs run on electricity stored in a battery and give off no exhaust fumes while driving.',
  },
  {
    id: 'ev-grid',
    topic: 'transport',
    question: 'An electric car gets even cleaner over time when…',
    options: [
      'more of the electricity comes from sun and water power',
      'it is painted green',
      'it drives faster',
      'its tyres get bigger',
    ],
    answer: 0,
    explain:
      'An EV is only as clean as the electricity that charges it. As more power comes from renewables, its emissions keep falling.',
  },
  {
    id: 'idling',
    topic: 'transport',
    question: 'While waiting outside school to pick someone up, what should a driver do?',
    options: [
      'Switch off the engine',
      'Keep the engine running for the air-con',
      'Rev the engine',
      'Drive around the block again and again',
    ],
    answer: 0,
    explain:
      'An idling engine burns fuel and pollutes the air while going nowhere. Switching off saves fuel and keeps the air cleaner.',
  },
  {
    id: 'tyres',
    topic: 'transport',
    question: 'Which of these helps a car use less petrol?',
    options: [
      'Keeping the tyres properly pumped up',
      'Carrying heavy things you don’t need',
      'Speeding on the highway',
      'Braking hard all the time',
    ],
    answer: 0,
    explain:
      'Soft tyres and extra weight make the engine work harder. Smooth, steady driving saves fuel too.',
  },
  {
    id: 'bus-lane',
    topic: 'transport',
    question: 'Why do some cities give buses their own lanes?',
    options: [
      'So buses move faster and more people choose them over cars',
      'So buses can park anywhere',
      'Because buses are too wide for roads',
      'So cars can go even faster',
    ],
    answer: 0,
    explain:
      'When buses skip the traffic jams, public transport becomes quicker and more people leave their cars at home.',
  },

  // ---------- Forests & wildlife ----------
  {
    id: 'forests',
    topic: 'nature',
    question: 'How do trees help fight climate change?',
    options: [
      'They absorb carbon dioxide as they grow',
      'They make the Sun weaker',
      'They produce methane',
      'They melt ice',
    ],
    answer: 0,
    explain:
      'Trees take in CO₂ and store carbon in their wood, leaves and roots. That’s why protecting Malaysia’s rainforests matters.',
  },
  {
    id: 'megadiverse',
    topic: 'nature',
    question: 'Malaysia is called a “megadiverse” country. What does that mean?',
    options: [
      'It is home to a huge variety of plants and animals',
      'It has the most shopping malls',
      'It has the tallest buildings',
      'It has the most cars',
    ],
    answer: 0,
    explain:
      'Malaysia is one of a small group of countries that hold a large share of the world’s species. Protecting forests protects this variety.',
  },
  {
    id: 'tiger',
    topic: 'nature',
    question: 'Which big cat is Malaysia’s national animal, and critically endangered?',
    options: ['The Malayan tiger', 'The lion', 'The cheetah', 'The snow leopard'],
    answer: 0,
    explain:
      'Very few Malayan tigers are left in the wild. Poaching and the loss of forest are the biggest threats.',
  },
  {
    id: 'orangutan',
    topic: 'nature',
    question: 'Where do wild orangutans live in Malaysia?',
    options: [
      'In the rainforests of Sabah and Sarawak',
      'On the tea farms of Cameron Highlands',
      'On the islands of Langkawi',
      'Only in zoos',
    ],
    answer: 0,
    explain:
      'Orangutans live in Borneo’s rainforests. They need large, connected forests, so protecting their habitat is key.',
  },
  {
    id: 'hornbill',
    topic: 'nature',
    question: 'Sarawak is called the “Land of the Hornbills”. What is a hornbill?',
    options: [
      'A large bird with a big curved beak',
      'A type of longboat',
      'A mountain peak',
      'A traditional drum',
    ],
    answer: 0,
    explain:
      'Hornbills spread seeds as they eat fruit, helping forests grow. They need big old trees to nest in.',
  },
  {
    id: 'rhino',
    topic: 'nature',
    question: 'Which animal was declared extinct in Malaysia after the last one died in 2019?',
    options: ['The Sumatran rhinoceros', 'The Malayan tapir', 'The Asian elephant', 'The sun bear'],
    answer: 0,
    explain:
      'Hunting and habitat loss wiped out Malaysia’s Sumatran rhinos. It shows why protecting wildlife early matters.',
  },
  {
    id: 'rafflesia',
    topic: 'nature',
    question: 'Rafflesia, found in Malaysia’s rainforests, is famous for what?',
    options: [
      'Having one of the largest flowers in the world',
      'Being the tallest tree on Earth',
      'Growing on coral reefs',
      'Being a kind of fruit bat',
    ],
    answer: 0,
    explain:
      'Rafflesia has no leaves or stem of its own and grows on a forest vine. It needs healthy rainforest to survive.',
  },
  {
    id: 'durian-bats',
    topic: 'nature',
    question: 'Which animals help pollinate durian flowers at night?',
    options: ['Bats', 'Fish', 'Crocodiles', 'Tigers'],
    answer: 0,
    explain:
      'Nectar-feeding bats visit durian flowers after dark. Without them, there would be far fewer durians!',
  },
  {
    id: 'deforestation',
    topic: 'nature',
    question: 'What happens when large areas of forest are cut down and burned?',
    options: [
      'Carbon stored in the trees is released',
      'The air becomes cooler everywhere',
      'Rainfall always increases',
      'More animals find homes',
    ],
    answer: 0,
    explain: 'Clearing and burning forests releases stored carbon and destroys homes for wildlife.',
  },
  {
    id: 'mspo',
    topic: 'nature',
    question: 'What does the MSPO label on palm oil show?',
    options: [
      'It meets Malaysia’s sustainable palm oil standard',
      'It was made in outer space',
      'It has extra sugar added',
      'It is a type of petrol',
    ],
    answer: 0,
    explain:
      'MSPO stands for Malaysian Sustainable Palm Oil. Certified growers must follow rules that protect forests, wildlife and workers.',
  },
  {
    id: 'unesco-parks',
    topic: 'nature',
    question: 'Kinabalu Park in Sabah and Gunung Mulu National Park in Sarawak are both…',
    options: ['UNESCO World Heritage Sites', 'Theme parks', 'Oil fields', 'Airports'],
    answer: 0,
    explain:
      'They are protected for their amazing plants, animals and landscapes. Mulu has some of the biggest caves in the world.',
  },

  // ---------- Seas & coasts ----------
  {
    id: 'ocean-sink',
    topic: 'oceans',
    question: 'Which of these absorbs a large share of the carbon dioxide we release?',
    options: ['The ocean', 'Car tyres', 'Clouds', 'Mountains of sand'],
    answer: 0,
    explain:
      'The ocean absorbs a large share of human CO₂, but this is making seawater more acidic, which harms sea life.',
  },
  {
    id: 'coral',
    topic: 'oceans',
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
    id: 'coral-triangle',
    topic: 'oceans',
    question: 'The seas off Sabah are part of the Coral Triangle. Why is it special?',
    options: [
      'It has one of the richest varieties of sea life on Earth',
      'It is a triangle-shaped island',
      'Its water is fresh, not salty',
      'No fish live there',
    ],
    answer: 0,
    explain:
      'The Coral Triangle is a world hotspot for corals, reef fish and turtles. Marine parks help protect it.',
  },
  {
    id: 'mangroves',
    topic: 'oceans',
    question: 'How do mangrove forests help coastal towns?',
    options: [
      'They slow down waves and stop the shore washing away',
      'They make the sea saltier',
      'They attract sharks to beaches',
      'They block out the sun',
    ],
    answer: 0,
    explain:
      'Mangrove roots calm waves and hold mud in place. They also shelter young fish and store lots of carbon.',
  },
  {
    id: 'matang',
    topic: 'oceans',
    question: 'The Matang forest reserve in Perak is famous for which kind of forest?',
    options: ['Mangrove forest', 'Pine forest', 'Bamboo forest', 'Cactus forest'],
    answer: 0,
    explain:
      'Matang is one of the world’s best-known managed mangrove forests. It has been carefully looked after for more than a century.',
  },
  {
    id: 'fireflies',
    topic: 'oceans',
    question: 'The fireflies of Kuala Selangor gather along the river at night. What do they need?',
    options: [
      'Healthy mangrove trees on the riverbank',
      'Bright street lights',
      'Polluted water',
      'Fewer trees',
    ],
    answer: 0,
    explain:
      'The fireflies gather on riverside mangrove trees. Clearing trees, pollution and bright lights all threaten them.',
  },
  {
    id: 'turtles',
    topic: 'oceans',
    question: 'How can you help the sea turtles that nest on Malaysian beaches?',
    options: [
      'Never buy turtle eggs, and keep beaches free of litter',
      'Take eggs home as souvenirs',
      'Shine torches at nesting turtles',
      'Leave plastic bags on the sand',
    ],
    answer: 0,
    explain:
      'Turtles face egg collection, plastic and bright lights. Protecting eggs and nesting beaches gives hatchlings a chance.',
  },
  {
    id: 'plastic-ocean',
    topic: 'oceans',
    question: 'Why is plastic litter a problem in the sea?',
    options: [
      'Animals can eat it or get tangled in it',
      'It makes the water sweet',
      'It helps fish grow',
      'It quickly turns into sand',
    ],
    answer: 0,
    explain:
      'Plastic breaks into tiny pieces but lasts a very long time, harming turtles, fish and seabirds along the way.',
  },

  // ---------- Waste & recycling ----------
  {
    id: 'three-rs',
    topic: 'waste',
    question: 'In “Reduce, Reuse, Recycle”, which should you try first?',
    options: ['Reduce', 'Reuse', 'Recycle', 'They are all equal'],
    answer: 0,
    explain:
      'Not creating waste in the first place saves the most resources. Then reuse, and recycle last.',
  },
  {
    id: 'separation',
    topic: 'waste',
    question:
      'In many parts of Malaysia, households must separate recyclables from other rubbish. What is this called?',
    options: ['Separation at source', 'Open burning', 'Landfilling', 'Littering'],
    answer: 0,
    explain:
      'Sorting waste at home keeps recyclables clean so they can be made into new things. It became compulsory in several states in 2015.',
  },
  {
    id: 'bin-blue',
    topic: 'waste',
    question: 'At a Malaysian recycling station, which bin colour is for paper?',
    options: ['Blue', 'Brown', 'Orange', 'Red'],
    answer: 0,
    explain: 'Blue is for paper, orange is for plastic and metal cans, and brown is for glass.',
  },
  {
    id: 'bin-orange',
    topic: 'waste',
    question: 'Where does an empty drink can go at a Malaysian recycling station?',
    options: ['The orange bin', 'The blue bin', 'The brown bin', 'Into the drain'],
    answer: 0,
    explain:
      'Orange bins take plastic and metal like aluminium cans. Rinse them first so they recycle cleanly.',
  },
  {
    id: 'batteries',
    topic: 'waste',
    question: 'Where should used batteries go?',
    options: [
      'In the general rubbish',
      'An e-waste or battery collection point',
      'In the drain',
      'With the food waste',
    ],
    answer: 1,
    explain:
      'Batteries contain harmful chemicals and can start fires in rubbish lorries. Take them to an e-waste collection point.',
  },
  {
    id: 'compost',
    topic: 'waste',
    question: 'What can composting food scraps produce?',
    options: ['Rich soil for plants', 'Plastic', 'Petrol', 'Glass'],
    answer: 0,
    explain: 'Compost returns nutrients to the soil and keeps food out of landfill.',
  },
  {
    id: 'aluminium',
    topic: 'waste',
    question: 'How many times can an aluminium can be recycled?',
    options: ['Once', 'Twice', 'Over and over again', 'Never'],
    answer: 2,
    explain: 'Aluminium can be recycled again and again without losing quality.',
  },
  {
    id: 'tapau',
    topic: 'waste',
    question: 'What is the greenest way to tapau your lunch?',
    options: [
      'Bring your own reusable container',
      'Ask for extra plastic bags',
      'Use two polystyrene boxes',
      'Get a new straw for every drink',
    ],
    answer: 0,
    explain:
      'Polystyrene boxes are rarely recycled and often end up in rivers. Your own container can be used again and again.',
  },
  {
    id: 'plastic-bags',
    topic: 'waste',
    question: 'Why do many shops in Malaysia charge for plastic bags?',
    options: [
      'To encourage people to bring reusable bags',
      'Because plastic bags are made of gold',
      'To make the bags stronger',
      'So shops can give out more bags',
    ],
    answer: 0,
    explain: 'A small charge reminds shoppers to bring their own bags, which cuts plastic waste.',
  },
  {
    id: 'e-waste',
    topic: 'waste',
    question: 'Why should old phones and chargers not go in the normal bin?',
    options: [
      'They contain valuable metals and harmful substances',
      'They are too light to throw away',
      'Rubbish lorries cannot lift them',
      'They turn into compost',
    ],
    answer: 0,
    explain:
      'E-waste can leak harmful chemicals, and recycling it recovers metals like copper and gold. Use an e-waste collection point.',
  },

  // ---------- Food & water ----------
  {
    id: 'food-waste',
    topic: 'food',
    question: 'Why does wasting food harm the climate?',
    options: [
      'The energy, water and land used to grow it are wasted, and rotting food makes methane',
      'It doesn’t: food waste is harmless',
      'It makes fridges colder',
      'It creates more wind',
    ],
    answer: 0,
    explain:
      'Food is one of the biggest parts of household rubbish in Malaysia. Buying only what you need saves money too.',
  },
  {
    id: 'plant-based',
    topic: 'food',
    question: 'Which food generally has a higher carbon footprint?',
    options: ['Beef', 'Tempeh', 'Lentils (dhal)', 'Vegetables'],
    answer: 0,
    explain:
      'Beef usually needs far more land and produces much more greenhouse gas than tempeh, dhal or vegetables.',
  },
  {
    id: 'local-fruit',
    topic: 'food',
    question: 'Why can local fruit like rambutan and mangosteen be a greener choice?',
    options: [
      'It doesn’t have to travel far to reach you',
      'It always comes wrapped in plastic',
      'It is grown in cold greenhouses abroad',
      'It is heavier than other fruit',
    ],
    answer: 0,
    explain:
      'Fruit flown in from far away can have a bigger footprint. Local, in-season fruit is fresh and travels less.',
  },
  {
    id: 'buffet',
    topic: 'food',
    question: 'At a buffet or kenduri, how can you cut food waste?',
    options: [
      'Take small portions and go back if still hungry',
      'Pile your plate as high as possible',
      'Take one bite of everything and leave the rest',
      'Take extra to throw away later',
    ],
    answer: 0,
    explain:
      'Food gets wasted when plates are overloaded. Taking a little at a time means more of it gets eaten.',
  },
  {
    id: 'leftovers',
    topic: 'food',
    question: 'You can’t finish your nasi lemak at a restaurant. What is the greenest choice?',
    options: [
      'Take the leftovers home in your own container',
      'Leave it on the table',
      'Order another plate',
      'Throw it in the drain',
    ],
    answer: 0,
    explain:
      'Eating leftovers later means less food waste, and your own container avoids a polystyrene box.',
  },
  {
    id: 'tap-off',
    topic: 'food',
    question: 'How can you save water while brushing your teeth?',
    options: [
      'Turn off the tap',
      'Leave the tap running',
      'Use a hose',
      'Brush in the shower for ages',
    ],
    answer: 0,
    explain:
      'A running tap wastes clean water every minute. Cleaning and pumping tap water uses energy too.',
  },
  {
    id: 'rainwater',
    topic: 'food',
    question: 'What is rainwater harvesting?',
    options: [
      'Collecting rain to use for things like watering plants',
      'Selling rain clouds',
      'Drinking water straight from drains',
      'Stopping rain from falling',
    ],
    answer: 0,
    explain:
      'Malaysia gets lots of rain. Storing it in tanks for washing and gardening saves treated tap water.',
  },
  {
    id: 'river-litter',
    topic: 'food',
    question: 'Where does litter dropped into a drain often end up?',
    options: ['In rivers and the sea', 'It disappears', 'In outer space', 'Back at the shop'],
    answer: 0,
    explain:
      'Drains flow into rivers, and rivers carry rubbish to the sea. Rubbish traps on rivers help, but not littering is best.',
  },

  // ---------- Green living ----------
  {
    id: 'tumbler',
    topic: 'living',
    question: 'Buying teh tarik to take away, which choice creates the least waste?',
    options: [
      'Bring your own tumbler',
      'A plastic bag with a straw',
      'A plastic cup inside a plastic bag',
      'Two plastic cups, just in case',
    ],
    answer: 0,
    explain:
      'A reusable tumbler can be used thousands of times, replacing lots of single-use cups, bags and straws.',
  },
  {
    id: 'lights-off',
    topic: 'living',
    question: 'What should you do when you leave a room?',
    options: [
      'Switch off the lights and the fan',
      'Leave everything on for when you come back',
      'Turn the air-con colder',
      'Open the fridge',
    ],
    answer: 0,
    explain:
      'Lights and fans in empty rooms waste electricity. Switching off is the easiest saving there is.',
  },
  {
    id: 'repair',
    topic: 'living',
    question: 'The strap on your school bag breaks. What is the most sustainable first step?',
    options: [
      'Try to repair it',
      'Throw it away and buy a new one',
      'Buy three new bags',
      'Burn it',
    ],
    answer: 0,
    explain:
      'Repairing keeps things in use and saves the energy and materials needed to make new ones.',
  },
  {
    id: 'shade-trees',
    topic: 'living',
    question: 'Planting trees around a house can…',
    options: [
      'keep it cooler, so the air-con is needed less',
      'make the house hotter',
      'block the Wi-Fi',
      'make it rain indoors',
    ],
    answer: 0,
    explain:
      'Trees shade walls and roofs and cool the air around them, which saves electricity for cooling.',
  },
  {
    id: 'sun-dry',
    topic: 'living',
    question: 'What is the greenest way to dry clothes in Malaysia?',
    options: [
      'Hang them out in the sun',
      'Use a tumble dryer every time',
      'Iron them while wet',
      'Put them in the fridge',
    ],
    answer: 0,
    explain: 'Malaysia’s sunshine and breeze dry clothes for free, with no electricity at all.',
  },
  {
    id: 'fridge-door',
    topic: 'living',
    question: 'Why shouldn’t you keep the fridge door open for long?',
    options: [
      'Cold air escapes and the fridge uses more electricity',
      'The food gets bored',
      'The light bulb will melt',
      'It makes the fridge smaller',
    ],
    answer: 0,
    explain:
      'Every time warm air gets in, the fridge must work harder to cool down again. Decide what you want before opening it.',
  },
  {
    id: 'gotong-royong',
    topic: 'living',
    question: 'A gotong-royong to clean up a local river is an example of…',
    options: [
      'Community action for the environment',
      'A shopping festival',
      'A car race',
      'A cooking contest',
    ],
    answer: 0,
    explain:
      'Gotong-royong means working together. Community clean-ups keep litter out of rivers and the sea.',
  },
  {
    id: 'reusable-bottle',
    topic: 'living',
    question: 'Which choice creates the least waste on a school trip?',
    options: [
      'A refillable water bottle',
      'A new plastic bottle every hour',
      'Drinks in polystyrene cups',
      'Juice boxes with straws',
    ],
    answer: 0,
    explain: 'A refillable bottle can replace hundreds of single-use bottles.',
  },

  // ---------- Malaysia's climate action ----------
  {
    id: 'net-zero-2050',
    topic: 'malaysia',
    question: 'Malaysia aims to reach net-zero greenhouse gas emissions as early as which year?',
    options: ['2050', '2020', '2200', '1990'],
    answer: 0,
    explain:
      'Net zero means cutting emissions as much as possible and balancing the rest, for example by protecting forests.',
  },
  {
    id: 'mgtc',
    topic: 'malaysia',
    question: 'EcoGames is made by MGTC. What does MGTC stand for?',
    options: [
      'Malaysian Green Technology and Climate Change Corporation',
      'Malaysian Games and Toys Company',
      'Main Garden and Tree Club',
      'Modern Green Transport Centre',
    ],
    answer: 0,
    explain: 'MGTC helps Malaysia grow green technology and take action on climate change.',
  },
  {
    id: 'myhijau',
    topic: 'malaysia',
    question: 'What does the MyHIJAU mark on a product tell you?',
    options: [
      'It is recognised as a greener choice',
      'It is the most expensive option',
      'It was made overseas',
      'It is coloured green',
    ],
    answer: 0,
    explain:
      'MyHIJAU is Malaysia’s mark for green products and services, managed by MGTC. It helps shoppers pick greener options.',
  },
  {
    id: 'lccf',
    topic: 'malaysia',
    question: 'The Low Carbon Cities Framework helps Malaysian towns and cities…',
    options: [
      'plan ways to cut their carbon emissions',
      'build more car parks',
      'cut down more trees',
      'make more rubbish',
    ],
    answer: 0,
    explain:
      'Cities using it look at energy, transport, waste and green spaces, then work to lower their emissions.',
  },
  {
    id: 'paris-malaysia',
    topic: 'malaysia',
    question: 'Malaysia has joined which global agreement to tackle climate change?',
    options: [
      'The Paris Agreement',
      'The Olympic Charter',
      'The FIFA World Cup rules',
      'The Space Treaty',
    ],
    answer: 0,
    explain:
      'Under the Paris Agreement, each country sets its own plan to cut emissions and reports its progress.',
  },
  {
    id: 'forest-pledge',
    topic: 'malaysia',
    question:
      'At the 1992 Earth Summit, Malaysia pledged to keep how much of its land under forest?',
    options: ['At least half', 'A tenth', 'None of it', 'A hundredth'],
    answer: 0,
    explain:
      'Keeping forests standing protects wildlife, water supplies and the carbon stored in trees.',
  },
  {
    id: 'gbi',
    topic: 'malaysia',
    question: 'Green building ratings in Malaysia, such as the GBI, reward buildings that…',
    options: [
      'use less energy and water',
      'are the tallest in town',
      'have the most car parks',
      'use the most air-con',
    ],
    answer: 0,
    explain:
      'Green buildings use shading, efficient cooling, solar power and water saving to cut their footprint.',
  },
  {
    id: 'solar-farms',
    topic: 'malaysia',
    question: 'Malaysia’s Large Scale Solar programme builds…',
    options: [
      'big solar farms that feed the national grid',
      'giant mirrors to cool the Sun',
      'larger petrol stations',
      'bigger coal power stations',
    ],
    answer: 0,
    explain:
      'Solar farms turn sunlight into electricity for many homes, cutting the need for fossil fuels.',
  },
];
