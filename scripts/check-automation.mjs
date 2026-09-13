import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { repositoryRoot as root } from './filesystem.mjs';

const workflows = path.join(root, '.github', 'workflows');
const automationRevision = '2f34a4da5c552bc23c75edd3d8d81be0a4b3271c';
const reusableCaller = `uses: groovemap-music/automation/.github/workflows/reusable-ci.yml@${automationRevision}`;
const requiredInputs = [
  'language: node',
  'setup-command: just setup',
  'check-command: just ci-check',
  'coverage-command: just coverage',
  'audit-command: just audit',
  'license-command: just license-check',
  'secret-scan-command: just secret-scan',
  'package-command: just build',
  'install-command: just install-check',
  'coverage-files: coverage/lcov.info',
];

assert.deepEqual(
  (await readdir(workflows)).sort(),
  ['ci.yml', 'pages.yml'],
  'only the reviewed CI and Pages workflows may be active',
);

const ci = await readFile(path.join(workflows, 'ci.yml'), 'utf8');
const pages = await readFile(path.join(workflows, 'pages.yml'), 'utf8');
const dependabot = await readFile(
  path.join(root, '.github', 'dependabot.yml'),
  'utf8',
);

for (const [name, workflow] of [
  ['CI', ci],
  ['Pages', pages],
]) {
  assert.ok(
    workflow.includes(reusableCaller),
    `${name} must pin shared validation`,
  );
  for (const input of requiredInputs) {
    assert.ok(workflow.includes(input), `${name} must supply ${input}`);
  }
  assert.doesNotMatch(workflow, /github\.actor|dependabot\[bot\]/iu);
  assert.doesNotMatch(workflow, /uses:\s+[^\n]+@(main|master|v\d+)/u);
}

assert.match(ci, /^\s{2}pull_request:\s*$/mu);
assert.match(ci, /^\s{2}push:\n\s{4}branches: \[main\]$/mu);
assert.match(ci, /^\s{2}schedule:\s*$/mu);
assert.match(ci, /^permissions:\n\s{2}contents: read$/mu);
assert.doesNotMatch(ci, /^\s+if:/mu);

assert.match(pages, /^\s{2}validation:\n\s{4}uses:/mu);
assert.match(pages, /^\s{2}build:\n\s{4}needs: validation$/mu);
assert.match(pages, /^\s{2}deploy:\n\s{4}needs: build$/mu);
assert.match(pages, /^\s{6}pages: write$/mu);
assert.match(pages, /^\s{6}id-token: write$/mu);

assert.match(dependabot, /package-ecosystem: github-actions/u);
assert.match(dependabot, /package-ecosystem: npm/u);
assert.match(dependabot, /labels: \[dependencies, github-actions\]/u);

for (const file of [ci, pages, dependabot]) {
  assert.doesNotMatch(file, /renovate|claude/iu);
}

console.log('CI, Pages, and Dependabot automation contracts are valid.');
