# GitHub Pages activation runbook

The repository is public, but its deployment controls remain intentionally inactive:

- Pages source is not enabled;
- the custom domain is not configured in GitHub Pages;
- apex and `www` DNS records are not managed for Pages;
- HTTPS enforcement is not enabled; and
- the deployment workflow remains staged as `.github/workflows/pages.yml.disabled`.

Public repository visibility does not authorize any of those external changes.

## Activation sequence

1. Revalidate the tree for secrets, licensing, attribution, accessibility, metadata,
   canonical URLs, and intended public exposure.
2. Configure GitHub Pages to use GitHub Actions with the custom domain
   `groovemap.music`.
3. Rename `.github/workflows/pages.yml.disabled` to `pages.yml` in a reviewed change.
4. Inventory the live apex and `www` DNS records, TTLs, provider, and rollback values.
5. Review and approve the complete DNS plan before applying it.
6. After DNS propagates, verify the Pages URL, apex and `www` behavior, certificate
   issuance, asset paths, internal links, responsive layout, and the 404 page.
7. Enable HTTPS enforcement only after certificate health is confirmed.

Configure the custom domain in GitHub Pages before adding DNS records; this ordering
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
