import { createAnalyticsProvider } from "./createAnalyticsProvider";

const analyticsProvider = createAnalyticsProvider();

export async function logEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await analyticsProvider.logEvent(name, params);
  } catch {
    // Analytics logging should never crash the app
  }
}

export async function logScreenView(
  screenName: string,
  screenClass?: string,
): Promise<void> {
  try {
    await analyticsProvider.logScreenView(screenName, screenClass);
  } catch {
    // Fail silently
  }
}

export async function setUserId(userId: string | null): Promise<void> {
  try {
    await analyticsProvider.setUserId(userId);
  } catch {
    // Fail silently
  }
}

export async function setUserProperty(
  name: string,
  value: string | null,
): Promise<void> {
  try {
    await analyticsProvider.setUserProperty(name, value);
  } catch {
    // Fail silently
  }
}
