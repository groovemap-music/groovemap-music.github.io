# GrooveMap organization site

This is the static Astro source for [groovemap.music](https://groovemap.music), the
organization website for `groovemap-music`. It introduces GrooveMap's music knowledge
graph and links visitors to the project's public work.

This README is for contributors who want to run, change, or deploy the site. Visitors
can just open the site. The site is plain static pages: no server, no accounts, no
secrets.

## Quick start

You need [mise](https://mise.jdx.dev) to install the pinned Node, npm, and `just`
versions (`.mise.toml`).

```sh
mise install
just setup   # npm ci: install exactly what package-lock.json lists
just dev     # start the local dev server; open the URL it prints
just check   # run every check before you open a pull request
```

The package lock is authoritative. `just setup` uses `npm ci`; do not replace it with an
unlocked install in CI.

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
`41be7cbe738f40df0c75ad7065475e91d6cc2aa4` before running `just promote-brand`; the
promotion command refuses any other revision. Use of the GrooveMap name and logos is
governed separately by the design repository's
[trademark-use policy](https://github.com/groovemap-music/design/blob/main/TRADEMARKS.md).

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

The official [Astro/Pages workflow](.github/workflows/pages.yml) deploys validated `main`
builds through GitHub Actions. CI and the Pages validation gate both pin the public
[`groovemap-music/automation`](https://github.com/groovemap-music/automation) reusable workflow
by a full reviewed commit.
Ordinary and Dependabot-authored pull requests use the same required CI job graph with no
actor-specific skips. Pages uses only fully pinned Actions, the `github-pages`
environment, deployment concurrency, and job-scoped minimum permissions (`contents:
read` for validation/build; `pages: write` and `id-token: write` for deployment).

`public/CNAME` documents the custom domain and follows Astro's deployment guidance. Pages
settings are managed from the private `groovemap-music/infra` repository (`tofu/pages.tf`);
the Cloudflare DNS records are managed from the private `SimplicityGuy/cloud` repository
(`infra/opentofu/cloudflare/cloudflare_dns_external.tf`). Both repositories are private, so
you may not be able to open them. A CNAME file alone does not mutate either system.

The site is live at <https://groovemap.music>. Its apex and `www` DNS records, and the
GitHub Pages domain-verification record, are created only when the
`cloudflare_zone_groovemap` and `groovemap_github_pages_verification_token` variables are
set in that repository.

## Versioning, release, and license

This website is an unversioned deployment unit. It does not publish a package or other
meaningful versioned artifact, so Commitizen bump and release recipes are intentionally
absent. A Pages deployment is not a product release.

The first-party source is licensed under the [MIT License](LICENSE). Promoted brand SVGs are text-free (the wordmark is outlined) and embed no font software;
their bytes and source provenance are verified against the pinned public design revision
during `just check`. The site UI sets the lowercase `groovemap` wordmark in Jura (SIL OFL
1.1), self-hosted from the pinned `@fontsource/jura` package; the font license is recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

`public/brand/og-image.png` and `public/brand/apple-touch-icon.png` are derived from the
promoted SVGs by `just render-previews` (pinned `sharp`), because several social platforms do
not render SVG images. `public/brand/previews.json` records each source digest and the tool
versions; `just check` fails if a source SVG changes without regenerating the previews.

See the [documentation index](docs/README.md) for the GitHub Pages runbook.
