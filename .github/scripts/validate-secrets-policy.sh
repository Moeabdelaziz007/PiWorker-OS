#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-production}"

require_secret() {
  local key="$1"
  local value="${!key:-}"

  if [[ -z "$value" ]]; then
    echo "❌ Missing required secret for ${TARGET_ENV}: ${key}" >&2
    exit 1
  fi
}

case "$TARGET_ENV" in
  production)
    require_secret "VERCEL_TOKEN"
    require_secret "VERCEL_ORG_ID"
    require_secret "VERCEL_PROJECT_ID"
    require_secret "SOVEREIGN_AUTH_TOKEN"
    require_secret "AGENT_SYSTEM_SECRET"
    ;;
  staging)
    require_secret "VERCEL_TOKEN"
    require_secret "VERCEL_ORG_ID"
    require_secret "VERCEL_PROJECT_ID"
    ;;
  *)
    echo "❌ Unsupported deployment environment: ${TARGET_ENV}" >&2
    exit 1
    ;;
esac

echo "✅ Secret policy validation passed for ${TARGET_ENV}."
