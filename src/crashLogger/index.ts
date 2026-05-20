export type { ICrashLoggerProvider } from './providers/ICrashLoggerProvider';
export { FirebaseCrashlyticsProvider } from './providers/firebase/FirebaseCrashlyticsProvider';
export { createCrashLoggerProvider } from './createCrashLoggerProvider';
export {
  recordError,
  log,
  setUserId,
  setCustomKey,
  crash,
} from './crashLogger';
