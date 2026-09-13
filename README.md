# GrooveMap organization site

This is the static Astro source for [groovemap.music](https://groovemap.music), the
organization website for `groovemap-music`. It introduces GrooveMap's music knowledge
graph and links visitors to the project's public work.

## Architecture boundary

Astro prerenders every route to static HTML. There is no server adapter, client-side
application runtime, secret, authentication flow, analytics collector, or environment-
dependent content. The canonical URL is `https://groovemap.music`; this organization
site is served from `/`, so `astro.config.mjs` intentionally has no `base` property.

Canonical editable design tokens and templates live in the public
[`groovemap-music/design`](https://github.com/groovemap-music/design) repository. Files
under `public/brand` are byte-identical deterministic render outputs promoted from the
full design commit recorded in [`public/brand/provenance.json`](public/brand/provenance.json).
That file also records each source path and SHA-256 digest. Set
`GROOVEMAP_DESIGN_REPO` to a clean checkout at
`59c9fd3c8bbdfa676e0b7bb3d463fc766c1f3c0d` before running `just promote-brand`; the
promotion command refuses any other revision. Use of the GrooveMap name and logos is
governed separately by the design repository's
[trademark-use policy](https://github.com/groovemap-music/design/blob/main/TRADEMARKS.md).

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

`just check` runs formatting, Astro-aware lint and type checks, unit and automation
contract tests, one production build, generated HTML/accessibility/link/asset/metadata validation,
locked-dependency license policy, and repository/history secret scans. `just install-check`
validates an existing build without rebuilding it. `just audit` is separate because it
intentionally contacts an advisory service.

The generated site is written to ignored `dist/`. Local preview is a static-file check;
it does not emulate GitHub Pages configuration or DNS.

## Deployment

The official Astro/Pages workflow is active at `.github/workflows/pages.yml` and deploys
validated `main` builds through GitHub Actions. CI and the Pages validation gate both pin
the public `groovemap-music/automation` reusable workflow by a full reviewed commit.
Ordinary and Dependabot-authored pull requests use the same required CI job graph with no
actor-specific skips. Pages uses only fully pinned Actions, the `github-pages`
environment, deployment concurrency, and job-scoped minimum permissions (`contents:
read` for validation/build; `pages: write` and `id-token: write` for deployment).

`public/CNAME` documents the custom domain and follows Astro's deployment guidance. Pages
settings are managed from the private `groovemap-music/infra` repository; Cloudflare
records are managed from the homelab Cloudflare module. A CNAME file alone does not
mutate either system.

## Versioning, release, and license

This website is an unversioned deployment unit. It does not publish a package or other
meaningful versioned artifact, so Commitizen bump and release recipes are intentionally
absent. A Pages deployment is not a product release.

The first-party source is licensed under the [MIT License](LICENSE). Promoted brand SVGs
use system font names and embed no font
software; the source monorepo's unnotified Space Grotesk binaries were not promoted.

See the [documentation index](docs/README.md) for the GitHub Pages runbook.
