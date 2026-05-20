import XCTest

/// Smoke tests for the native iOS target (CI uses `xcodebuild test` + xccov).
final class TemplateBareAppTests: XCTestCase {
  func test_smoke() throws {
    XCTAssertEqual(2, 1 + 1)
  }
}
