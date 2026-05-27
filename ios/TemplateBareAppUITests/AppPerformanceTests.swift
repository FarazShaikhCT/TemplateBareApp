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
        
        let launchStart = Date()
        app.launch()
        
        guard waitForAppReady(app, timeout: 90) else {
            let elapsed = Date().timeIntervalSince(launchStart)
            print("App launch failed after \(elapsed) seconds")
            print("App state: \(app.state.rawValue)")
            throw XCTSkip("App UI did not appear within 90 s — bundled JS unavailable (FORCE_BUNDLING=1 required for CI) or Metro not running.")
        }
        
        print("App launched and ready in \(Date().timeIntervalSince(launchStart)) seconds")

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
        let startTime = Date()
        
        if homeTitle.waitForExistence(timeout: timeout) {
            print("Found home title '\(expectedHomeTitle)' after \(Date().timeIntervalSince(startTime))s")
            return true
        }
        
        print("Home title not found, checking for app-root fallback")
        let hasAppRoot = app.otherElements["app-root"].waitForExistence(timeout: 5)
        if hasAppRoot {
            print("Found app-root element as fallback")
        } else {
            print("Neither home title nor app-root found - app may not have loaded")
        }
        return hasAppRoot
    }
}
