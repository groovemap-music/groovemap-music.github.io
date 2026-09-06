set shell := ["bash", "-euo", "pipefail", "-c"]
npm := "scripts/npm.sh"

default:
    @just --list

# Install exactly the dependencies in package-lock.json.
setup:
    {{npm}} ci

# Deterministic, credential-free pre-merge gate.
check: ci-check license-check security

# Source and application checks used by the shared CI workflow before its dedicated
# coverage, audit, license, secret-scan, package, and smoke-test steps.
ci-check: format-check lint typecheck test build validate-site automation-check

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

license-check:
    {{npm}} run licenses:check

security:
    gitleaks git --redact --no-banner
    gitleaks dir . --redact --no-banner

# Network access is intentional and separate from check.
audit:
    {{npm}} audit --audit-level=high

# Rebuild and smoke-test the static deployment artifact. The site has no installable
# package, so validating the built output is its installation contract.
install-check: build validate-site

promote-brand:
    {{npm}} exec -- node scripts/promote-brand.mjs

dev:
    {{npm}} run dev

preview:
    {{npm}} run preview
