import { FirebaseAnalyticsProvider } from "./providers/firebase/FirebaseAnalyticsProvider";
import type { IAnalyticsProvider } from "./providers/IAnalyticsProvider";

/**
 * Returns the production Analytics implementation (Firebase).
 */
export function createAnalyticsProvider(): IAnalyticsProvider {
  return new FirebaseAnalyticsProvider();
}
