# Repository instructions

This repository is the static GrooveMap organization site. It has no server runtime and
must never depend on secrets at build or run time.

- Use the exact Node/npm versions declared in `.node-version` and `package.json`.
- Run `just check` before proposing a change.
- Keep `astro.config.mjs` in static-output mode with `site` set to
  `https://groovemap.music`; do not add a repository `base` path.
- Treat `groovemap-music/design` as the editable source for files under `public/brand`.
  Set `GROOVEMAP_DESIGN_REPO` to a clean local checkout at
  `59c9fd3c8bbdfa676e0b7bb3d463fc766c1f3c0d` and use `just promote-brand`; do not
  edit promoted outputs independently.
- Keep internal links root-relative and accessible without client-side JavaScript.
- Keep the Pages workflow on the official Astro/GitHub Actions deployment path with
  least-privilege permissions. Pages and DNS settings remain declarative as documented in
  `docs/pages-runbook.md`.
