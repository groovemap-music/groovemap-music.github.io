# GrooveMap organization site

This is the static Astro source for [groovemap.music](https://groovemap.music), the
organization website for `groovemap-music`. It introduces GrooveMap's music knowledge
graph and links visitors to the project's public work.

## Architecture boundary

Astro prerenders every route to static HTML. There is no server adapter, client-side
application runtime, secret, authentication flow, analytics collector, or environment-
dependent content. The canonical URL is `https://groovemap.music`; this organization
site is served from `/`, so `astro.config.mjs` intentionally has no `base` property.

Canonical editable design tokens and templates live in the private
`groovemap-music/infra` repository. Files under `public/brand` are promoted,
deterministic render outputs. `public/brand/provenance.json` records the source revision,
path, and SHA-256 digest for every promoted asset.

## Setup and development

Install the pinned toolchain with mise, then use the stable `just` interface:

```sh
mise install
just setup
just dev
```

The package lock is authoritative. `just setup` uses `npm ci`; do not replace it with an
unlocked install in CI.

## Validation and build

```sh
just check
just test
just build
just preview
```

`just check` runs formatting, Astro-aware lint and type checks, unit tests, a production
build, generated HTML/accessibility/link/asset/metadata validation, and a locked-
dependency license policy check. `just audit` is separate because it intentionally
contacts an advisory service.

The generated site is written to ignored `dist/`. Local preview is a static-file check;
it does not emulate GitHub Pages configuration or DNS.

## Deployment

The official Astro/Pages workflow is active at `.github/workflows/pages.yml` and deploys
validated `main` builds through GitHub Actions. It uses only fully pinned Actions, the
`github-pages` environment, deployment concurrency, and the minimum deployment
permissions (`contents: read`, `pages: write`, `id-token: write`).

`public/CNAME` documents the custom domain and follows Astro's deployment guidance. Pages
settings are managed from `groovemap-music/infra`; Cloudflare records are managed from the
homelab Cloudflare module. A CNAME file alone does not mutate either system.

## Versioning, release, and license

This website is an unversioned deployment unit. It does not publish a package or other
meaningful versioned artifact, so Commitizen bump and release recipes are intentionally
absent. A Pages deployment is not a product release.

The first-party source is licensed under the [MIT License](LICENSE). Promoted brand SVGs
use system font names and embed no font
software; the source monorepo's unnotified Space Grotesk binaries were not promoted.

See the [documentation index](docs/README.md) for the GitHub Pages runbook.
