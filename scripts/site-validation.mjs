import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

export const canonicalOrigin = 'https://groovemap.music';

export function normalizeInternalReference(
  reference,
  documentUrl = `${canonicalOrigin}/`,
) {
  if (
    !reference ||
    reference.startsWith('mailto:') ||
    reference.startsWith('tel:') ||
    reference.startsWith('data:')
  ) {
    return null;
  }

  if (reference.startsWith('#')) {
    const url = new URL(documentUrl);
    url.hash = reference;
    return url;
  }

  const url = new URL(reference, documentUrl);
  if (url.origin !== canonicalOrigin) {
    return null;
  }

  return url;
}

export function outputPathForUrl(outputRoot, url) {
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) {
    return path.join(outputRoot, pathname, 'index.html');
  }

  return path.join(outputRoot, pathname);
}

export async function assertReferenceExists(outputRoot, url) {
  await access(outputPathForUrl(outputRoot, url));
}

export function referencesFromHtml(html) {
  const references = [];
  const attributePattern = /\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/gu;
  for (const match of html.matchAll(attributePattern)) {
    references.push(match[1] ?? match[2]);
  }
  return references;
}

export function idsFromHtml(html) {
  const ids = new Set();
  const idPattern = /\bid=(?:"([^"]+)"|'([^']+)')/gu;
  for (const match of html.matchAll(idPattern)) {
    ids.add(match[1] ?? match[2]);
  }
  return ids;
}

export const promotedAssetRoot = 'public';

// The Pages artifact is the build output, so every promoted brand file has a
// second copy that actually ships. Map a contract destination onto it.
export function deployedAssetPath(outputRoot, destination) {
  return path.join(outputRoot, path.relative(promotedAssetRoot, destination));
}

export async function sha256File(filePath) {
  return createHash('sha256')
    .update(await readFile(filePath))
    .digest('hex');
}

async function digestOrNull(filePath) {
  try {
    return await sha256File(filePath);
  } catch {
    return null;
  }
}

// Returns the brand-provenance violations for a repository/build pair. Kept
// pure in its inputs so the drift detection itself is testable.
export async function brandProvenanceErrors({
  repositoryRoot,
  outputRoot,
  designRepository,
  designRevision,
  promotedAssets,
}) {
  const errors = [];
  const provenanceDestination = path.join(
    promotedAssetRoot,
    'brand',
    'provenance.json',
  );
  const provenancePath = path.join(repositoryRoot, provenanceDestination);
  const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));

  if (provenance.canonicalRepository !== designRepository) {
    errors.push(
      `brand provenance must name the public design repository ${designRepository}`,
    );
  }
  if (provenance.canonicalRevision !== designRevision) {
    errors.push(
      `brand provenance must name the pinned full design commit ${designRevision}`,
    );
  }
  if (JSON.stringify(provenance.assets) !== JSON.stringify(promotedAssets)) {
    errors.push(
      'brand provenance asset contract does not match the reviewed design outputs',
    );
  }

  for (const asset of promotedAssets) {
    const sourceDigest = await digestOrNull(
      path.join(repositoryRoot, asset.destination),
    );
    if (sourceDigest !== asset.sha256) {
      errors.push(
        `${asset.destination} does not match its pinned design digest`,
      );
    }

    const deployed = deployedAssetPath(outputRoot, asset.destination);
    const deployedDigest = await digestOrNull(deployed);
    if (deployedDigest !== asset.sha256) {
      errors.push(
        `${path.relative(repositoryRoot, deployed)} does not match its pinned design digest`,
      );
    }
  }

  const deployedProvenance = deployedAssetPath(
    outputRoot,
    provenanceDestination,
  );
  const provenanceDigest = await digestOrNull(provenancePath);
  const deployedProvenanceDigest = await digestOrNull(deployedProvenance);
  if (deployedProvenanceDigest !== provenanceDigest) {
    errors.push(
      `${path.relative(repositoryRoot, deployedProvenance)} does not match the reviewed brand provenance`,
    );
  }

  return errors;
}
