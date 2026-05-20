/**
 * Abstraction over crash logging so the underlying SDK can be swapped
 * (e.g. Firebase Crashlytics → Sentry → Bugsnag) without touching call sites.
 */
export interface ICrashLoggerProvider {
  /** Records a non-fatal error with optional key/value context. */
  recordError(
    error: Error,
    context?: Record<string, string | number | boolean>,
  ): Promise<void>;

  /** Appends a breadcrumb-style message to the crash log. */
  log(message: string): Promise<void>;

  /** Associates a user ID with subsequent crash reports. Pass null to clear. */
  setUserId(userId: string | null): Promise<void>;

  /**
   * Attaches a custom key/value pair to all subsequent crash reports.
   * Useful for build variant, feature flags, or session context.
   */
  setCustomKey(
    key: string,
    value: string | number | boolean,
  ): Promise<void>;

  /**
   * Forces a native crash — for testing crash reporting end-to-end.
   * Only call this from a debug/QA build.
   */
  crash(): void;
}
