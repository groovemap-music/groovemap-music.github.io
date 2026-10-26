import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { repositoryRoot, sha256File } from './filesystem.mjs';

// Raster previews exist because Facebook, X, LinkedIn and Slack do not render SVG
// social images and iOS ignores SVG touch icons. The promoted SVGs stay the source of
// truth; this script derives the PNGs from them and records the source digest and the
// pinned tool versions so the output is reproducible.
export const previews = [
  {
    destination: 'public/brand/og-image.png',
    height: 630,
    source: 'public/brand/og-image.svg',
    width: 1200,
  },
  {
    destination: 'public/brand/apple-touch-icon.png',
    height: 180,
    source: 'public/brand/icon-dark.svg',
    width: 180,
  },
];
export const previewManifestPath = 'public/brand/previews.json';

export async function renderPreview({ height, source, width }) {
  return sharp(await readFile(path.join(repositoryRoot, source)), {
    density: 96,
  })
    .resize(width, height, { fit: 'fill' })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function manifest() {
  return {
    generatedBy: 'scripts/render-previews.mjs',
    previews: await Promise.all(
      previews.map(async ({ destination, height, source, width }) => ({
        destination,
        height,
        source,
        sourceSha256: await sha256File(path.join(repositoryRoot, source)),
        width,
      })),
    ),
    tool: {
      libvips: sharp.versions.vips,
      sharp: sharp.versions.sharp,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const preview of previews) {
    await writeFile(
      path.join(repositoryRoot, preview.destination),
      await renderPreview(preview),
    );
  }
  await writeFile(
    path.join(repositoryRoot, previewManifestPath),
    `${JSON.stringify(await manifest(), null, 2)}\n`,
    'utf8',
  );
  console.log(`Rendered ${previews.length} previews.`);
}
