#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
DEPLOYPATH="${HOME}/public_html"

if [[ ! -d "${REPO_ROOT}" ]]; then
  echo "ERROR: Repository root was not found: ${REPO_ROOT}"
  exit 1
fi

if [[ ! -d "${HOME}" ]]; then
  echo "ERROR: Account home directory was not found."
  exit 1
fi

# Validate every required storefront source before copying anything.
REQUIRED_FILES=(
  "index.html"
  "_redirects"
  "storefront-config.js"
  "zariah-cart.js"
  "zariah-supabase-loader.js"
  "zariah-analytics-loader.js"
)

REQUIRED_DIRS=(
  "assets"
  "collections"
  "home"
  "images"
  "pages"
  "products"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "${REPO_ROOT}/${file}" ]]; then
    echo "ERROR: Required storefront file is missing: ${file}"
    exit 1
  fi
done

for dir in "${REQUIRED_DIRS[@]}"; do
  if [[ ! -d "${REPO_ROOT}/${dir}" ]]; then
    echo "ERROR: Required storefront directory is missing: ${dir}"
    exit 1
  fi
done

mkdir -p "${DEPLOYPATH}"

echo "Deploying ZARIAH Studio storefront to: ${DEPLOYPATH}"

for file in "${REQUIRED_FILES[@]}"; do
  /bin/cp -p "${REPO_ROOT}/${file}" "${DEPLOYPATH}/"
done

for dir in "${REQUIRED_DIRS[@]}"; do
  /bin/cp -Rp "${REPO_ROOT}/${dir}" "${DEPLOYPATH}/"
done

if [[ ! -s "${DEPLOYPATH}/index.html" ]]; then
  echo "ERROR: Storefront index.html was not copied successfully."
  exit 1
fi

echo "SUCCESS: Storefront deployment completed."
echo "NOTE: Admin app is intentionally excluded; it requires a separate production build and deployment configuration."
