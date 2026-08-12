#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Building Minecraft Addon Wiki Engine"
echo "========================================="

echo "1. Verifying dependencies..."
bun install --frozen-lockfile || bun install

echo "2. Running TypeScript linter..."
bun run lint

echo "3. Building Vite client and Express server..."
bun run build

echo "========================================="
echo "  Build completed successfully!"
echo "========================================="
