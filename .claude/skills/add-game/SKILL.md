---
name: add-game
description: Add a new game to EcoGames (hub card, lazy-loaded module, content, logic, tests). Use when asked to create, add or prototype a new EcoGames game.
---

# Add a game to EcoGames

Before starting, read `CLAUDE.md`, `docs/DESIGN.md` and `docs/CONTENT.md`.

## 1. Decide the shape

- **DOM game** (cards, quizzes, puzzles, anything turn-based): plain TypeScript + CSS.
  Model on `src/games/memory` or `src/games/quiz`.
- **Canvas game** (real-time motion, drag physics): Phaser 4. Model on `src/games/sorter`,
  and read the relevant `node_modules/phaser/skills/*/SKILL.md` first.

Pick an id (kebab-case, e.g. `energy-saver`), a CSS prefix (e.g. `energy-`), an accent
(`leaf | sky | sun | coral | berry`) and a Lucide icon.

## 2. Content first

Put all facts and text in `src/content/<topic>.ts`, with typed data and ids. Follow
`docs/CONTENT.md`. Add checks to `src/content/content.test.ts` (unique ids, icons exist,
length limits).

## 3. Pure rules

Create `src/games/<id>/logic.ts` with no DOM or Phaser imports: state classes, scoring,
stars (0–3) and difficulty curves. Take an `Rng` parameter (`core/random.ts`). Write
`logic.test.ts` next to it and cover scoring, win/lose and edge cases.

## 4. View

Create `src/games/<id>/index.ts` exporting:

```ts
export function mount(host: HTMLElement, ctx: GameContext): GameInstance;
```

- Build DOM with `h()` from `core/dom.ts`, and icons with `icon()` from `ui/icons.ts`.
- Call `ctx.sound(...)`, `ctx.announce(...)` on outcomes, and at the end
  `ctx.showResult({ ..., isBest: ctx.submitScore(score), learned: [...] , onReplay })`.
- `destroy()` must remove every listener, timer, observer and Phaser game.
- Put styles in `src/games/<id>/<id>.css` (import it from index.ts), use only tokens,
  and prefix every class.
- Support keyboard play. Keep touch targets at 44px or more. Respect reduced motion.

## 5. Register

Add an entry to `GAMES` in `src/games/registry.ts` with `load: () => import('./<id>')`.
Order the entries by what new players should try first.

## 6. Verify

1. `npm run check` must pass.
2. Add `tests/e2e/<id>.spec.ts` (or extend `games.spec.ts`) that opens the game from the
   hub and plays to the results dialog. Run `npm run test:e2e`.
3. Look at it: run the app (see the `run-ecogames` skill) and screenshot the new game at
   1280×860 and on a Pixel 7, in light and dark themes. Fix layout issues before
   finishing.
