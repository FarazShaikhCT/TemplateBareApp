import { FirebaseRemoteConfigProvider } from './providers/firebase/FirebaseRemoteConfigProvider';
import type { IRemoteConfigProvider } from './providers/IRemoteConfigProvider';

/**
 * Returns the production Remote Config implementation (Firebase).
 */
export function createRemoteConfigProvider(): IRemoteConfigProvider {
  return new FirebaseRemoteConfigProvider();
}
