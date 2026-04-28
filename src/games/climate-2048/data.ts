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
    { value: 2,    emoji: '◻️',  name: 'Silicon Wafer',     fact: 'A 0.2 mm slice of purified silicon — the seed of every solar cell.' },
    { value: 4,    emoji: '\u{1f536}',     name: 'Photovoltaic Cell', fact: 'A doped wafer that converts sunlight straight into electricity.' },
    { value: 8,    emoji: '\u{1f7e6}',     name: 'Solar Panel',       fact: '60–72 cells laminated into a weather-proof module.' },
    { value: 16,   emoji: '\u{1f5b3}️', name: 'Panel String',    fact: 'Panels wired in series to feed a single inverter.' },
    { value: 32,   emoji: '\u{1f3e0}',     name: 'Rooftop System',    fact: 'A typical home rooftop produces 5–10 kW of clean power.' },
    { value: 64,   emoji: '\u{1f3d8}️', name: 'Community Solar', fact: 'Shared arrays let renters and apartments tap solar too.' },
    { value: 128,  emoji: '\u{1f33e}',     name: 'Solar Farm',        fact: 'Utility-scale farms can power tens of thousands of homes.' },
    { value: 256,  emoji: '\u{1f50b}',     name: 'Solar + Storage',   fact: 'Battery storage lets solar serve power after sunset.' },
    { value: 512,  emoji: '⚡',        name: 'Solar Microgrid',   fact: 'Distributed solar islands keep critical services online.' },
    { value: 1024, emoji: '\u{1f3ed}',     name: 'Gigawatt Plant',    fact: 'Plants like Bhadla in India top 2 GW of capacity.' },
    { value: 2048, emoji: '\u{1f310}',     name: 'Smart Solar Grid',  fact: 'AI-balanced grids match supply to demand in real time.' },
    { value: 4096, emoji: '\u{1f30d}',     name: 'Net Zero Solar',    fact: 'A fully solar-powered economy — the finish line.' },
  ],
};

// Coming-soon tracks. Listed so the picker can render them disabled.
const WIND: TechTrack = {
  id: 'wind',
  name: 'Wind Power',
  short: 'Wind',
  emoji: '\u{1f4a8}',
  accent: '#0EA5E9',
  available: false,
  description: 'From a single blade to an offshore wind belt.',
  stages: [],
};

const EV: TechTrack = {
  id: 'ev',
  name: 'Electric Mobility',
  short: 'EV',
  emoji: '\u{1f697}',
  accent: '#10B981',
  available: false,
  description: 'From a battery cell to a fully electrified city.',
  stages: [],
};

const CARBON: TechTrack = {
  id: 'carbon-capture',
  name: 'Carbon Capture',
  short: 'CCUS',
  emoji: '\u{1f9ea}',
  accent: '#8B5CF6',
  available: false,
  description: 'From a sorbent pellet to direct-air-capture at scale.',
  stages: [],
};

export const TECH_TRACKS: TechTrack[] = [SOLAR, WIND, EV, CARBON];

export function getTrack(id: string): TechTrack {
  return TECH_TRACKS.find(t => t.id === id) ?? SOLAR;
}

export function stageFor(track: TechTrack, value: number): Stage {
  return track.stages.find(s => s.value === value)
    ?? { value, emoji: '\u{1f30d}', name: `Level ${value}`, fact: 'Beyond Net Zero — keep going!' };
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
