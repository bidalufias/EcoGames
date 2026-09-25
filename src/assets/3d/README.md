# 3D images

Game art (cover art, Waste Sorter items, Eco Memory cards) comes from Microsoft's
[Fluent Emoji](https://github.com/microsoft/fluentui-emoji) 3D set, MIT licensed (see
`LICENSE`). The files are 256×256 WebP renders, taken from the npm package
`@lobehub/fluent-emoji-3d`, where each file is named by its emoji code point.

## Adding an image

1. Find the emoji's code point, for example 🥭 is `1f96d`.
2. Download the package and copy the file here under a short kebab-case name:

   ```bash
   npm pack @lobehub/fluent-emoji-3d && tar xzf lobehub-fluent-emoji-3d-*.tgz
   cp package/assets/1f96d.webp src/assets/3d/mango.webp   # some files end in -fe0f
   ```

3. Add the name to `IMAGE_NAMES` in `src/ui/images.ts`. A unit test checks that the
   list and the files match.

Keep to this one set so all art shares a style. Only copy the images the games use.
