/* eslint-env jest */

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    configure: jest.fn(),
    fetch: jest.fn(() =>
      Promise.resolve({
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
      }),
    ),
  },
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = ({ children, ...props }) => <View {...props}>{children}</View>;
  return {
    GestureHandlerRootView: Mock,
    PanGestureHandler: Mock,
    TapGestureHandler: Mock,
    State: {},
    ScrollView: View,
    NativeViewGestureHandler: Mock,
    gestureHandlerRootHOC: (C) => C,
    Directions: {},
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  return {
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetModal: () => null,
    BottomSheetBackdrop: () => null,
    BottomSheetView: ({ children }) => children,
    BottomSheetScrollView: ({ children }) => children,
  };
});

jest.mock('./src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationContainer: React.forwardRef(({ children }, ref) => (
      <View ref={ref}>{children}</View>
    )),
    DefaultTheme: { colors: {} },
    DarkTheme: { colors: {} },
    createNavigationContainerRef: () => ({
      current: { navigate: jest.fn(), reset: jest.fn(), goBack: jest.fn() },
    }),
  };
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    remove: jest.fn(),
    clearAll: jest.fn(),
  }),
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));

jest.mock('@react-native-firebase/remote-config', () => {
  const mockRc = {};
  const mockValue = () => ({
    asString: () => '',
    asBoolean: () => false,
    asNumber: () => 0,
  });

  return {
    __esModule: true,
    getRemoteConfig: jest.fn(() => mockRc),
    setDefaults: jest.fn(() => Promise.resolve()),
    setConfigSettings: jest.fn(() => Promise.resolve()),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    getValue: jest.fn(() => mockValue()),
    activate: jest.fn(() => Promise.resolve()),
    onConfigUpdate: jest.fn(() => jest.fn()),
    lastFetchStatus: jest.fn(() => 'success'),
    fetchTimeMillis: jest.fn(() => -1),
  };
});

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    hasPermission: jest.fn(() => Promise.resolve(true)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    isDeviceRegisteredForRemoteMessages: true,
  })),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1 }),
    ),
    createChannel: jest.fn(() => Promise.resolve('default')),
    displayNotification: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(() => jest.fn()),
    cancelNotification: jest.fn(() => Promise.resolve()),
    cancelAllNotifications: jest.fn(() => Promise.resolve()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
  },
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationSetting: {},
  AuthorizationStatus: { AUTHORIZED: 1 },
  EventType: { PRESS: 1, DISMISSED: 2 },
}));
