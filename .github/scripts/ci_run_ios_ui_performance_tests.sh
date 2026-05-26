#!/usr/bin/env bash
# Runs iOS UI performance tests on a simulator (GitHub Actions macOS runners).
# Exit code from xcodebuild is preserved (pipefail + tee).
#
# Do not use CODE_SIGNING_ALLOWED=NO — it breaks embedding/running UI test bundles on many Xcode versions.
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
BUILD_DIR="${ROOT}/build"
mkdir -p "${BUILD_DIR}"

IOS_WORKSPACE="${IOS_WORKSPACE:-ios/TemplateBareApp.xcworkspace}"
IOS_SCHEME="${IOS_SCHEME:-Dev}"
IOS_BUILD_CONFIGURATION="${IOS_BUILD_CONFIGURATION:-Debug-Dev}"
IOS_PERFORMANCE_TEST_CLASS="${IOS_PERFORMANCE_TEST_CLASS:-TemplateBareAppUITests/AppPerformanceTests}"
PREBUILT_SIM_APP="${PREBUILT_SIM_APP:-}"

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
echo "Running tests: ${IOS_PERFORMANCE_ONLY_TEST} (PERF_METRICS_MODE=${PERF_METRICS_MODE})"

RETRY_FLAG=()
if [[ "${PERF_METRICS_MODE}" == "launch" ]]; then
  RETRY_FLAG=(-retry-tests-on-failure)
fi

XCB_COMMON=(
  -workspace "${IOS_WORKSPACE}"
  -scheme "${IOS_SCHEME}"
  -sdk iphonesimulator
  -destination "${DESTINATION}"
  -derivedDataPath "${BUILD_DIR}/DerivedData"
  -only-testing:"${IOS_PERFORMANCE_ONLY_TEST}"
  -parallel-testing-enabled NO
  -maximum-concurrent-test-simulator-destinations 1
  CODE_SIGN_IDENTITY=-
  CODE_SIGNING_REQUIRED=NO
  CODE_SIGNING_ALLOWED=YES
)

if [[ -n "${PREBUILT_SIM_APP}" && -d "${PREBUILT_SIM_APP}" ]]; then
  echo "Using prebuilt simulator app from ios-dev: ${PREBUILT_SIM_APP}"
  PRODUCTS_DIR="${BUILD_DIR}/DerivedData/Build/Products/${IOS_BUILD_CONFIGURATION}-iphonesimulator"
  mkdir -p "${PRODUCTS_DIR}"
  rm -rf "${PRODUCTS_DIR}/${IOS_SCHEME}.app"
  cp -R "${PREBUILT_SIM_APP}" "${PRODUCTS_DIR}/${IOS_SCHEME}.app"

  xcodebuild build-for-testing \
    "${XCB_COMMON[@]}" \
    -configuration "${IOS_BUILD_CONFIGURATION}" \
    2>&1 | tee "${BUILD_DIR}/xcodebuild-test.log"

  xcodebuild test-without-building \
    "${XCB_COMMON[@]}" \
    -configuration "${IOS_BUILD_CONFIGURATION}" \
    -resultBundlePath "${BUILD_DIR}/TestResults.xcresult" \
    "${RETRY_FLAG[@]}" \
    2>&1 | tee -a "${BUILD_DIR}/xcodebuild-test.log"
else
  xcodebuild test \
    "${XCB_COMMON[@]}" \
    -resultBundlePath "${BUILD_DIR}/TestResults.xcresult" \
    "${RETRY_FLAG[@]}" \
    2>&1 | tee "${BUILD_DIR}/xcodebuild-test.log"
fi
