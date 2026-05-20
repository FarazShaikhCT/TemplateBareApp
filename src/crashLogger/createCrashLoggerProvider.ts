import { FirebaseCrashlyticsProvider } from './providers/firebase/FirebaseCrashlyticsProvider';
import type { ICrashLoggerProvider } from './providers/ICrashLoggerProvider';

/**
 * Returns the active crash logging implementation.
 *
 * To switch providers, replace the class instantiated here and update the
 * import — the ICrashLoggerProvider interface is the only contract call
 * sites depend on.
 */
export function createCrashLoggerProvider(): ICrashLoggerProvider {
  return new FirebaseCrashlyticsProvider();
}
