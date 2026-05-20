import i18n from 'i18next';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';

import { localStorageImpl } from '../localstorage/LocalStorageImpl';
import { getDeviceLanguageTag } from './getDeviceLanguageTag';
import { matchSupportedLanguage } from './supportedLanguages';

function syncFromDeviceIfNoPreference(): void {
  if (localStorageImpl.getStringValue('app.locale')) {
    return;
  }
  const device = matchSupportedLanguage(getDeviceLanguageTag());
  if (device !== i18n.language) {
    void i18n.changeLanguage(device);
  }
}

export function registerLocaleExternalChangeListeners(): () => void {
  const onAppState = (next: AppStateStatus) => {
    if (next === 'active') {
      syncFromDeviceIfNoPreference();
    }
  };
  const sub = AppState.addEventListener('change', onAppState);
  return () => {
    sub.remove();
  };
}
