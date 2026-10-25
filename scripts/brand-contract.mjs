export const designRepository = 'https://github.com/groovemap-music/design';
export const designRevision = '7abe13ad3e22e81b5437eb92acb8db998730e11a';

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
    sha256: '33fb91b68f74e5bca9ccd4e63e865dd1becfff95ac2d46053e41f5c92a38bca6',
    source: 'brand/assets/favicon.svg',
  },
  {
    destination: 'public/brand/app-icon-192.svg',
    sha256: '48585bd9c04a3e2aabfecd57f3119a87fedf4b66e21dfb29aab20803fb704429',
    source: 'brand/assets/app-icon-192.svg',
  },
  {
    destination: 'public/brand/app-icon-512.svg',
    sha256: '6250aed267b6ad0ebfa6200e688b7c424a999fc2a2a464448c451a5d4522b6cd',
    source: 'brand/assets/app-icon-512.svg',
  },
  {
    destination: 'public/brand/og-image.svg',
    sha256: 'e4bec1252275341ba7bf0a2da8f02f98f3c7bb0f2308947967e4996ef6bc01cf',
    source: 'brand/assets/og-image.svg',
  },
  {
    destination: 'public/brand/tokens.css',
    sha256: '94eeb3b70ecdb01abde8983e28bb9a30e8677aed3c2c7025efe0968812463455',
    source: 'brand/assets/tokens.css',
  },
  {
    destination: 'public/site.webmanifest',
    sha256: '5ad2c96f0cfcc98417381342ce364ad581bb495ce0437110c50effcc531898f9',
    source: 'brand/assets/site.webmanifest',
  },
];
