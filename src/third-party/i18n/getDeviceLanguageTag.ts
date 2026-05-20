import { getLocales } from 'react-native-localize';

export function getDeviceLanguageTag(): string {
  const list = getLocales();
  return list[0]?.languageTag ?? 'en';
}
