import crashlytics from "@react-native-firebase/crashlytics";

import type { ICrashLoggerProvider } from "../ICrashLoggerProvider";

/**
 * Firebase Crashlytics implementation of ICrashLoggerProvider.
 *
 * To swap providers, implement ICrashLoggerProvider with a different SDK
 * (e.g. Sentry, Bugsnag) and update createCrashLoggerProvider.ts to return
 * that class instead. No call-site changes are required.
 */
export class FirebaseCrashlyticsProvider implements ICrashLoggerProvider {
  async recordError(
    error: Error,
    context?: Record<string, string | number | boolean>,
  ): Promise<void> {
    if (context) {
      await Promise.all(
        Object.entries(context).map(([key, value]) =>
          crashlytics().setAttribute(key, String(value)),
        ),
      );
    }
    crashlytics().recordError(error);
  }

  async log(message: string): Promise<void> {
    crashlytics().log(message);
  }

  async setUserId(userId: string | null): Promise<void> {
    await crashlytics().setUserId(userId ?? "");
  }

  async setCustomKey(
    key: string,
    value: string | number | boolean,
  ): Promise<void> {
    await crashlytics().setAttribute(key, String(value));
  }

  crash(): void {
    // crashlytics().crash() triggers a native process termination.
    // This only causes a visible app exit in release builds — in debug builds
    // the Metro dev server intercepts the signal before the process dies.
    // To test crash reporting in debug, throw an uncaught JS error instead so
    // it travels through the global handler registered in crashLoggerSetup.ts.
    crashlytics().crash();
  }
}
