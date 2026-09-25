# EcoGames

Browser games that teach climate and sustainability to all ages. It's a static site
(Vite + TypeScript) with a game hub and lazy-loaded games. DOM games use plain
TypeScript, and action games use Phaser 4.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173
npm run check        # lint + format check + typecheck + unit tests + build (run before every commit)
npm test             # Vitest unit tests (src/**/*.test.ts)
npm run test:e2e     # Playwright e2e (builds + previews on :4173, desktop + mobile)
npm run format       # Prettier write
```

In Claude Code cloud sessions, the SessionStart hook sets `PLAYWRIGHT_CHROMIUM_EXECUTABLE`
so e2e tests use the preinstalled Chromium. Don't run `npx playwright install` there.

## Layout

```
src/
  main.ts, app.ts        # boot, shell (header/footer), hash router, GameContext wiring
  core/                  # framework-free helpers: types, storage, sound, random, dom
  ui/                    # shared UI: hub (MSN Play-style), art, intro (start screen), icons, images, result dialog, toast
  assets/3d/             # 3D object images (Fluent Emoji, MIT) for game art; README says how to add one
  styles/                # tokens.css (all colours), base, components, shell
  content/               # ALL educational text: concepts, quiz questions, waste items
  games/
    registry.ts          # the list of games shown on the hub
    <game>/index.ts      # mount(host, ctx) -> { destroy }
    <game>/logic.ts      # pure rules, no DOM/Phaser; unit tested in logic.test.ts
    <game>/<game>.css    # styles scoped with a short prefix (mem-, quiz-, sorter-)
tests/e2e/               # Playwright specs that play each game to the end
docs/                    # DESIGN.md (visual system), CONTENT.md (fact-checking rules)
```

## Rules

- **Adding a game:** follow `.claude/skills/add-game/SKILL.md`.
- **Keep rules out of the view layer.** Each game has its rules in `logic.ts` as pure
  functions or classes, with a seeded RNG (`core/random.ts`) so tests are deterministic.
  Views only render and forward input.
- **Content lives in `src/content/`.** Never hard-code facts in game code. Follow
  `docs/CONTENT.md`: plain language, checked facts, no statistics that date quickly.
- **Colours only come from CSS tokens** in `src/styles/tokens.css`, and every colour has a
  dark-theme value. Phaser scenes get a light/dark palette at construction time.
- **Icons and images:** UI chrome (buttons, stats, bins, categories) uses Lucide icons,
  registered by name in `src/ui/icons.ts`. Game art (cover art, waste items, memory
  cards) uses the 3D images in `src/assets/3d`, registered in `src/ui/images.ts`. Don't
  mix in other image styles. For Phaser, load icons with `iconDataUrl()` (base64; the
  loader rejects other data URLs) and images with `load.image(key, imageUrl(name))`.
- **Accessibility is required.** Every game must be playable by keyboard as well as
  touch/mouse. Announce outcomes with `ctx.announce`, respect `prefers-reduced-motion`,
  use real `<button>`s, and keep touch targets at 44px or more.
- **Storage:** use `core/storage.ts` only. It never throws, and the app must work without it.
- **Mobile first, and fit the screen:** every game page fits one viewport with no page
  scrolling during play. Games open on the shared start screen (`ui/intro.ts`). On phones,
  games use a compact variant (`isCompact()`: smaller boards, bigger targets, tap-first
  controls). See `docs/DESIGN.md`.
- **Look and feel:** white background, Plus Jakarta Sans, and the MSN Play-style hub
  (rail, carousel, tiles with cover art). Keep new UI consistent with `docs/DESIGN.md`.
- **Tests:** logic changes need unit tests. New games need an e2e spec that plays to the
  results dialog.

## Phaser 4

Phaser ships agent skills in `node_modules/phaser/skills/<topic>/SKILL.md`. Read the
relevant one before writing Phaser code; the v4 API differs from v3 in places. Most useful:
`v3-to-v4-migration`, `scenes`, `input-keyboard-mouse-touch`, `tweens`,
`scale-and-responsive`, `graphics-and-shapes`, `loading-assets`.

Import with `import * as Phaser from 'phaser'`. Only import Phaser from inside a game
folder, so it stays in its own lazy chunk and the hub stays small.

## Deploy

Netlify (project `ecogamesmgtc`) builds and hosts the site, as configured in `netlify.toml`
(`npm run build`, which publishes `dist/`). `main` deploys to production, and every PR gets a
deploy preview. `vite.config.ts` uses `base: './'` and the router uses hashes, so the
build works from any path.
