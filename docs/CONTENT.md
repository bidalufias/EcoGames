# Content guidelines

EcoGames teaches real science, so wrong or outdated facts are bugs.

## Where content lives

All educational text lives in `src/content/`:

- `concepts.ts`: climate vocabulary (Eco Memory and the hub's "Did you know?" card)
- `quiz.ts`: Eco Quiz topics (`QUIZ_TOPICS`) and questions. Every topic needs at least
  eight questions so it can have a round of its own.
- `waste.ts`: Waste Sorter items and bins, with each bin's Malay name
- `river.ts`: River Rescue rubbish, river animals and river facts
- `energy.ts`: Switch Off! rooms (with Malay names), appliances, energy-saving tips and the
  family characters
- `solar.ts`: Solar Link's solar power facts
- `forest.ts`: Grow the Forest's stages, from a seed to a tree, then from a grove to the great
  rainforests (Taman Negara, the Heart of Borneo and the Amazon), each with a fact
- `words.ts`: Eco Word's five-letter answers, each with a clue that doesn't give the word
  away and a fact shown once it is solved. Guesses are checked against a general word list
  in `games/eco-word/dictionary.ts`, which is not content.
- `turtles.ts`: Turtle Trek's beach rubbish, ghost crab, beach light and sea turtle facts
- `footprint.ts`: Greener Choice's pairs of everyday choices. Only compare choices with a
  big, well-established gap (the train against a short flight, beans against beef), and
  explain why in words rather than numbers.
- `city.ts`: Green City's buildings, each with its scoring rule and a fact
- `mangroves.ts`: Mangrove Guard's two mangrove species (api-api and bakau), the rubbish
  and sea life shown in the game, and mangrove facts

Each of these has its own checks in `src/content/<file>.test.ts`.

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
5. **Set in Malaysia.** EcoGames is an MGTC product for Malaysian players. Use Malaysian
   places, wildlife, food, weather and everyday life (tapau, teh tarik, gotong-royong,
   the monsoon, haze), and Malaysian programmes where they help (MyHIJAU, the Low Carbon
   Cities Framework, energy star labels). Name organisations by what they do rather than
   by a ministry name, since those change.
6. **Waste follows Malaysian practice:** separation at source, the recycling station
   colours (blue for paper, orange for plastic and metal, brown for glass), and
   e-waste collection points for batteries, electronics and fluorescent bulbs.
   Collections still vary by council, so keep the "check yours" note.
7. **Quiz questions** have exactly four plausible-looking options, one clearly correct
   answer and a one- or two-sentence explanation. Options are shuffled at runtime.
8. **Length limits:** a concept term is at most 18 characters and a detail at most 110
   characters. Details are full sentences ending in a full stop.

## Review checklist for content PRs

- [ ] Each new fact was checked against a reputable source (link it in the PR).
- [ ] No time-sensitive statistics.
- [ ] Reads naturally aloud.
- [ ] `npm test` passes.
