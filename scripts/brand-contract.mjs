export const designRepository = 'https://github.com/groovemap-music/design';
export const designRevision = '41be7cbe738f40df0c75ad7065475e91d6cc2aa4';

export function brandContractErrors({
  assetDigests,
  designRepository,
  designRevision,
  deployedProvenancePath,
  promotedAssets,
  provenance,
  provenanceMatchesDeployment,
}) {
  const errors = [];
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

  for (const {
    asset,
    deployedDigest,
    deployedPath,
    sourceDigest,
  } of assetDigests) {
    if (sourceDigest !== asset.sha256) {
      errors.push(
        `${asset.destination} does not match its pinned design digest`,
      );
    }
    if (deployedDigest !== asset.sha256) {
      errors.push(`${deployedPath} does not match its pinned design digest`);
    }
  }

  if (!provenanceMatchesDeployment) {
    errors.push(
      `${deployedProvenancePath} does not match the reviewed brand provenance`,
    );
  }
  return errors;
}

export const promotedAssets = [
  {
    destination: 'public/brand/favicon.svg',
    sha256: 'f3d8bf527b210a08f1bc37f94b3cff638f7702313c57829dc4eeb59c166af7d0',
    source: 'brand/assets/favicon.svg',
  },
  {
    destination: 'public/brand/app-icon-192.svg',
    sha256: '8f3dead165a94360282342d0ec5ce3671f6cea8c0e49f9064d940178d7602603',
    source: 'brand/assets/app-icon-192.svg',
  },
  {
    destination: 'public/brand/app-icon-512.svg',
    sha256: '1bb627718ba623a1ff0caf4db09a2b71d3e949d10a43d34ba7367a205edccf9a',
    source: 'brand/assets/app-icon-512.svg',
  },
  {
    destination: 'public/brand/og-image.svg',
    sha256: '57e52bdf2e94a0e760c46cd3265fb9869572d19b1ae727f7d95aea42c67c3d31',
    source: 'brand/assets/og-image.svg',
  },
  {
    destination: 'public/brand/tokens.css',
    sha256: 'beb1fa2357e884cc702a0cf19176203de88f614f3ae10ce983699bea5353a92c',
    source: 'brand/assets/tokens.css',
  },
  {
    destination: 'public/site.webmanifest',
    sha256: 'bbb5a3a8484e898bc964bdcda33a5c174a678cd1029728405ec3445cf55bf4f1',
    source: 'brand/assets/site.webmanifest',
  },
];
