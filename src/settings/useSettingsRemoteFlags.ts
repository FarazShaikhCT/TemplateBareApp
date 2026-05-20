import { useRemoteConfig } from '../remoteConfig/RemoteConfigContext';

export function useSettingsRemoteFlags() {
  const {
    values: { showLanguagePicker, showThemeToggle },
  } = useRemoteConfig();
  return { showLanguagePicker, showThemeToggle };
}
