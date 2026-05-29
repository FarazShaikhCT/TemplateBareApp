import analytics from "@react-native-firebase/analytics";

import type { IAnalyticsProvider } from "../IAnalyticsProvider";

export class FirebaseAnalyticsProvider implements IAnalyticsProvider {
  async logEvent(
    name: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<void> {
    await analytics().logEvent(name, params);
  }

  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    });
  }

  async setUserId(userId: string | null): Promise<void> {
    await analytics().setUserId(userId);
  }

  async setUserProperty(name: string, value: string | null): Promise<void> {
    await analytics().setUserProperty(name, value);
  }
}
