import path from 'node:path';

import { brandContractErrors } from './brand-contract.mjs';
import { promotedAssetRoot, deployedAssetPath } from './site-validation.mjs';
import { readJson, sha256FileOrNull } from './filesystem.mjs';

export async function brandProvenanceErrors({
  repositoryRoot,
  outputRoot,
  designRepository,
  designRevision,
  promotedAssets,
}) {
  const provenanceDestination = path.join(
    promotedAssetRoot,
    'brand',
    'provenance.json',
  );
  const provenancePath = path.join(repositoryRoot, provenanceDestination);
  const deployedProvenance = deployedAssetPath(
    outputRoot,
    provenanceDestination,
  );
  const provenance = await readJson(provenancePath);
  const assetDigests = await Promise.all(
    promotedAssets.map(async (asset) => {
      const deployed = deployedAssetPath(outputRoot, asset.destination);
      return {
        asset,
        deployedDigest: await sha256FileOrNull(deployed),
        deployedPath: path.relative(repositoryRoot, deployed),
        sourceDigest: await sha256FileOrNull(
          path.join(repositoryRoot, asset.destination),
        ),
      };
    }),
  );
  const [provenanceDigest, deployedProvenanceDigest] = await Promise.all([
    sha256FileOrNull(provenancePath),
    sha256FileOrNull(deployedProvenance),
  ]);
  return brandContractErrors({
    assetDigests,
    designRepository,
    designRevision,
    deployedProvenancePath: path.relative(repositoryRoot, deployedProvenance),
    promotedAssets,
    provenance,
    provenanceMatchesDeployment: deployedProvenanceDigest === provenanceDigest,
  });
}
