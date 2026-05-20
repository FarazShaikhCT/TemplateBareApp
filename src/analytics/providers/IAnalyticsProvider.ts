/**
 * Abstraction over analytics so implementations can be swapped (e.g. Firebase, tests).
 */
export interface IAnalyticsProvider {
  logEvent(
    name: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<void>;
  logScreenView(screenName: string, screenClass?: string): Promise<void>;
  setUserId(userId: string | null): Promise<void>;
  setUserProperty(name: string, value: string | null): Promise<void>;
}
