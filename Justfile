set shell := ["bash", "-euo", "pipefail", "-c"]
npm := "scripts/npm.sh"

default:
    @just --list

# Install exactly the dependencies in package-lock.json.
setup:
    {{npm}} ci

# Deterministic, credential-free pre-merge gate. Audit remains separate because
# it intentionally contacts the npm advisory service.
check: ci-check build license-check secret-scan install-check

# Source and application checks used by the shared CI workflow before its
# dedicated coverage, policy, package, and built-artifact steps.
ci-check: format-check lint typecheck test automation-check

format-check:
    {{npm}} run format:check

lint:
    {{npm}} run lint

typecheck:
    {{npm}} run typecheck

test:
    {{npm}} test

coverage:
    mkdir -p coverage
    {{npm}} exec -- node --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=coverage/lcov.info tests/*.test.mjs

build:
    {{npm}} run build

validate-site:
    {{npm}} run validate:site

automation-check:
    actionlint .github/workflows/*.yml
    {{npm}} exec -- node scripts/check-automation.mjs

license-check: build
    {{npm}} run licenses:check

secret-scan:
    gitleaks git --redact --no-banner
    gitleaks dir . --redact --no-banner

# Network access is intentional and separate from check.
audit:
    {{npm}} audit --audit-level=high

# The site has no installable package. Validate the artifact produced by the
# preceding build/package capability without rebuilding it.
install-check: validate-site

promote-brand:
    {{npm}} exec -- node scripts/promote-brand.mjs

dev:
    {{npm}} run dev

preview:
    {{npm}} run preview
