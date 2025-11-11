#!/usr/bin/env sh
set -e

# Wrapper to ensure .open-next exists before deploying with Wrangler Pages.
# Usage: sh scripts/pages-deploy.sh

echo "Checking for .open-next directory..."
if [ ! -d ".open-next" ]; then
  echo ".open-next not found. Running OpenNext build (npm run cf:build)..."
  npm run cf:build
else
  echo ".open-next exists. Skipping build."
fi

# Use wrangler pages deploy to upload the assets. Accept CF_PAGES_PROJECT from env.
if [ -z "$CF_PAGES_PROJECT" ]; then
  echo "Warning: CF_PAGES_PROJECT is not set. Wrangler will need a project name to deploy assets to Pages."
fi

echo "Deploying .open-next to Cloudflare Pages..."
npx wrangler pages deploy .open-next --project-name="$CF_PAGES_PROJECT" --branch=main

echo "Deployment command finished."
