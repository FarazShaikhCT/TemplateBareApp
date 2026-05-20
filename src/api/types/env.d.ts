// Type augmentation for react-native-config.
// Add a key here for every variable defined in the .env.* flavor files.
declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    APP_ENV?: string;
  }
}
