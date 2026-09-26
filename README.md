# EcoGames

Quick, free browser games about climate, energy, nature and waste, for all ages.
They work on phones, tablets and computers, with touch, mouse or keyboard.

## Games

| Game                | What you learn                                            | Built with |
| ------------------- | --------------------------------------------------------- | ---------- |
| **Waste Sorter**    | Recycling, food waste, general waste, special drop-offs   | Phaser 4   |
| **Eco Memory**      | Core climate vocabulary (1 or 2 players)                  | DOM + CSS  |
| **Eco Quiz**        | Climate science, energy, nature, everyday actions         | DOM + CSS  |
| **River Rescue**    | How rubbish travels from drains to rivers and the sea     | Phaser 4   |
| **Switch Off!**     | Saving electricity at home                                | Phaser 4   |
| **Solar Link**      | Solar power and the electricity grid                      | DOM + SVG  |
| **Grow the Forest** | How a seed grows into a tree, and trees into a rainforest | DOM + CSS  |
| **Eco Word**        | Climate and nature words, with what each one means        | DOM + CSS  |
| **Turtle Trek**     | Sea turtle hatchlings, beach lights and beach rubbish     | Phaser 4   |
| **Greener Choice**  | Everyday choices with a smaller footprint, and why        | DOM + CSS  |
| **Green City**      | Walkable, green, clean-powered town planning              | DOM + CSS  |
| **Mangrove Guard**  | How mangroves protect coasts, and the life they shelter   | Phaser 4   |

## Getting started

Requires Node 22 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `npm run check`    | lint, format check, typecheck, unit tests, build |
| `npm test`         | unit tests (Vitest)                              |
| `npm run test:e2e` | end-to-end tests in Chromium, desktop and mobile |
| `npm run build`    | production build to `dist/`                      |

## Tech

- **Vite + TypeScript (strict)**, with no UI framework. A small hash router loads each
  game on demand.
- **Phaser 4** for real-time games, loaded only when one is opened.
- **Lucide** icons and the self-hosted **Plus Jakarta Sans** font. The hub layout is modelled
  on MSN Play.
- **Vitest** for game rules and content checks. **Playwright** plays every game to the
  end.
- **GitHub Actions** runs CI on every PR. **Netlify** builds and hosts the site
  (`netlify.toml`), deploying production from `main` and a preview for every PR.

## Contributing

- [`CLAUDE.md`](CLAUDE.md): architecture and project rules (for people and AI assistants)
- [`docs/DESIGN.md`](docs/DESIGN.md): the visual system
- [`docs/CONTENT.md`](docs/CONTENT.md): how facts are written and checked
- [`.claude/skills/add-game`](.claude/skills/add-game/SKILL.md): step-by-step guide to adding a game
