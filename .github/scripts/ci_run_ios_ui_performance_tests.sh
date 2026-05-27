#!/usr/bin/env bash
# Runs iOS UI performance tests on a simulator (GitHub Actions macOS runners).
# Exit code from xcodebuild is preserved (pipefail + PIPESTATUS).
#
# Do not use CODE_SIGNING_ALLOWED=NO — it breaks embedding/running UI test bundles on many Xcode versions.
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
BUILD_DIR="${ROOT}/build"
mkdir -p "${BUILD_DIR}"

if [[ -x "${ROOT}/.github/scripts/restore_ci_env_files.sh" ]]; then
  bash "${ROOT}/.github/scripts/restore_ci_env_files.sh"
fi

IOS_WORKSPACE="${IOS_WORKSPACE:-ios/TemplateBareApp.xcworkspace}"
IOS_SCHEME="${IOS_SCHEME:-Dev}"
IOS_BUILD_CONFIGURATION="${IOS_BUILD_CONFIGURATION:-Debug-Dev}"
IOS_PERFORMANCE_TEST_CLASS="${IOS_PERFORMANCE_TEST_CLASS:-TemplateBareAppUITests/AppPerformanceTests}"

# full = launch + CPU/memory (PR table like PerformanceTest_iOS). launch = fast local smoke.
PERF_METRICS_MODE="${PERF_METRICS_MODE:-full}"
if [[ -n "${IOS_PERFORMANCE_ONLY_TEST:-}" ]]; then
  :
elif [[ "${PERF_METRICS_MODE}" == "launch" ]]; then
  IOS_PERFORMANCE_ONLY_TEST="${IOS_PERFORMANCE_TEST_CLASS}/testLaunchPerformance"
else
  IOS_PERFORMANCE_ONLY_TEST="${IOS_PERFORMANCE_TEST_CLASS}"
fi

if [[ ! -d "${ROOT}/${IOS_WORKSPACE}" ]]; then
  echo "::error::Missing workspace: ${ROOT}/${IOS_WORKSPACE}"
  exit 2
fi

IOS_PLIST="${ROOT}/ios/TemplateBareApp/GoogleService-Info.plist"
if [[ ! -f "${IOS_PLIST}" && -f "${ROOT}/GoogleService-Info.plist.example" ]]; then
  cp "${ROOT}/GoogleService-Info.plist.example" "${IOS_PLIST}"
  echo "Using GoogleService-Info.plist.example for local build (set real plist or CI secrets for production)."
fi

DESTINATION="${SIMULATOR_DESTINATION:-}"
if [[ -z "${DESTINATION}" || "${DESTINATION}" = "auto" ]]; then
  DESTINATION="$(python3 "${ROOT}/.github/scripts/ios_first_iphone_sim_udid.py")"
fi
echo "Destination: ${DESTINATION}"

if [[ "${DESTINATION}" == *"id="* ]]; then
  UDID="${DESTINATION#*id=}"
  UDID="${UDID%%[, ]*}"
elif [[ "${DESTINATION}" == *"platform=iOS Simulator"* ]]; then
  UDID="$(python3 "${ROOT}/.github/scripts/ios_first_iphone_sim_udid.py" --udid)"
fi
if [[ -n "${UDID:-}" ]]; then
  echo "Booting simulator ${UDID}..."
  xcrun simctl boot "${UDID}" 2>/dev/null || true
  xcrun simctl bootstatus "${UDID}" -b
fi

cd "${ROOT}"

rm -rf "${BUILD_DIR}/TestResults.xcresult"
echo "Building + running: ${IOS_PERFORMANCE_ONLY_TEST} (PERF_METRICS_MODE=${PERF_METRICS_MODE}, configuration=${IOS_BUILD_CONFIGURATION})"

RETRY_FLAG=()
if [[ "${PERF_METRICS_MODE}" == "launch" ]]; then
  RETRY_FLAG=(-retry-tests-on-failure)
fi

# ── Phase 1: build-for-testing ─────────────────────────────────────────────
# Separating build from test gives a clear build-error signal and lets us
# verify that main.jsbundle was embedded (FORCE_BUNDLING=1) before tests run.
set +e
xcodebuild build-for-testing \
  -workspace "${IOS_WORKSPACE}" \
  -scheme "${IOS_SCHEME}" \
  -configuration "${IOS_BUILD_CONFIGURATION}" \
  -sdk iphonesimulator \
  -destination "${DESTINATION}" \
  -derivedDataPath "${BUILD_DIR}/DerivedData" \
  CODE_SIGN_IDENTITY=- \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=YES \
  FORCE_BUNDLING=1 \
  2>&1 | tee "${BUILD_DIR}/xcodebuild-test.log"
BUILD_EXIT="${PIPESTATUS[0]}"
set -e

if [[ "${BUILD_EXIT}" -ne 0 ]]; then
  echo "::error::xcodebuild build-for-testing failed with exit code ${BUILD_EXIT}"
  tail -n 80 "${BUILD_DIR}/xcodebuild-test.log" || true
  exit "${BUILD_EXIT}"
fi

# ── Verify JS bundle was embedded ──────────────────────────────────────────
PRODUCTS_DIR="${BUILD_DIR}/DerivedData/Build/Products/${IOS_BUILD_CONFIGURATION}-iphonesimulator"
BUILT_APP="$(find "${PRODUCTS_DIR}" -maxdepth 1 -name "*.app" ! -name "*UITests*" 2>/dev/null | head -1 || true)"
if [[ -n "${BUILT_APP}" && -f "${BUILT_APP}/main.jsbundle" ]]; then
  echo "✓ main.jsbundle found in built app: ${BUILT_APP}"
else
  echo "::warning::main.jsbundle NOT found in ${BUILT_APP:-${PRODUCTS_DIR}} — testTypicalSessionCPUAndMemory will be skipped by XCTSkip"
fi

# ── Phase 2: test-without-building ─────────────────────────────────────────
set +e
xcodebuild test-without-building \
  -workspace "${IOS_WORKSPACE}" \
  -scheme "${IOS_SCHEME}" \
  -configuration "${IOS_BUILD_CONFIGURATION}" \
  -sdk iphonesimulator \
  -destination "${DESTINATION}" \
  -derivedDataPath "${BUILD_DIR}/DerivedData" \
  -only-testing:"${IOS_PERFORMANCE_ONLY_TEST}" \
  -skip-testing:TemplateBareAppTests \
  -resultBundlePath "${BUILD_DIR}/TestResults.xcresult" \
  -parallel-testing-enabled NO \
  -maximum-concurrent-test-simulator-destinations 1 \
  "${RETRY_FLAG[@]}" \
  2>&1 | tee -a "${BUILD_DIR}/xcodebuild-test.log"
XCODE_EXIT="${PIPESTATUS[0]}"
set -e

if [[ "${XCODE_EXIT}" -ne 0 ]]; then
  echo "::error::xcodebuild test-without-building failed with exit code ${XCODE_EXIT}"
  tail -n 80 "${BUILD_DIR}/xcodebuild-test.log" || true
  exit "${XCODE_EXIT}"
fi
