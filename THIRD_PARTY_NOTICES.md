# Third-party notices

## @fontsource/jura 5.3.0

The site self-hosts the Jura typeface (latin subset, weights 300, 400, and 500) from the
pinned `@fontsource/jura` package. Jura is Copyright 2019 The Jura Project Authors and is
licensed under the SIL Open Font License, Version 1.1. The font files are shipped unmodified
in the generated Pages artifact, and the license text is published at
`/licenses/jura-OFL-1.1.txt`.

- Source: <https://github.com/fontsource/font-files/tree/main/fonts/google/jura>
- License terms: <https://openfontlicense.org/open-font-license-official-text/>
- Upstream project: <https://github.com/ossobuffo/jura>

## @img/sharp-libvips-darwin-arm64 1.3.4

The locked macOS Apple-silicon development graph includes
`@img/sharp-libvips-darwin-arm64` as an optional, transitive platform package through
Astro 7.2.8 and Sharp 0.35.5. The package contains libvips and declares
`LGPL-3.0-or-later`.

- Source: <https://github.com/lovell/sharp-libvips>
- License terms: <https://www.gnu.org/licenses/lgpl-3.0.html>
- Upstream project: <https://sharp.pixelplumbing.com>

This package is a local build/image-tool dependency. GrooveMap's site uses direct static
SVG references and does not distribute libvips, Sharp, a dynamic library, or a native
Node module in the generated Pages artifact. `just license-check` verifies that boundary.
If a future build distributes the native library or uses it to create shipped derivative
assets, its LGPL notice, relinking/source-access, and any other applicable obligations
must be reassessed before publication.

## @img/sharp-libvips-linux-x64 1.3.4

The locked Ubuntu x64 CI graph includes the corresponding optional libvips platform
package through Astro 7.2.8 and Sharp 0.35.5. It also declares `LGPL-3.0-or-later`.

- Source: <https://github.com/lovell/sharp-libvips>
- License terms: <https://www.gnu.org/licenses/lgpl-3.0.html>
- Upstream project: <https://sharp.pixelplumbing.com>

It has the same build-only boundary: the generated Pages artifact contains no libvips,
Sharp, dynamic library, or native Node module. Distribution requires a fresh obligations
review.

## sharp 0.35.5 and the PNG previews

`sharp` is now a direct, exactly pinned development dependency (it was already present
through Astro). `just render-previews` uses it to derive `og-image.png` and
`apple-touch-icon.png` from the promoted SVGs. The shipped artifact contains only the
resulting PNG pixels; the sharp and libvips binaries, libraries, and native modules are still
not distributed, so the build-only boundary above is unchanged and `just license-check`
continues to enforce it.
