#!/usr/bin/env bash
set -euo pipefail
if [ -z "${SLACK_TRIGGER_WEBHOOK_URL:-}" ]; then
  echo "::notice::SLACK_TRIGGER_WEBHOOK_URL is not set — skipping Slack."
  exit 0
fi
# Minimal JSON payload; extend for your Workflow Builder block when needed
curl -sS -X POST -H "Content-Type: application/json" \
  -d "{\"text\":\"Build ${BUILD_ARTIFACT_NAME:-} — ${BUILD_RELEASE_NOTES:-}\"}" \
  "$SLACK_TRIGGER_WEBHOOK_URL" || true
