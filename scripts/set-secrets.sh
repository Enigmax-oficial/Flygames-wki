#!/usr/bin/env bash
set -euo pipefail

# Fail loudly if any required environment variable is missing or empty
if [ -z "${JWT_SECRET:-}" ]; then
  echo "Error: JWT_SECRET environment variable is not set or empty." >&2
  exit 1
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "Error: RESEND_API_KEY environment variable is not set or empty." >&2
  exit 1
fi

if [ -z "${RESEND_FROM_EMAIL:-}" ]; then
  echo "Error: RESEND_FROM_EMAIL environment variable is not set or empty." >&2
  exit 1
fi

echo "Setting Cloudflare Worker secrets non-interactively..."

echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
echo "$RESEND_API_KEY" | npx wrangler secret put RESEND_API_KEY
echo "$RESEND_FROM_EMAIL" | npx wrangler secret put RESEND_FROM_EMAIL

echo "Cloudflare Worker secrets successfully updated."
