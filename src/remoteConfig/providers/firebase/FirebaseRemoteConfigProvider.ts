import {
  fetchAndActivate,
  fetchTimeMillis,
  getRemoteConfig,
  getValue,
  lastFetchStatus,
  setConfigSettings,
  setDefaults,
} from "@react-native-firebase/remote-config";

import type { IRemoteConfigProvider } from "../IRemoteConfigProvider";

/** Production default matches Firebase: avoid hammering the service in release builds. */
const PRODUCTION_MIN_FETCH_INTERVAL_MS = 12 * 60 * 60 * 1000;

export class FirebaseRemoteConfigProvider implements IRemoteConfigProvider {
  private readonly rc = getRemoteConfig();

  private async applyFetchIntervalSettings(): Promise<void> {
    await setConfigSettings(this.rc, {
      minimumFetchIntervalMillis: __DEV__
        ? 0
        : PRODUCTION_MIN_FETCH_INTERVAL_MS,
    });
  }

  async setDefaults(
    defaults: Record<string, string | number | boolean>,
  ): Promise<void> {
    await this.applyFetchIntervalSettings();
    await setDefaults(this.rc, defaults);
  }

  async fetchAndActivate(): Promise<boolean> {
    await this.applyFetchIntervalSettings();
    return fetchAndActivate(this.rc);
  }

  getString(key: string): string {
    return getValue(this.rc, key).asString();
  }

  getBoolean(key: string): boolean {
    return getValue(this.rc, key).asBoolean();
  }

  getNumber(key: string): number {
    return getValue(this.rc, key).asNumber();
  }

  getLastFetchStatus(): string {
    try {
      return String(lastFetchStatus(this.rc));
    } catch {
      return "unknown";
    }
  }

  getFetchTimeMillis(): number {
    try {
      return fetchTimeMillis(this.rc);
    } catch {
      return -1;
    }
  }
}
