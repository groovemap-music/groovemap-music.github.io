# GitHub Pages operations runbook

The site uses GitHub Actions to deploy the static Astro build from `main`:

- deployment workflow: `.github/workflows/pages.yml`;
- custom domain: `groovemap.music`;
- Pages configuration owner: `groovemap-music/infra`;
- DNS configuration owner: the homelab Cloudflare OpenTofu module; and
- canonical output: static files under `dist/`.

Do not edit Pages or DNS settings in provider dashboards. Review the corresponding
OpenTofu plan before each apply.

## Change sequence

1. Revalidate the tree for secrets, licensing, attribution, accessibility, metadata,
   canonical URLs, and intended public exposure.
2. Update the GitHub Pages configuration in `groovemap-music/infra` before changing DNS.
3. Inventory the live apex and `www` DNS records, TTLs, provider, and rollback values.
4. Review and approve the complete DNS plan before applying it.
5. After DNS propagates, verify the Pages URL, apex and `www` behavior, certificate
   issuance, asset paths, internal links, responsive layout, and the 404 page.
6. Enable HTTPS enforcement only after certificate health is confirmed.

Keep the custom domain configured in GitHub Pages before adding or replacing DNS records; this ordering
avoids a domain-takeover window. Do not add wildcard DNS records.

## Verification

Run and record:

```sh
just setup
just check
git status --short
gh repo view groovemap-music/groovemap-music.github.io \
  --json nameWithOwner,visibility,defaultBranchRef,url
gh api repos/groovemap-music/groovemap-music.github.io/pages
curl --fail --silent --show-error --location --output /dev/null https://groovemap.music/
curl --fail --silent --show-error --location --output /dev/null https://groovemap.music/about/
curl --fail --silent --show-error --location --output /dev/null https://groovemap.music/404.html
```

Inspect desktop and mobile layouts, keyboard navigation, reduced-motion behavior, the
rendered Open Graph image, sitemap, robots, manifest, favicon, and canonical URLs. An
empty post-apply OpenTofu plan is required after activation.
