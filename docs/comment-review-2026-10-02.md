# Code comment review — 2026-10-02

Reviewed the live source at `b8e22f1d020df1ebf9f54bb26fc7c9490a598b2e`
for `gm-site-2uh`. No genuinely weak comments were identified; source comments
and behaviour remain unchanged. This record supplies the audit evidence rather
than introducing edits merely to create a diff.

## Reviewer-required Action provenance

The previous commit `6741e9e53f7f6b513474373fe47944f1c8d65b8f` removed five
Action version annotations. Review gate `gm-site-3r1` requested their restoration
because they provide useful provenance. This branch starts from the current
accepted source and does not incorporate that rejected deletion.

All five annotations in `.github/workflows/pages.yml` remain unchanged:

| Action                          | Retained annotation |
| ------------------------------- | ------------------- |
| `actions/checkout`              | `v7.0.1`            |
| `actions/setup-node`            | `v7.0.0`            |
| `actions/configure-pages`       | `v6.0.0`            |
| `actions/upload-pages-artifact` | `v5.0.0`            |
| `actions/deploy-pages`          | `v5.0.1`            |

Each action remains pinned to its original full commit revision. The version
annotation explains the immutable pin to a reviewer without weakening it.

## Live-source findings

| Comment scope                                            | Evidence and disposition                                                                                                                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/site-validation.mjs`, above `deployedAssetPath` | The function maps a promoted `public/` destination to its second copy under the build output. The comment explains why both source and shipped artifacts require validation; retained.             |
| `tests/site-validation.test.mjs`, above `brandFixture`   | The fixture creates temporary source/build pairs with matching promoted asset digests and provenance before each test introduces a drift. The comment identifies the baseline invariant; retained. |
| `Justfile` setup and CI comments                         | `setup` runs locked `npm ci`; `ci-check` covers source/application checks, while separate recipes cover built artifacts and policy. Descriptions match the command bodies; retained.               |
| `Justfile` audit and install comments                    | Advisory queries remain separate from the local check. `install-check` validates an already built static artifact rather than claiming an installable package or rebuilding it; retained.          |
| Shell execution and promoted provenance                  | The npm wrapper shebang remains intact. Promoted brand outputs and their design revision/digest metadata were not independently edited.                                                            |

No workflow, executable code, Action annotation, dependency, canonical brand
source, promoted output, page content, DNS setting, or deployment permission
changed. The existing complete `just check` validates the audit handoff; no new
behaviour tests are required for an evidence-only change.
