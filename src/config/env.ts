import Config from 'react-native-config';
import type { NativeConfig } from 'react-native-config';

type AppEnv = 'development' | 'staging' | 'production';

function requireEnv(key: keyof NativeConfig): string {
  const value = (Config as NativeConfig)[key];
  if (value == null || String(value).trim() === '') {
    throw new Error(
      `Missing react-native-config value: ${String(key)}. ` +
        'Create project-root `.env.dev`, `.env.qa`, and `.env.prod` (see `.env.example`), ' +
        'rebuild the native app for that flavor, and on iOS add the `Select Env File` run script if you use env switching.',
    );
  }
  return String(value).trim();
}

const env = {
  apiBaseUrl: requireEnv('API_BASE_URL'),
  appEnv: ((Config as NativeConfig).APP_ENV ?? 'development') as AppEnv,
} as const;

export default env;
