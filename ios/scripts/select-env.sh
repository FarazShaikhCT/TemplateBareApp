#!/bin/bash
# select-env.sh
#
# Copies the flavor-specific .env file to the project root .env so that
# react-native-config can read it during the iOS build phase.
#
# This script is used as a "Run Script" Build Phase in Xcode. It must run
# before the "Bundle React Native code and images" phase. Add it as:
#
#   Shell: /bin/bash
#   Script: "${SRCROOT}/scripts/select-env.sh"
#   Input Files: $(SRCROOT)/${ENVFILE}
#   Output Files: $(SRCROOT)/.env
#
# ENVFILE is defined in the per-configuration xcconfig file
# (e.g. ios/xcconfig/Dev.Debug.xcconfig).

set -euo pipefail

SRCROOT="${SRCROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PROJECT_ROOT="${SRCROOT}/.."

if [ -z "${ENVFILE:-}" ]; then
  echo "warning: ENVFILE is not set. Falling back to .env.dev"
  ENVFILE="../.env.dev"
fi

ENV_SOURCE="${SRCROOT}/${ENVFILE}"

if [ ! -f "${ENV_SOURCE}" ]; then
  echo "error: env file not found at ${ENV_SOURCE}"
  exit 1
fi

cp "${ENV_SOURCE}" "${PROJECT_ROOT}/.env"
echo "Copied ${ENV_SOURCE} → ${PROJECT_ROOT}/.env"
