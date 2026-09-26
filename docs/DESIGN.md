# EcoGames design system

## Personality

Clean, refined and playful. It's for all ages, so it's fun without being babyish. The look
is a white page, compact type, rounded tiles and colourful "cover art" built from 3D
object images on each game's accent colour. The hub layout is modelled on MSN Play (msn.com/play).

## Brand

EcoGames is an MGTC product. The header shows the MGTC logo
(`public/brand/mgtc-logo.png`) next to the EcoGames wordmark, and the footer credits MGTC
in one small line. The brand colours come from the MGTC logo and are exposed as
`--brand-blue` (#0079C2), `--brand-navy` (#1C4A8E) and `--brand-green` (#8DC63F), with
`--brand-green-ink` for green text. The `--sky` accent and primary buttons use MGTC blue.
Use the official logo file only; never redraw it.

## Tokens (`src/styles/tokens.css`)

| Token                                        | Use                                     |
| -------------------------------------------- | --------------------------------------- |
| `--paper`                                    | page background (white)                 |
| `--surface`, `--surface-2`, `--surface-3`    | cards, and progressively quieter wells  |
| `--ink`, `--muted`                           | text, and secondary text                |
| `--line`                                     | borders                                 |
| `--leaf` `--sky` `--sun` `--coral` `--berry` | accents, each with a `-soft` tint       |
| `--good`, `--bad`                            | right/wrong feedback                    |
| `--on-accent`                                | text or icons placed on an accent fill  |
| `--text-xs` … `--text-2xl`                   | the type scale (compact: body is 15px)  |
| `--header-h`, `--rail-w`                     | shell measurements used by game layouts |

Set `.accent-<name>` on a container to get `--accent` / `--accent-soft` for its children.
Each game and category has one accent (see `registry.ts`).

The site is light (white) by default. Dark is opt-in through the header toggle and saved in
`ecogames:theme`; every token has a dark value.

## Type

A single family, **Plus Jakarta Sans** (self-hosted via `@fontsource-variable`, with no
external requests). Headings use weight 600–800 with slight negative tracking, and body
text uses 400–650. Big hub headings are deliberately light (600 for the title, 400 for the
subtitle), as on MSN Play.

## Hub layout

- **Header:** logo and wordmark on the left, sound and theme toggles on the right, and no
  divider line.
- **Rail (desktop, ≥1024px):** search, "All games" and categories with coloured icons. The
  active item gets a grey fill and an ink bar on the left. Phones and tablets show the
  search field plus category chips instead.
- **Home:** a light "Need a quick break?" heading, then the **featured block** (a rotating
  carousel of the first three games in `registry.ts`, next to a 2×2 grid of the next three
  plus a "Did you know?" fact card), then
  **"Pick up where you left off"** (small tiles) and **"Games picked for you"** (large
  tiles).
- **Tiles:** image-style game "covers" with the title drawn on the art (`ui/art.ts`), and
  no text below.

## Game pages

- The game fills exactly one screen: `.game-page` is sized to the viewport, and the game's
  root must use `height: 100%` and flex so its play area takes the remaining space.
  "More games" sits below the fold.
- The **game bar** is one line: back, title, then the game's live stats (score, lives,
  timer) and any in-game buttons, which games render into `ctx.hud`. Never add a second
  stats row above the play area. The stats are hidden while the start screen is open.
- On phones, the site header is hidden on game pages, and the game bar drops the category
  label and full-screen button to make room for the stats. Keep phone HUDs to two or three
  short pills; words wrapped in `.stat__label` are hidden on phones (e.g. "Question 3/10"
  becomes "3/10"). Check at 320px that the title isn't cut off.
- Every game opens on the shared **start screen** (`ui/intro.ts`): art, how to play, any
  options (level, players) and a Play button. Keep options there, not on the game screen.

## Mobile variants

Games can and should differ slightly on phones (`isCompact()` in `core/dom.ts`). For
example:

- Eco Memory uses smaller boards (Hard is 10 pairs rather than 12), and the grid is chosen
  to fit the screen.
- Eco Quiz uses one column of answers, with the explanation in a bottom sheet with a
  full-width Next button.
- Eco Memory shows only pairs and time in the game bar, and one "New game" button that
  opens the start screen.
- Waste Sorter uses short bin labels, at most two falling items at once, tap-to-sort
  instructions and vibration on mistakes.
- River Rescue uses bigger items, a slower river, fewer items at once and drag-to-steer,
  with the boat at 80% of the height so the thumb doesn't cover it.
- Switch Off! turns the floor plan on its side on tall screens so the house fills the phone,
  gives appliances a bigger tap area, and hides family name tags when the tiles get small.
- Solar Link keeps 6×6 on Hard (tiles stay 44px+ at 320px), shows only homes and turns in
  the game bar, and one "New puzzle" button.

Use `howToMobile` in the registry when the controls differ on touch screens.

## Components (`src/styles/components.css`)

`.btn` (`--primary`, `--ghost`, `--icon`, `--lg`), `.segmented` radio groups, `.stat`
pills, `.chip`, `.search`, `.dialog` and `.toast`. Reuse these before inventing new ones.

## Icons and images

- **Icons** (Lucide, `src/ui/icons.ts`) are for UI chrome: buttons, stats, bins,
  categories and the carousel caption chip.
- **Images** are 3D object renders from Microsoft's Fluent Emoji set (MIT), stored in
  `src/assets/3d` and registered in `src/ui/images.ts`. They are the game art: cover art
  (`gameArt()` composes a game's `image` and `art` images), and anything the player
  looks at in a game: Waste Sorter and River Rescue items, Eco Memory cards, Switch Off!
  appliances, furniture and characters, and Solar Link's farm and homes. Keep to this one set so everything shares a style; see the README in
  `src/assets/3d` to add one.

## Motion

Keep animations short (150–450 ms) with `var(--ease)`. Every animation must be optional:
`prefers-reduced-motion` disables CSS motion globally, and JS effects (confetti, the
carousel autoplay) check `prefersReducedMotion()`.

## Layout checks

- Check at 320px (iPhone SE), 390px, a landscape phone, a tablet, 1366×768 and 1920px.
- There must be no horizontal scrolling, and each game page must fit the viewport.
- Touch targets must be at least 44px.
