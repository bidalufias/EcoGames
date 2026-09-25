# EcoGames design system

## Personality

Friendly, bright and calm. It's for all ages, so it's playful without being babyish.
The look is warm paper backgrounds, rounded shapes, bold colour blocks and one icon family.

## Brand

EcoGames is an MGTC product. The header shows the MGTC logo
(`public/brand/mgtc-logo.png`) next to the EcoGames wordmark, and the footer credits MGTC.
The brand colours come from the MGTC logo and are exposed as `--brand-blue` (#0079C2),
`--brand-navy` (#1C4A8E) and `--brand-green` (#8DC63F). The `--sky` accent is MGTC blue,
and the EcoGames mark uses a blue→green gradient. Use the official logo file only; never
redraw it.

## Tokens (`src/styles/tokens.css`)

| Token                                        | Use                                    |
| -------------------------------------------- | -------------------------------------- |
| `--paper`                                    | page background                        |
| `--surface`, `--surface-2`                   | cards/panels, and quieter wells        |
| `--ink`, `--muted`                           | text, and secondary text               |
| `--line`                                     | borders                                |
| `--leaf` `--sky` `--sun` `--coral` `--berry` | accents, each with a `-soft` tint      |
| `--good`, `--bad`                            | right/wrong feedback                   |
| `--on-accent`                                | text or icons placed on an accent fill |

Set `.accent-<name>` on a container to get `--accent` / `--accent-soft` for its children.
Each game has one accent (see `registry.ts`).

Every token has a dark value. The theme follows the OS setting until the user picks one
with the toggle, which is saved in `ecogames:theme`.

## Type

- Display: **Fredoka** (headings, buttons, big numbers)
- Body: **Nunito** (everything else)

Both are self-hosted via `@fontsource-variable`, with no external requests.

## Components (`src/styles/components.css`)

`.btn` (`--primary`, `--ghost`, `--icon`), `.segmented` radio groups, `.stat` pills,
`.tag`, `.dialog`, `.toast`. Reuse these before inventing new ones.

## Icons

Use Lucide only, registered in `src/ui/icons.ts`. For game art, place an icon inside a
coloured circle or tile (see the memory cards and sorter tokens).

## Motion

Keep animations short (150–450 ms) with `var(--ease)`. Every animation must be optional:
`prefers-reduced-motion` disables CSS motion globally, and JS effects (confetti) check
`prefersReducedMotion()`.

## Layout

- Mobile first. Check at 390px, where the side gutter is 16px.
- A game screen should fit in one viewport on desktop (see `.mem-board` sizing).
- Touch targets must be at least 44px.
