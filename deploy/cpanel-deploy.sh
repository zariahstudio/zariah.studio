#!/usr/bin/env bash
set -Eeuo pipefail

# ZARIAH Studio cPanel clean deployment
# - Validates the repository before touching the live site.
# - Creates a complete backup outside public_html.
# - Builds the new site in a temporary staging directory.
# - Preserves server-managed .well-known and (unless supplied by Git) .htaccess.
# - Restores the backup automatically if publishing fails.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
DEPLOYPATH="${HOME}/public_html"
BACKUP_PARENT="${HOME}/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

BACKUP_DIR=""
STAGE_DIR=""
BACKUP_READY=0
DEPLOY_STARTED=0

REQUIRED_FILES=(
  "index.html"
  "_redirects"
  "storefront-config.js"
  "zariah-cart.js"
  "zariah-supabase-loader.js"
  "zariah-analytics-loader.js"
  "zariah-visitor-tracker.js"
  "product-seo.php"
  "sitemap.php"
  "robots.txt"
)

# These are the actual storefront directories present in the GitHub main branch.
# There is no root-level "home" directory in the current repository.
REQUIRED_DIRS=(
  "assets"
  "collections"
  "images"
  "pages"
  "products"
)

rollback_on_error() {
  local status="$1"
  local line="$2"

  trap - ERR
  set +e

  echo "ERROR: Deployment failed near line ${line} (exit ${status})."

  if [[ "${BACKUP_READY}" == "1" && "${DEPLOY_STARTED}" == "1" ]]; then
    echo "ROLLBACK: Restoring the previous website from ${BACKUP_DIR}/public_html ..."
    mkdir -p "${DEPLOYPATH}"
    find "${DEPLOYPATH}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    if /bin/cp -a "${BACKUP_DIR}/public_html/." "${DEPLOYPATH}/"; then
      echo "ROLLBACK SUCCESS: Previous website restored."
    else
      echo "CRITICAL: Automatic restore failed. Backup remains at ${BACKUP_DIR}/public_html"
    fi
  else
    echo "No live-site changes had started; the existing website was not modified."
  fi

  exit "${status}"
}

cleanup() {
  if [[ -n "${STAGE_DIR}" && -d "${STAGE_DIR}" ]]; then
    rm -rf -- "${STAGE_DIR}"
  fi
}

trap 'rollback_on_error "$?" "$LINENO"' ERR
trap cleanup EXIT

# STEP 1 — Validate paths and repository.
if [[ -z "${HOME:-}" || ! -d "${HOME}" ]]; then
  echo "ERROR: Account HOME directory is unavailable."
  exit 1
fi

if [[ "${DEPLOYPATH}" != "${HOME}/public_html" ]]; then
  echo "ERROR: Deployment target failed the safety check."
  exit 1
fi

if [[ -L "${DEPLOYPATH}" ]]; then
  echo "ERROR: public_html is a symbolic link. Refusing a destructive deployment."
  exit 1
fi

if [[ ! -d "${REPO_ROOT}" ]]; then
  echo "ERROR: Repository root was not found: ${REPO_ROOT}"
  exit 1
fi

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -s "${REPO_ROOT}/${file}" ]]; then
    echo "ERROR: Required storefront file is missing or empty: ${file}"
    exit 1
  fi
done

for dir in "${REQUIRED_DIRS[@]}"; do
  if [[ ! -d "${REPO_ROOT}/${dir}" ]]; then
    echo "ERROR: Required storefront directory is missing: ${dir}"
    exit 1
  fi
done

# Both prebuilt apps are mandatory for a clean deployment.
if [[ ! -s "${REPO_ROOT}/admin/index.html" || ! -d "${REPO_ROOT}/admin/assets" ]]; then
  echo "ERROR: Prebuilt Admin is missing or incomplete."
  exit 1
fi
if [[ ! -s "${REPO_ROOT}/owner/index.html" ||
      ! -s "${REPO_ROOT}/owner/manifest.webmanifest" ||
      ! -s "${REPO_ROOT}/owner/sw.js" ||
      ! -s "${REPO_ROOT}/owner/icon.svg" ||
      ! -d "${REPO_ROOT}/owner/assets" ]]; then
  echo "ERROR: Prebuilt Owner App is missing or incomplete. Refusing clean deployment."
  exit 1
fi
if ! grep -q '/owner/assets/' "${REPO_ROOT}/owner/index.html"; then
  echo "ERROR: Owner App asset base path is not /owner/."
  exit 1
fi

mkdir -p "${DEPLOYPATH}" "${BACKUP_PARENT}"

# STEP 2 — Create a full backup outside the public web root.
BACKUP_DIR="$(mktemp -d "${BACKUP_PARENT}/zariah-${TIMESTAMP}.XXXXXX")"
mkdir -p "${BACKUP_DIR}/public_html"

echo "STEP 1/5: Backing up current public_html..."
/bin/cp -a "${DEPLOYPATH}/." "${BACKUP_DIR}/public_html/"
BACKUP_READY=1
echo "BACKUP COMPLETE: ${BACKUP_DIR}/public_html"

# STEP 3 — Prepare and validate the new release away from the live directory.
STAGE_DIR="$(mktemp -d "${HOME}/.zariah-stage.XXXXXX")"

echo "STEP 2/5: Preparing the new storefront in staging..."
for file in "${REQUIRED_FILES[@]}"; do
  /bin/cp -p "${REPO_ROOT}/${file}" "${STAGE_DIR}/"
done

for dir in "${REQUIRED_DIRS[@]}"; do
  /bin/cp -Rp "${REPO_ROOT}/${dir}" "${STAGE_DIR}/"
done

# Deploy only the prebuilt Admin. Never expose admin-app source code.
if [[ -s "${REPO_ROOT}/admin/index.html" ]]; then
  mkdir -p "${STAGE_DIR}/admin"
  /bin/cp -Rp "${REPO_ROOT}/admin/." "${STAGE_DIR}/admin/"
  echo "INFO: Prebuilt Admin will be deployed."
fi

# Deploy only the prebuilt Owner PWA; never expose source code.
mkdir -p "${STAGE_DIR}/owner"
/bin/cp -Rp "${REPO_ROOT}/owner/." "${STAGE_DIR}/owner/"
echo "INFO: Prebuilt Owner App will be deployed."

# Preserve domain-validation files used by SSL providers.
if [[ -d "${DEPLOYPATH}/.well-known" ]]; then
  /bin/cp -a "${DEPLOYPATH}/.well-known" "${STAGE_DIR}/"
fi

# Preserve existing cPanel/server rules only when Git does not provide a replacement.
if [[ ! -f "${REPO_ROOT}/.htaccess" && -f "${DEPLOYPATH}/.htaccess" ]]; then
  /bin/cp -p "${DEPLOYPATH}/.htaccess" "${STAGE_DIR}/.htaccess"
elif [[ -f "${REPO_ROOT}/.htaccess" ]]; then
  /bin/cp -p "${REPO_ROOT}/.htaccess" "${STAGE_DIR}/.htaccess"
fi

if [[ ! -s "${STAGE_DIR}/index.html" ]]; then
  echo "ERROR: Staged index.html is missing or empty."
  exit 1
fi

for dir in "${REQUIRED_DIRS[@]}"; do
  if [[ ! -d "${STAGE_DIR}/${dir}" ]]; then
    echo "ERROR: Staging validation failed for directory: ${dir}"
    exit 1
  fi
done

if [[ ! -s "${STAGE_DIR}/owner/index.html" || ! -d "${STAGE_DIR}/owner/assets" ]]; then
  echo "ERROR: Owner App staging validation failed."
  exit 1
fi

echo "STEP 3/5: Staging validation passed."

# STEP 4 — Replace the live contents with the validated staged release.
# The complete original site is already backed up. Preserve only .well-known
# and the applicable .htaccess in the new release; stale site files are removed.
echo "STEP 4/5: Cleaning old website files and publishing the new release..."
DEPLOY_STARTED=1

find "${DEPLOYPATH}" -mindepth 1 -maxdepth 1 \
  ! -name ".well-known" \
  ! -name ".htaccess" \
  -exec rm -rf -- {} +

/bin/cp -a "${STAGE_DIR}/." "${DEPLOYPATH}/"

# STEP 5 — Verify the live document root.
if [[ ! -s "${DEPLOYPATH}/index.html" ]]; then
  echo "ERROR: Published index.html is missing or empty."
  false
fi

for dir in "${REQUIRED_DIRS[@]}"; do
  if [[ ! -d "${DEPLOYPATH}/${dir}" ]]; then
    echo "ERROR: Published directory is missing: ${dir}"
    false
  fi
done

if [[ ! -s "${DEPLOYPATH}/owner/index.html" || ! -d "${DEPLOYPATH}/owner/assets" ]]; then
  echo "ERROR: Published Owner App is missing or incomplete."
  false
fi

echo "STEP 5/5: Deployment verification passed."
echo "SUCCESS: ZARIAH Studio clean deployment completed."
echo "LIVE PATH: ${DEPLOYPATH}"
echo "FULL BACKUP: ${BACKUP_DIR}/public_html"
echo "Keep this backup until the live website has been fully tested."
