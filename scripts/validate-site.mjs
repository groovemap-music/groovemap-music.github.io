import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { HtmlValidate } from 'html-validate';

import { brandProvenanceErrors } from './brand-validation.mjs';
import {
  canonicalOrigin,
  idsFromHtml,
  normalizeInternalReference,
  outputPathForUrl,
  referencesFromHtml,
} from './site-validation.mjs';
import {
  filesUnder,
  pathExists,
  readJson,
  repositoryRoot,
} from './filesystem.mjs';
import {
  designRepository,
  designRevision,
  promotedAssets,
} from './brand-contract.mjs';

const outputRoot = path.join(repositoryRoot, 'dist');

async function validateBrandProvenance(report) {
  for (const message of await brandProvenanceErrors({
    designRepository,
    designRevision,
    outputRoot,
    promotedAssets,
    repositoryRoot,
  })) {
    report(message);
  }
}

async function validateHtmlFile(htmlPath, htmlValidate, report) {
  const relativePath = path.relative(outputRoot, htmlPath);
  const pathname =
    relativePath === 'index.html'
      ? '/'
      : `/${relativePath.replace(/index\.html$/u, '').replaceAll(path.sep, '/')}`;
  const documentUrl = new URL(pathname, canonicalOrigin).href;
  const html = await readFile(htmlPath, 'utf8');
  const result = await htmlValidate.validateString(html, relativePath);

  if (!result.valid) {
    for (const validationResult of result.results) {
      for (const message of validationResult.messages) {
        report(
          `${relativePath}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`,
        );
      }
    }
  }

  const requiredMetadata = [
    /<title>[^<]+<\/title>/u,
    /<meta name="description" content="[^"]+">/u,
    /<link rel="canonical" href="https:\/\/groovemap\.music\/[^"]*">/u,
    /<meta property="og:title" content="[^"]+">/u,
    /<meta property="og:description" content="[^"]+">/u,
    /<meta property="og:image" content="https:\/\/groovemap\.music\/brand\/og-image\.svg">/u,
    /<link rel="manifest" href="\/site\.webmanifest">/u,
  ];
  for (const requirement of requiredMetadata) {
    if (!requirement.test(html)) {
      report(
        `${relativePath} is missing required metadata matching ${requirement}`,
      );
    }
  }

  const localIds = idsFromHtml(html);
  for (const reference of referencesFromHtml(html)) {
    const url = normalizeInternalReference(reference, documentUrl);
    if (!url) continue;

    if (
      url.pathname === new URL(documentUrl).pathname &&
      url.hash &&
      !localIds.has(url.hash.slice(1))
    ) {
      report(`${relativePath} references missing fragment ${url.hash}`);
      continue;
    }

    if (!(await pathExists(outputPathForUrl(outputRoot, url)))) {
      report(`${relativePath} references missing output ${url.pathname}`);
    }
  }
}

async function validateStaticContract(report) {
  const expectedText = new Map([
    ['CNAME', 'groovemap.music\n'],
    [
      'robots.txt',
      'User-agent: *\nAllow: /\n\nSitemap: https://groovemap.music/sitemap-index.xml\n',
    ],
  ]);
  for (const [relativePath, expected] of expectedText) {
    const actual = await readFile(path.join(outputRoot, relativePath), 'utf8');
    if (actual !== expected)
      report(`${relativePath} does not match the approved static contract`);
  }

  const manifest = await readJson(path.join(outputRoot, 'site.webmanifest'));
  if (manifest.name !== 'GrooveMap' || manifest.start_url !== undefined) {
    report(
      'site.webmanifest must identify GrooveMap and remain root-relative without an unnecessary start_url',
    );
  }

  for (const expectedPath of [
    '/index.html',
    '/about/index.html',
    '/404.html',
    '/sitemap-index.xml',
  ]) {
    if (
      !(await pathExists(
        outputPathForUrl(outputRoot, new URL(expectedPath, canonicalOrigin)),
      ))
    ) {
      report(`production build is missing ${expectedPath}`);
    }
  }
}

export async function validateSite() {
  const errors = [];
  const report = (message) => errors.push(message);
  const htmlValidate = new HtmlValidate({
    extends: ['html-validate:recommended'],
    rules: {
      'heading-level': 'error',
      'no-inline-style': 'error',
      'prefer-native-element': 'error',
      'wcag/h30': 'error',
      'wcag/h37': 'error',
    },
  });
  const htmlFiles = (await filesUnder(outputRoot)).filter((file) =>
    file.endsWith('.html'),
  );
  if (htmlFiles.length !== 3)
    report(`expected 3 generated HTML pages, found ${htmlFiles.length}`);

  await Promise.all(
    htmlFiles.map((file) => validateHtmlFile(file, htmlValidate, report)),
  );
  await validateStaticContract(report);
  await validateBrandProvenance(report);

  if (errors.length > 0) {
    throw new Error(`Site validation failed:\n- ${errors.join('\n- ')}`);
  }

  return { htmlPages: htmlFiles.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await validateSite();
  console.log(
    `Validated ${result.htmlPages} static HTML pages, their links, metadata, accessibility, and brand provenance.`,
  );
}
