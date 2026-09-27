# Crafted nature game images

The 104 game images use a shared miniature 3D style: rounded forms, matte surfaces,
soft upper-left lighting, forest green, lagoon teal, cream, honey and terracotta.
Natural object colors and recognizable silhouettes take precedence over the palette.

The visual refresh was generated with Codex's built-in image generator. The user
authorized this route after the requested Higgsfield GPT Image 2.5 endpoint returned
"Requires basic plan or higher." The built-in tool does not expose a model selector,
so these images are not attributed to a verified model version.

Each asset was generated separately, using the accepted tree as the style reference.
Transparent PNG masters were trimmed only for empty padding, scaled into the original
occupied bounds, and encoded as 256 by 256 WebP images. Filenames and registrations
remain stable. The canoe stays above River Rescue's existing texture crop.

## Adding an image

1. Generate one isolated, complete subject with a transparent background. Match the
   tree's material, lighting and proportions. Avoid scenery, cast shadows, borders,
   watermarks and text unless the subject requires a symbol or letter.
2. Inspect the image at 32 and 64 pixels on light and dark surfaces. Keep meaningful
   colors, anatomy and orientation clear. Match the existing sprite's visible footprint.
3. Export a 256 by 256 WebP with alpha, and use a short kebab-case filename.
4. Register a new name in `src/ui/images.ts` only when a new asset is needed. The
   existing unit test verifies that registrations and files match.

The earlier art came from Microsoft's Fluent Emoji 3D set through
`@lobehub/fluent-emoji-3d`. Its MIT notice is retained in `LICENSE` for provenance.
The official MGTC logo, Lucide UI icons and Plus Jakarta Sans remain separate assets.
