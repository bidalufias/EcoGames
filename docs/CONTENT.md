# Content guidelines

EcoGames teaches real science, so wrong or outdated facts are bugs.

## Where content lives

All educational text lives in `src/content/`:

- `concepts.ts`: climate vocabulary (Eco Memory, and future glossaries)
- `quiz.ts`: Eco Quiz questions
- `waste.ts`: Waste Sorter items and bins

`src/content/content.test.ts` enforces the structural rules: unique ids, known icons
and length limits.

## Writing rules

1. **Plain language.** A 9-year-old should understand it. Use one idea per sentence and
   explain any jargon.
2. **Evergreen facts only.** Avoid numbers that change yearly, such as "warming is 1.2°C"
   or "X% of electricity is renewable". Prefer mechanisms and well-established
   relationships ("beef usually has a much higher footprint than beans").
3. **Scientific consensus.** Base facts on sources such as the IPCC, NASA, NOAA, the UN
   Environment Programme, national environment agencies or peer-reviewed reviews.
   Leave out anything contested.
4. **Hopeful and practical.** Pair problems with actions where you can. Avoid fear or
   blame.
5. **Local variation.** Recycling rules differ by area. Choose waste items that are sorted
   the same way almost everywhere, and keep the "check your local rules" note.
6. **Quiz questions** have exactly four plausible-looking options, one clearly correct
   answer and a one- or two-sentence explanation. Options are shuffled at runtime.
7. **Length limits:** a concept term is at most 18 characters and a detail at most 110
   characters. Details are full sentences ending in a full stop.

## Review checklist for content PRs

- [ ] Each new fact was checked against a reputable source (link it in the PR).
- [ ] No time-sensitive statistics.
- [ ] Reads naturally aloud.
- [ ] `npm test` passes.
