#!/usr/bin/env bash
set -euo pipefail

echo "Verifying lockfile is in sync with package.json..."
# Fails fast if bun.lock doesn't match package.json, preventing stale cache deployments
bun install --frozen-lockfile

echo "Running typecheck..."
bun run lint

echo "Building..."
bun run build
