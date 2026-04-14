# EcoGames by MGTC — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a suite of 6 educational games about climate change and green technology, hosted under a modern, inviting EcoGames landing page.

**Architecture:** Single-page React app with Vite. Landing page at root, each game on its own route. Shared MGTC-branded theme, Supabase leaderboard, common UI components. All games use HTML5 Canvas or React for rendering, touch-first input, responsive for PC/phone/tablet/tabletop.

**Tech Stack:** React 19 + TypeScript + Vite, MUI v7 (custom eco theme), Supabase (Postgres + RLS), Netlify deployment, Web Audio API for sounds.

---

## Design System — "EcoGames by MGTC"

### Brand Colors
```
Primary:     #0D9B4A (vibrant green)
Secondary:   #1B8EBF (ocean blue)
Accent:      #FFB800 (solar gold)
Background:  #0A1628 (deep navy)
Surface:     #112240 (navy card)
Text:        #E6F1FF (bright white-blue)
TextDim:     #8892B0 (muted)
Danger:      #FF4757 (red)
Success:     #0D9B4A (green)
```

### Design Principles
- **Glassmorphism** — frosted glass cards with subtle backdrop-blur
- **Soft gradients** — green-to-blue gradients for depth
- **Rounded corners** — 16px border radius on cards, 12px on buttons
- **Glow effects** — subtle green/blue glow on hover and focus
- **Smooth animations** — CSS transitions + Framer Motion for page transitions
- **Particle effects** — floating leaf/energy particle background on landing page
- **Modern typography** — Inter for headings, system font for body
- **Touch-first** — all interactive elements ≥ 44px tap target
- **Dark mode default** — eco theme is inherently dark

### Shared Components
- `EcoHeader` — top nav with MGTC logo, game nav
- `EcoCard` — glassmorphism card container
- `EcoButton` — gradient button with glow hover
- `EcoChip` — tag/badge for categories
- `LeaderboardPanel` — shared leaderboard (Supabase-backed)
- `GameTile` — landing page game card with preview image, description, play button
- `ParticleSystem` — floating background particles (leaves, energy orbs)

### Supabase Schema
```sql
-- Shared leaderboard table for all games
CREATE TABLE leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL CHECK (game_id IN (
    'climate-ninja', 'carbon-crush', 'recycle-rush',
    'eco-memory', 'green-defence', 'climate-2048'
  )),
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 20),
  score integer NOT NULL CHECK (score >= 0),
  metadata jsonb DEFAULT '{}',  -- game-specific data (items_sliced, max_combo, etc.)
  created_at timestamptz DEFAULT now()
);

-- RLS: public read/insert, no update/delete
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public insert" ON leaderboard FOR INSERT WITH CHECK (
  char_length(player_name) BETWEEN 1 AND 20 AND score >= 0
);
```

---

## Sprint 1: Foundation + Landing Page + Climate Ninja Rework

### Task 1: Scaffold Vite + React + TypeScript project
- `npm create vite@latest . -- --template react-ts`
- Install deps: `@mui/material @emotion/react @emotion/styled @fontsource/inter react-router-dom framer-motion @supabase/supabase-js`
- Set up folder structure:
  ```
  src/
  ├── theme/           # Eco theme config (colors, typography, components)
  ├── components/      # Shared UI components (EcoCard, EcoButton, etc.)
  ├── lib/             # Supabase client, utilities
  ├── pages/           # Landing page, game pages
  ├── games/           # Individual game modules
  │   ├── climate-ninja/
  │   ├── carbon-crush/
  │   ├── recycle-rush/
  │   ├── eco-memory/
  │   ├── green-defence/
  │   └── climate-2048/
  ├── App.tsx          # Router setup
  └── main.tsx
  ```
- Configure MUI theme with eco brand colors
- Set up React Router with routes for `/` (landing) and `/games/:gameId`

### Task 2: Shared Theme + Components
- Create `src/theme/ecoTheme.ts` with brand colors, typography, component overrides
- Build shared components:
  - `EcoCard` — glassmorphism card (frosted bg, border, blur)
  - `EcoButton` — gradient CTA button with glow on hover
  - `EcoChip` — category tag
  - `EcoHeader` — top navigation bar
  - `ParticleSystem` — animated floating particles background

### Task 3: Supabase Client + Leaderboard
- Create `src/lib/supabase.ts` with graceful null fallback
- Create shared `LeaderboardPanel` component
- Create migration file for shared `leaderboard` table with `game_id` column

### Task 4: Landing Page
- Hero section: "EcoGames by MGTC" with tagline, particle background
- Game grid: 6 GameTile cards (even unlaunched games shown as "Coming Soon")
- Each tile: game icon/preview, name, description, "Play" or "Coming Soon" button
- Footer: "Powered by MGTC" branding
- Smooth scroll animations on game tiles
- Fully responsive: 3 cols desktop, 2 cols tablet, 1 col phone

### Task 5: Climate Ninja Rework — Educational Content
- Define the 7 GHGs with emojis, names, formulas, sources, descriptions:
  1. CO₂ (Carbon Dioxide) — ⬛ — Fossil fuel combustion, deforestation
  2. CH₄ (Methane) — 🐄 — Livestock, landfills, rice paddies
  3. N₂O (Nitrous Oxide) — 🧪 — Fertilizers, industrial processes
  4. HFCs (Hydrofluorocarbons) — ❄️ — Refrigerants, AC units
  5. PFCs (Perfluorocarbons) — 💻 — Electronics manufacturing, aluminum
  6. SF₆ (Sulfur Hexafluoride) — ⚡ — Power grid insulation
  7. NF₃ (Nitrogen Trifluoride) — 🖥️ — LCD/LED manufacturing
- Define clean tech "don't slash" items:
  - ☀️ Solar Panel, 🌬️ Wind Turbine, 🚲 Bicycle, 🔋 EV Car, ♻️ Recycling,
  - 💧 Water Efficiency, 🌳 Tree/Reforestation, 🌿 Composting, 🏠 Green Building
- Create intro/education screen showing all GHGs with fact cards
- Update game objects to use new emoji set
- Update scoring labels to show GHG names when slashed

### Task 6: Climate Ninja Rework — UI Refresh
- Apply EcoGames theme (dark eco palette)
- Update StartScreen with MGTC branding and game description
- New educational intro screen before gameplay
- Update GameHUD colors to match eco theme
- Update GameOver screen with eco-themed results
- Ensure touch + mouse + keyboard all work
- Test responsiveness on different viewport sizes

---

## Sprint 2: Games 2–6 (Parallel Build)

### Task 7: Carbon Crush (Match-3)
**Teaches:** Emission sources vs clean alternatives
- 8×8 grid of tiles: emission sources and clean tech
- Swap adjacent tiles to match 3+ of the same emission → "phase it out"
- Match clean tech = bonus multiplier
- Special combos: match 4 = row clear, match 5 = board clear
- Levels represent sectors: Energy, Transport, Agriculture, Industry, Waste
- Facts popup between levels

### Task 8: Recycle Rush (Tetris-style)
**Teaches:** Proper waste sorting
- Items fall from top: plastic bottle, banana peel, battery, paper, etc.
- 4 bins at bottom: Recycle, Compost, Landfill, Hazardous
- Swipe/drag items to correct bin
- Wrong bin = pollution penalty
- Speed increases with level
- Facts after each level about recycling stats

### Task 9: Eco Memory (Concentration)
**Teaches:** GHG sources and their relationships
- Cards face down, flip 2 at a time
- Match gas ↔ source pairs (CO₂ ↔ Coal Plant, CH₄ ↔ Cattle, etc.)
- Harder levels: 3-card matches (gas + source + effect)
- Facts revealed on each match
- Timed competitive mode

### Task 10: Green Defence (Tower Defence)
**Teaches:** Which technologies address which pollution
- Pollution waves approach from right
- Place clean tech "towers": wind turbine, solar farm, reforestation, etc.
- Each tower counters specific pollution types
- Waves represent decades (2020s→2050s)
- Survive to 2050 = Net Zero victory

### Task 11: Climate 2048 (2048 Puzzle)
**Teaches:** Technology progression to Net Zero
- Merge tiles to evolve tech: LED → Solar → Solar Farm → Smart Grid → ... → Net Zero
- Dirty energy tiles appear and multiply if not merged away
- Facts on each merge
- Win condition: reach "Net Zero Nation" tile (2048)

---

## Sprint 3: Polish + Deploy

### Task 12: Cross-game Polish
- Consistent animations across all games
- Sound effects using Web Audio API (shared module)
- Loading states and error handling
- Accessibility: keyboard navigation, ARIA labels

### Task 13: Netlify Deployment
- Build configuration
- SPA routing
- Environment variables for Supabase
- Custom domain setup (when ready)

### Task 14: Final QA
- Test all games on: desktop Chrome, mobile Safari, tablet, touchscreen
- Verify Supabase leaderboard works across games
- Check responsive layouts
- Performance audit (Lighthouse)
