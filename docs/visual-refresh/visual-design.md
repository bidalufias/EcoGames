# EcoGames visual refresh

## Direction: crafted nature

An approachable, polished collection of miniature 3D objects: softly rounded forms, matte ceramic and painted wood surfaces, subtle material grain, and clear silhouettes. Natural greens, lagoon teal, warm sand, honey yellow and restrained terracotta create a coherent ecological world. Recognizable object colors take precedence over palette uniformity.

## Image rules

- Generation route: built-in image generator, authorized by the user after Higgsfield rejected GPT Image 2.5 with “Requires basic plan or higher.” The built-in tool does not expose a model selector; do not label its outputs as verified Images 2.5.
- Use the first accepted tree as a shared style reference for subsequent objects.
- One isolated subject per file; no backdrop, badge, sticker outline, text, watermark, or ground plane.
- Gentle three-quarter orthographic view, soft upper-left studio light, subtle self-shadowing, no dramatic cast shadow.
- Centered composition with a generous clear perimeter; match each original object's occupied bounds when preparing the replacement.
- Preserve filenames, WebP format, 256 × 256 dimensions, alpha, semantic meaning, and visible gameplay footprint.
- Keep silhouettes legible at 32–64px. Avoid tiny decorations that disappear in play.
- Animals retain appropriate identifying anatomy. Food, rubbish, appliances and buildings remain unambiguous.
- Directional actors must preserve the orientation expected by the existing game.

## Interface and scenes

Retain Plus Jakarta Sans, accessible Lucide controls, official MGTC logo and brand colors. The logo is an identity asset and must not be regenerated. Harmonize supporting surfaces with soft mineral tints, restrained borders, rounded corners and shallow shadows. Keep feedback, focus, selection and power states distinct in light and dark mode. Preserve all layouts, touch targets and responsive breakpoints.

The implemented scope preserves TypeScript, including procedural scene geometry and character drawings, in accordance with the code-preservation constraint. All game rules, content, input handling, movement, collision, scoring, timers, persistence and routing remain unchanged. The refresh is carried by the shared image library, CSS surfaces, theme tokens and favicon.

## Validation

Inventory original hashes and image dimensions; inspect contact sheets on light and dark backgrounds; validate alpha and file decoding; run the existing check and desktop/mobile end-to-end suites; inspect every game at desktop and phone sizes plus narrow and landscape layouts. Compare the final source diff against the protected baseline. Report any pre-existing failures separately from regressions.
