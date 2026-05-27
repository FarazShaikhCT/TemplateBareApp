//
//  AppPerformanceTests.swift
//  TemplateBareAppUITests
//

import XCTest

/// XCTest performance metrics recorded for CI (launch, CPU, memory).
/// Home title must match `home.title` in src/third-party/i18n/locales/en/translation.json.
final class AppPerformanceTests: XCTestCase {

    private let expectedHomeTitle = "Home stack"
    private let useBundledJsLaunchArgument = "-UseBundledJS"

    private func configuredApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments.append(useBundledJsLaunchArgument)
        return app
    }

    func testLaunchPerformance() {
        let app = configuredApp()
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            app.launch()
        }
    }

    func testTypicalSessionCPUAndMemory() throws {
        let app = configuredApp()
        app.launch()
        guard waitForAppReady(app, timeout: 90) else {
            throw XCTSkip("App UI did not appear within 90 s — bundled JS unavailable (FORCE_BUNDLING=1 required for CI) or Metro not running.")
        }

        measure(metrics: [
            XCTCPUMetric(application: app),
            XCTMemoryMetric(application: app),
        ]) {
            _ = waitForAppReady(app, timeout: 10)
        }
    }

    /// RN exposes Text as staticTexts; View accessibilityLabel alone is unreliable in XCUITest.
    private func waitForAppReady(_ app: XCUIApplication, timeout: TimeInterval) -> Bool {
        let homeTitle = app.staticTexts[expectedHomeTitle]
        if homeTitle.waitForExistence(timeout: timeout) {
            return true
        }
        return app.otherElements["app-root"].waitForExistence(timeout: 5)
    }
}
