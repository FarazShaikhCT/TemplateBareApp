module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Required for @react-navigation/drawer + react-native-reanimated (worklets). Must be last.
  plugins: ['react-native-reanimated/plugin'],
};
