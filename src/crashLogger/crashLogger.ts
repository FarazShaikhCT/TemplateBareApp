import { createCrashLoggerProvider } from './createCrashLoggerProvider';

const provider = createCrashLoggerProvider();

/**
 * Records a non-fatal error. Attaches optional key/value context to the report.
 * Swallowing errors here is intentional — crash logging must never crash the app.
 */
export async function recordError(
  error: Error,
  context?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await provider.recordError(error, context);
  } catch {
    // Fail silently
  }
}

/** Appends a breadcrumb message to the crash log trail. */
export async function log(message: string): Promise<void> {
  try {
    await provider.log(message);
  } catch {
    // Fail silently
  }
}

/** Associates a user ID with crash reports. Pass null to clear. */
export async function setUserId(userId: string | null): Promise<void> {
  try {
    await provider.setUserId(userId);
  } catch {
    // Fail silently
  }
}

/** Attaches a custom key/value pair to all subsequent crash reports. */
export async function setCustomKey(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  try {
    await provider.setCustomKey(key, value);
  } catch {
    // Fail silently
  }
}

/**
 * Forces a native crash for QA/testing purposes.
 * Only invoke from a debug or internal build.
 */
export function crash(): void {
  provider.crash();
}
