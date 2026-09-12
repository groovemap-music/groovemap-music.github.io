import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { brandProvenanceErrors } from '../scripts/brand-validation.mjs';
import {
  canonicalOrigin,
  deployedAssetPath,
  idsFromHtml,
  normalizeInternalReference,
  outputPathForUrl,
  referencesFromHtml,
} from '../scripts/site-validation.mjs';
import {
  brandContractErrors,
  designRepository,
  designRevision,
  promotedAssets,
} from '../scripts/brand-contract.mjs';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

test('normalizes only same-origin site references', () => {
  assert.equal(
    normalizeInternalReference('/about/', `${canonicalOrigin}/`).href,
    `${canonicalOrigin}/about/`,
  );
  assert.equal(
    normalizeInternalReference('#details', `${canonicalOrigin}/about/`).href,
    `${canonicalOrigin}/about/#details`,
  );
  assert.equal(
    normalizeInternalReference('https://github.com/groovemap-music'),
    null,
  );
  assert.equal(normalizeInternalReference('mailto:test@example.com'), null);
});

test('maps routes and assets to generated output paths', () => {
  assert.equal(
    outputPathForUrl('/tmp/dist', new URL('/', canonicalOrigin)),
    '/tmp/dist/index.html',
  );
  assert.equal(
    outputPathForUrl('/tmp/dist', new URL('/about/', canonicalOrigin)),
    '/tmp/dist/about/index.html',
  );
  assert.equal(
    outputPathForUrl(
      '/tmp/dist',
      new URL('/brand/favicon.svg', canonicalOrigin),
    ),
    '/tmp/dist/brand/favicon.svg',
  );
});

test('extracts references and fragment identifiers from HTML', () => {
  const html =
    '<main id="content"><a href="#content"><img src="/brand/favicon.svg" alt=""></a></main>';
  assert.deepEqual(referencesFromHtml(html), [
    '#content',
    '/brand/favicon.svg',
  ]);
  assert.deepEqual([...idsFromHtml(html)], ['content']);
});

test('keeps the Astro root-site and active deployment contracts', async () => {
  const astroConfig = await readFile(
    path.join(repositoryRoot, 'astro.config.mjs'),
    'utf8',
  );
  assert.match(astroConfig, /site: 'https:\/\/groovemap\.music'/u);
  assert.doesNotMatch(astroConfig, /\bbase\s*:/u);

  const pagesWorkflow = await readFile(
    path.join(repositoryRoot, '.github', 'workflows', 'pages.yml'),
    'utf8',
  );
  assert.match(pagesWorkflow, /contents: read/u);
  assert.match(pagesWorkflow, /pages: write/u);
  assert.match(pagesWorkflow, /id-token: write/u);
  assert.match(pagesWorkflow, /environment:\n\s+name: github-pages/u);
  assert.match(pagesWorkflow, /uses: [^@]+@[0-9a-f]{40}/u);
  assert.match(pagesWorkflow, /uses: actions\/setup-node@[0-9a-f]{40}/u);
  assert.match(
    pagesWorkflow,
    /uses: actions\/upload-pages-artifact@[0-9a-f]{40}/u,
  );
  assert.doesNotMatch(pagesWorkflow, /uses: withastro\/action@/u);
});

test('declares an unversioned non-publishable package with no release hooks', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
  );
  assert.equal(manifest.private, true);
  assert.equal(manifest.version, '0.0.0-private');
  assert.equal(manifest.packageManager, 'npm@12.0.2');
  assert.equal(manifest.scripts.release, undefined);
  assert.equal(manifest.devDependencies?.commitizen, undefined);
});

const digest = (contents) =>
  createHash('sha256').update(contents).digest('hex');

// Builds a throwaway repository/build pair whose promoted brand files satisfy
// the pinned contract, so each test can introduce exactly one drift.
async function brandFixture() {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'brand-'));
  const outputRoot = path.join(repositoryRoot, 'dist');
  const assets = promotedAssets.map((asset, index) => {
    const contents = `promoted-brand-asset-${index}`;
    return { ...asset, contents, sha256: digest(contents) };
  });
  const contract = assets.map(({ contents: _contents, ...asset }) => asset);

  for (const asset of assets) {
    for (const target of [
      path.join(repositoryRoot, asset.destination),
      deployedAssetPath(outputRoot, asset.destination),
    ]) {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, asset.contents, 'utf8');
    }
  }

  const provenance = `${JSON.stringify(
    {
      assets: contract,
      canonicalRepository: designRepository,
      canonicalRevision: designRevision,
      editableSources: ['brand/tokens.json', 'brand/templates/'],
      generatedBy: 'brand/render.mjs',
    },
    null,
    2,
  )}\n`;
  for (const target of [
    path.join(repositoryRoot, 'public', 'brand', 'provenance.json'),
    path.join(outputRoot, 'brand', 'provenance.json'),
  ]) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, provenance, 'utf8');
  }

  const check = () =>
    brandProvenanceErrors({
      designRepository,
      designRevision,
      outputRoot,
      promotedAssets: contract,
      repositoryRoot,
    });

  return { assets, check, outputRoot, repositoryRoot };
}

test('maps every promoted brand file onto its deployed copy', () => {
  assert.equal(
    deployedAssetPath('/tmp/dist', 'public/brand/favicon.svg'),
    '/tmp/dist/brand/favicon.svg',
  );
  assert.equal(
    deployedAssetPath('/tmp/dist', 'public/site.webmanifest'),
    '/tmp/dist/site.webmanifest',
  );
});

test('validates brand contract state without filesystem access', () => {
  const [asset] = promotedAssets;
  assert.deepEqual(
    brandContractErrors({
      assetDigests: [
        {
          asset,
          deployedDigest: asset.sha256,
          deployedPath: 'dist/brand/favicon.svg',
          sourceDigest: asset.sha256,
        },
      ],
      designRepository,
      designRevision,
      deployedProvenancePath: 'dist/brand/provenance.json',
      promotedAssets: [asset],
      provenance: {
        assets: [asset],
        canonicalRepository: designRepository,
        canonicalRevision: designRevision,
      },
      provenanceMatchesDeployment: true,
    }),
    [],
  );
});

test('accepts a build whose brand files match the pinned design digests', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  assert.deepEqual(await fixture.check(), []);
});

test('rejects drift in a promoted brand source file', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  const [asset] = fixture.assets;
  await writeFile(
    path.join(fixture.repositoryRoot, asset.destination),
    'tampered',
    'utf8',
  );

  assert.deepEqual(await fixture.check(), [
    `${asset.destination} does not match its pinned design digest`,
  ]);
});

test('rejects drift in the deployed copy of a promoted brand file', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  const [asset] = fixture.assets;
  const deployed = deployedAssetPath(fixture.outputRoot, asset.destination);
  await writeFile(deployed, 'tampered', 'utf8');

  assert.deepEqual(await fixture.check(), [
    `${path.relative(fixture.repositoryRoot, deployed)} does not match its pinned design digest`,
  ]);
});

test('rejects a missing deployed brand file', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  const [asset] = fixture.assets;
  const deployed = deployedAssetPath(fixture.outputRoot, asset.destination);
  await rm(deployed);

  assert.deepEqual(await fixture.check(), [
    `${path.relative(fixture.repositoryRoot, deployed)} does not match its pinned design digest`,
  ]);
});

test('rejects deployed provenance that diverges from the reviewed source', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  const deployed = path.join(fixture.outputRoot, 'brand', 'provenance.json');
  await writeFile(deployed, '{"canonicalRevision": "0"}\n', 'utf8');

  assert.deepEqual(await fixture.check(), [
    `${path.relative(fixture.repositoryRoot, deployed)} does not match the reviewed brand provenance`,
  ]);
});

test('rejects provenance that unpins the design repository or commit', async (t) => {
  const fixture = await brandFixture();
  t.after(() => rm(fixture.repositoryRoot, { force: true, recursive: true }));

  const errors = await brandProvenanceErrors({
    designRepository: 'https://github.com/groovemap-music/other',
    designRevision: '0000000000000000000000000000000000000000',
    outputRoot: fixture.outputRoot,
    promotedAssets: [],
    repositoryRoot: fixture.repositoryRoot,
  });

  assert.deepEqual(errors, [
    'brand provenance must name the public design repository https://github.com/groovemap-music/other',
    'brand provenance must name the pinned full design commit 0000000000000000000000000000000000000000',
    'brand provenance asset contract does not match the reviewed design outputs',
  ]);
});
