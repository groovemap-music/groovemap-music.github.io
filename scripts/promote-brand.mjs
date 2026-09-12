import { execFileSync } from 'node:child_process';
import { copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  designRepository,
  designRevision,
  promotedAssets,
} from './brand-contract.mjs';
import { repositoryRoot, sha256File } from './filesystem.mjs';
const designRoot = process.env.GROOVEMAP_DESIGN_REPO;

if (!designRoot) {
  throw new Error(
    'GROOVEMAP_DESIGN_REPO must point to the clean checkout of the pinned design commit',
  );
}

function git(...args) {
  return execFileSync('git', ['-C', designRoot, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

if (git('rev-parse', 'HEAD') !== designRevision) {
  throw new Error(`design checkout must be pinned to ${designRevision}`);
}
if (git('status', '--short') !== '') {
  throw new Error('design checkout must be clean before promotion');
}

execFileSync(
  process.execPath,
  [path.join(designRoot, 'brand', 'render.mjs'), '--check'],
  { stdio: 'inherit' },
);

for (const asset of promotedAssets) {
  const sourcePath = path.join(designRoot, asset.source);
  const sourceDigest = await sha256File(sourcePath);
  if (sourceDigest !== asset.sha256) {
    throw new Error(
      `${asset.source} does not match its reviewed design digest`,
    );
  }
}

for (const asset of promotedAssets) {
  await copyFile(
    path.join(designRoot, asset.source),
    path.join(repositoryRoot, asset.destination),
  );
}

const provenance = {
  assets: promotedAssets,
  canonicalRepository: designRepository,
  canonicalRevision: designRevision,
  editableSources: ['brand/tokens.json', 'brand/templates/'],
  generatedBy: 'brand/render.mjs',
};
await writeFile(
  path.join(repositoryRoot, 'public', 'brand', 'provenance.json'),
  `${JSON.stringify(provenance, null, 2)}\n`,
  'utf8',
);

console.log(`Promoted ${promotedAssets.length} assets from ${designRevision}.`);
