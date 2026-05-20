/**
 * Abstraction over Remote Config so implementations can be swapped (e.g. Firebase, tests).
 */
export interface IRemoteConfigProvider {
  /** Apply in-app defaults before fetch; values are used when remote values are unavailable. */
  setDefaults(
    defaults: Record<string, string | number | boolean>,
  ): Promise<void>;
  /** Fetch from the backend and activate so getters return new values. */
  fetchAndActivate(): Promise<boolean>;
  getString(key: string): string;
  getBoolean(key: string): boolean;
  getNumber(key: string): number;
  /** Human-readable last fetch status from the native SDK. */
  getLastFetchStatus(): string;
  /** Milliseconds since epoch when config was last fetched, or -1 if unknown. */
  getFetchTimeMillis(): number;
}
