# Product

## Register

product

## Users

General-public visitors of all ages, from curious kids and families to teachers, museum-goers, and casual web wanderers. They arrive with mixed climate literacy and short attention spans. Context is varied: a phone on the couch, a classroom projector, a science-fair tablet, a tabletop kiosk. They want a quick hit of fun that incidentally teaches something about climate change and green technology — not a lecture, not a quiz they have to "study" for.

## Product Purpose

EcoGames by MGTC is a hub of six short, playable browser games (Climate Ninja, Carbon Crush, Recycle Rush, Eco Memory, Green Defence, Climate 2048) that sneak climate-and-green-tech literacy into the rhythm of casual play. Success looks like: a visitor lands, picks a tile, plays a round inside 60 seconds, beats their score, and walks away knowing one thing about the planet they didn't know before. The shared leaderboard turns repeat play into low-stakes social motivation.

## Brand Personality

Warm, hand-crafted, editorial. Three words: **earnest, inviting, alive**. The voice is closer to *National Geographic Kids* or a thoughtful museum exhibit than to a SaaS dashboard or a children's TV channel — credible about the science, but with a human, illustrated warmth. Tone is hopeful without being saccharine, playful without being childish, grown-up enough that a teen or adult won't feel patronised, friendly enough that a kid feels welcome.

## Anti-references

- **Generic SaaS dark dashboards** — neon teal on near-black, hero metric tiles, glassmorphism-by-default. EcoGames is not a control panel.
- **"Eco" cliché kits** — leaf bullet points, hand-holding-globe stock illustrations, gradient-text "Save the Planet" headlines.
- **Crypto/AI-app maximalism** — animated mesh gradients, glow-on-everything, neon green on pure black.
- **Childish kids-game UI** — Comic Sans energy, bouncy elastic motion, primary-rainbow palettes, cartoon mascots that talk down to the user.
- **Identical card grids** — six near-identical glass tiles in a 3×2 grid is the lazy answer; each game deserves a tile that hints at its own character.

## Design Principles

- **Earned warmth over default dark.** Tinted neutrals and a paper-leaning surface palette over reflexive deep-navy. If we go dark, it's because the scene demands it (a museum kiosk at night), not because "games look cool dark."
- **Each game has a face.** The six tiles should not feel like the same component six times. Differentiate through illustration, color register, or layout — the landing page is a curated index, not a CRUD list.
- **Fun is the teacher.** Educational content lives inside play loops, score feedback, and end-of-round moments. Never an info modal that interrupts the game to explain the lesson.
- **Touch-first, generous targets.** Every interactive element ≥ 44px hit area. Designed for thumbs on a phone and fingers on a kiosk before mice on a desktop.
- **Accessible by construction, not by retrofit.** Color is never the only carrier of meaning. Motion respects `prefers-reduced-motion`. Type holds up at 200% zoom and on a projector at the back of a classroom.

## Accessibility & Inclusion

- WCAG 2.1 AA target across the hub and all six games.
- Visible focus rings on every interactive element; keyboard-playable where the game mechanic allows, with a clear "this game requires touch/pointer" notice when not.
- All meaningful color contrast ≥ 4.5:1 for body, ≥ 3:1 for large text and non-text UI; no color-only state.
- `prefers-reduced-motion` honored: particle backgrounds, page transitions, and game juice all degrade to static or low-motion alternates.
- Hit targets ≥ 44×44px. Touch, mouse, and keyboard all first-class where possible.
- Copy avoids jargon, idioms, and culture-specific references; readable at roughly a 12-year-old reading level.
- Sound is never required. Mute is always one tap away and remembered across sessions.
