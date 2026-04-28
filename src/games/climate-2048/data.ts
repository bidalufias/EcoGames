// Climate 2048 — single-technology progressions. Each track is 12 stages
// from raw component (value 2) to a Net-Zero deployment (value 4096),
// representing how that technology scales from manufacturing to a fully
// integrated climate solution.

export interface Stage {
  value: number;
  emoji: string;
  name: string;
  fact: string;
}

export interface TechTrack {
  id: string;
  name: string;
  short: string;
  emoji: string;
  accent: string; // primary brand color for HUD chrome
  available: boolean;
  description: string;
  stages: Stage[]; // 12 stages, value 2 → 4096
}

const SOLAR: TechTrack = {
  id: 'solar',
  name: 'Solar Power',
  short: 'Solar',
  emoji: '☀️',
  accent: '#F59E0B',
  available: true,
  description: 'Build a solar fleet from a single silicon wafer to a Net-Zero grid.',
  stages: [
    { value: 2,    emoji: '⬜',  name: 'Silicon Wafer',     fact: 'A 0.2 mm slice of purified silicon — the seed of every solar cell.' },
    { value: 4,    emoji: '🔶',  name: 'Photovoltaic Cell', fact: 'A doped wafer that converts sunlight straight into electricity.' },
    { value: 8,    emoji: '🟦',  name: 'Solar Panel',       fact: '60–72 cells laminated into a weather-proof module.' },
    { value: 16,   emoji: '🗂️', name: 'Panel String',      fact: 'Panels wired in series to feed a single inverter.' },
    { value: 32,   emoji: '🏠',  name: 'Rooftop System',    fact: 'A typical home rooftop produces 5–10 kW of clean power.' },
    { value: 64,   emoji: '🏘️', name: 'Community Solar',   fact: 'Shared arrays let renters and apartments tap solar too.' },
    { value: 128,  emoji: '🌾',  name: 'Solar Farm',        fact: 'Utility-scale farms can power tens of thousands of homes.' },
    { value: 256,  emoji: '🔋',  name: 'Solar + Storage',   fact: 'Battery storage lets solar serve power after sunset.' },
    { value: 512,  emoji: '⚡',  name: 'Solar Microgrid',   fact: 'Distributed solar islands keep critical services online.' },
    { value: 1024, emoji: '🏭',  name: 'Gigawatt Plant',    fact: 'Plants like Bhadla in India top 2 GW of capacity.' },
    { value: 2048, emoji: '🌐',  name: 'Smart Solar Grid',  fact: 'AI-balanced grids match supply to demand in real time.' },
    { value: 4096, emoji: '🌍',  name: 'Net Zero Solar',    fact: 'A fully solar-powered economy — the finish line.' },
  ],
};

const WIND: TechTrack = {
  id: 'wind',
  name: 'Wind Power',
  short: 'Wind',
  emoji: '💨',
  accent: '#0EA5E9',
  available: true,
  description: 'Spin up wind power from a strand of carbon fibre to a Net-Zero grid.',
  stages: [
    { value: 2,    emoji: '🧵',  name: 'Carbon Fibre',      fact: 'Modern blades are layered carbon-fibre composites — light yet stiff.' },
    { value: 4,    emoji: '🪶',  name: 'Blade Section',     fact: 'Blades are moulded in segments before being joined into a single piece.' },
    { value: 8,    emoji: '🌀',  name: 'Full Blade',        fact: 'Today’s longest turbine blades exceed 115 metres — bigger than a football field.' },
    { value: 16,   emoji: '⚙️', name: 'Nacelle',           fact: 'The nacelle houses the gearbox, generator and yaw motors at the top of the tower.' },
    { value: 32,   emoji: '🌬️', name: 'Onshore Turbine',   fact: 'A single 5 MW onshore turbine can power around 1,500 homes.' },
    { value: 64,   emoji: '🛖',  name: 'Community Wind',    fact: 'Community-owned turbines let small towns earn from local wind.' },
    { value: 128,  emoji: '🏞️', name: 'Onshore Wind Farm', fact: 'Hornsdale-type onshore farms exceed 300 MW across dozens of turbines.' },
    { value: 256,  emoji: '🌊',  name: 'Offshore Turbine',  fact: 'Offshore winds are stronger and steadier — capacity factors top 50 %.' },
    { value: 512,  emoji: '⚓',  name: 'Offshore Farm',     fact: 'Hornsea (UK) is over 1.3 GW — the largest offshore wind farm in the world.' },
    { value: 1024, emoji: '🏝️', name: 'Floating Array',    fact: 'Floating turbines unlock deep-water sites where fixed foundations can’t reach.' },
    { value: 2048, emoji: '🌐',  name: 'Smart Wind Grid',   fact: 'Forecasting + storage smooths wind’s natural variability across regions.' },
    { value: 4096, emoji: '🌍',  name: 'Net Zero Wind',     fact: 'Wind alone could supply 18× current global electricity demand.' },
  ],
};

const HYDROGEN: TechTrack = {
  id: 'hydrogen',
  name: 'Green Hydrogen',
  short: 'H₂',
  emoji: '💧',
  accent: '#14B8A6',
  available: true,
  description: 'Scale green hydrogen from a catalyst grain to a global Net-Zero economy.',
  stages: [
    { value: 2,    emoji: '🧪',  name: 'Catalyst',          fact: 'Platinum and iridium catalysts split water inside an electrolyser.' },
    { value: 4,    emoji: '⚡',  name: 'Electrolyser Cell', fact: 'A single PEM cell uses electricity to crack H₂O into H₂ and O₂.' },
    { value: 8,    emoji: '🧱',  name: 'Stack Module',      fact: 'Cells are stacked into modules that scale up production.' },
    { value: 16,   emoji: '📦',  name: 'Container Unit',    fact: 'Containerised electrolysers can be shipped and bolted on anywhere.' },
    { value: 32,   emoji: '🏭',  name: 'H₂ Plant',          fact: 'Green-H₂ plants pair electrolysers with dedicated solar or wind power.' },
    { value: 64,   emoji: '⛽',  name: 'Refuelling Station',fact: 'A single H₂ pump fills a fuel-cell vehicle in 3–5 minutes.' },
    { value: 128,  emoji: '🛢️', name: 'H₂ Storage',        fact: 'Salt caverns can store enough H₂ to back up grids for weeks.' },
    { value: 256,  emoji: '🚇',  name: 'H₂ Pipeline',       fact: 'Repurposed gas pipelines can move H₂ at a fraction of the cost.' },
    { value: 512,  emoji: '🚚',  name: 'Fuel-Cell Fleet',   fact: 'H₂ trucks and buses cut diesel emissions on heavy long-haul routes.' },
    { value: 1024, emoji: '🏗️', name: 'Industrial Cluster',fact: 'Steel, ammonia and fertiliser plants are switching to green H₂.' },
    { value: 2048, emoji: '🚢',  name: 'H₂ Export Hub',     fact: 'Liquefied or ammonia-bound H₂ ships across oceans like LNG today.' },
    { value: 4096, emoji: '🌍',  name: 'Net Zero H₂',       fact: 'A green-H₂ backbone could replace ~20 % of all final energy use.' },
  ],
};

const EV: TechTrack = {
  id: 'ev',
  name: 'Electric Mobility',
  short: 'EV',
  emoji: '🚗',
  accent: '#10B981',
  available: true,
  description: 'Wire up clean transport from a single battery cell to a Net-Zero network.',
  stages: [
    { value: 2,    emoji: '🧂',  name: 'Cathode Material',  fact: 'Lithium, nickel and cobalt salts are the chemistry inside every EV cell.' },
    { value: 4,    emoji: '🔋',  name: 'Battery Cell',      fact: 'A single cell stores a few watt-hours — about a phone’s worth.' },
    { value: 8,    emoji: '🧱',  name: 'Battery Module',    fact: 'Cells are bonded into modules with cooling and balancing built in.' },
    { value: 16,   emoji: '📦',  name: 'Battery Pack',      fact: 'A car pack holds 50–120 kWh — a week of household electricity.' },
    { value: 32,   emoji: '⚙️', name: 'Electric Motor',    fact: 'EV motors are 3× more efficient than internal-combustion engines.' },
    { value: 64,   emoji: '🚗',  name: 'Electric Car',      fact: 'EVs cut lifecycle emissions by 50–70 % vs petrol cars on a clean grid.' },
    { value: 128,  emoji: '🔌',  name: 'Charging Point',    fact: 'A 150 kW DC charger adds 200 km of range in about 15 minutes.' },
    { value: 256,  emoji: '🚙',  name: 'EV Fleet',          fact: 'Fleet operators electrify first — the maths on fuel savings is brutal.' },
    { value: 512,  emoji: '🏙️', name: 'Charging Network',  fact: 'Cities like Oslo now have one charger per 10 EVs.' },
    { value: 1024, emoji: '🔁',  name: 'V2G Grid',          fact: 'Vehicle-to-grid lets parked EVs feed power back when demand spikes.' },
    { value: 2048, emoji: '🚆',  name: 'Electrified Transit', fact: 'Buses, trams and rail electrify alongside private cars for max impact.' },
    { value: 4096, emoji: '🌍',  name: 'Net Zero Mobility', fact: 'A fully electrified, renewables-fed transport sector — done.' },
  ],
};

const CARBON: TechTrack = {
  id: 'carbon-capture',
  name: 'Carbon Capture',
  short: 'CCUS',
  emoji: '🧪',
  accent: '#8B5CF6',
  available: true,
  description: 'Pull carbon out of the air — from a sorbent grain to a net-negative economy.',
  stages: [
    { value: 2,    emoji: '🧪',  name: 'Sorbent Pellet',    fact: 'Amine or MOF sorbents bind CO₂ molecules out of the air.' },
    { value: 4,    emoji: '🧫',  name: 'Sorbent Cartridge', fact: 'Pellets are packed into cartridges that cycle through air for capture.' },
    { value: 8,    emoji: '🌬️', name: 'Mini DAC Unit',     fact: 'Small fans pull air across sorbents to scrub CO₂ at room scale.' },
    { value: 16,   emoji: '🏭',  name: 'CCUS Retrofit',     fact: 'Bolt-on capture removes 90 %+ of CO₂ from existing power plants.' },
    { value: 32,   emoji: '🚇',  name: 'CO₂ Pipeline',      fact: 'Captured CO₂ travels through dedicated pipelines to storage sites.' },
    { value: 64,   emoji: '⛏️', name: 'Sequestration Well', fact: 'CO₂ is injected 1–3 km underground into saline aquifers and old reservoirs.' },
    { value: 128,  emoji: '🏗️', name: 'CCUS Hub',          fact: 'Industrial hubs share pipelines and storage to slash unit costs.' },
    { value: 256,  emoji: '🌪️', name: 'Full DAC Facility', fact: 'Climeworks-style plants pull thousands of tonnes of CO₂ from open air.' },
    { value: 512,  emoji: '🛢️', name: 'Synfuel Plant',     fact: 'Captured CO₂ + green H₂ can be turned into jet fuel, methanol or plastics.' },
    { value: 1024, emoji: '🌳',  name: 'Bio-CCS Plant',     fact: 'Biomass + CCS removes CO₂ from the atmosphere on net — a true negative.' },
    { value: 2048, emoji: '📊',  name: 'Carbon Market',     fact: 'High-integrity carbon markets channel money to verified removals at scale.' },
    { value: 4096, emoji: '🌍',  name: 'Net Negative',      fact: 'Removing more CO₂ than we emit — past Net Zero, into restoring the climate.' },
  ],
};

// Listed in pedagogical order: generation → fuel/storage → end use → capture.
export const TECH_TRACKS: TechTrack[] = [SOLAR, WIND, HYDROGEN, EV, CARBON];

export function getTrack(id: string): TechTrack {
  return TECH_TRACKS.find(t => t.id === id) ?? SOLAR;
}

export function stageFor(track: TechTrack, value: number): Stage {
  return track.stages.find(s => s.value === value)
    ?? { value, emoji: '🌍', name: `Level ${value}`, fact: 'Beyond Net Zero — keep going!' };
}

// Original-2048-style tile palette, indexed by stage position (0–11).
// Light/cream for early stages, warm orange ramp through the mid-game,
// gold for high values, deep green for the Net-Zero finish.
export const TILE_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#EEE4DA', fg: '#776E65' }, // 2
  { bg: '#EDE0C8', fg: '#776E65' }, // 4
  { bg: '#F2B179', fg: '#F9F6F2' }, // 8
  { bg: '#F59563', fg: '#F9F6F2' }, // 16
  { bg: '#F67C5F', fg: '#F9F6F2' }, // 32
  { bg: '#F65E3B', fg: '#F9F6F2' }, // 64
  { bg: '#EDCF72', fg: '#F9F6F2' }, // 128
  { bg: '#EDCC61', fg: '#F9F6F2' }, // 256
  { bg: '#EDC850', fg: '#F9F6F2' }, // 512
  { bg: '#EDC53F', fg: '#F9F6F2' }, // 1024
  { bg: '#EDC22E', fg: '#F9F6F2' }, // 2048
  { bg: '#0D9B4A', fg: '#F9F6F2' }, // 4096 — Net Zero
];

export function paletteFor(value: number): { bg: string; fg: string } {
  // value = 2^(idx+1)
  const idx = Math.max(0, Math.min(TILE_PALETTE.length - 1, Math.log2(value) - 1));
  return TILE_PALETTE[idx];
}

export const BOARD_SIZE = 4;
export const WIN_VALUE = 4096; // Net Zero
