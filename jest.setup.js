/* eslint-env jest */

const mockRemoteConfigValue = () => ({
  asString: () => "",
  asBoolean: () => false,
  asNumber: () => 0,
  getSource: () => "default",
});

const mockRemoteConfig = () => ({
  settings: { minimumFetchIntervalMillis: 0 },
});

jest.mock("@react-native-firebase/app", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    name: "[DEFAULT]",
    options: {},
  })),
}));

jest.mock("@react-native-firebase/remote-config", () => ({
  __esModule: true,
  getRemoteConfig: jest.fn(() => mockRemoteConfig()),
  getValue: jest.fn(() => mockRemoteConfigValue()),
  activate: jest.fn(() => Promise.resolve(true)),
  onConfigUpdate: jest.fn(() => jest.fn()),
  fetchAndActivate: jest.fn(() => Promise.resolve(true)),
  setConfigSettings: jest.fn(() => Promise.resolve()),
  setDefaults: jest.fn(() => Promise.resolve()),
  lastFetchStatus: jest.fn(() => "success"),
  fetchTimeMillis: jest.fn(() => 0),
}));

jest.mock("@react-native-firebase/analytics", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    logEvent: jest.fn(() => Promise.resolve()),
    logScreenView: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
    setUserProperty: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve("mock-fcm-token")),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
  })),
}));

jest.mock("@react-native-firebase/crashlytics", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    log: jest.fn(),
    recordError: jest.fn(),
    crash: jest.fn(),
    setUserId: jest.fn(),
    setAttribute: jest.fn(),
  })),
}));

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1 }),
    ),
    createChannel: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
    createTriggerNotification: jest.fn(() => Promise.resolve("mock-id")),
    cancelNotification: jest.fn(() => Promise.resolve()),
    cancelAllNotifications: jest.fn(() => Promise.resolve()),
    getTriggerNotificationIds: jest.fn(() => Promise.resolve([])),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(() => jest.fn()),
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1 }),
    ),
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4, LOW: 2, MIN: 1 },
  AndroidNotificationSetting: { ENABLED: 1 },
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 0,
    NOT_DETERMINED: -1,
    PROVISIONAL: 2,
  },
  EventType: { DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2 },
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("./src/navigation/ThemedNavigationContainer", () => ({
  ThemedNavigationContainer: () => null,
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { scheme: "exporn", slug: "expo-rn-template" },
  },
}));

jest.mock("expo-linking", () => ({
  createURL: () => "exp://127.0.0.1/",
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    configure: jest.fn(),
    fetch: jest.fn(() =>
      Promise.resolve({
        type: "wifi",
        isConnected: true,
        isInternetReachable: true,
      }),
    ),
  },
}));

jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock"),
);

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Mock = ({ children, ...props }) => <View {...props}>{children}</View>;
  return {
    GestureHandlerRootView: Mock,
    PanGestureHandler: Mock,
    TapGestureHandler: Mock,
    State: {},
    ScrollView: View,
    NativeViewGestureHandler: Mock,
    gestureHandlerRootHOC: C => C,
    Directions: {},
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  return {
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetModal: () => null,
    BottomSheetBackdrop: () => null,
    BottomSheetView: ({ children }) => children,
    BottomSheetScrollView: ({ children }) => children,
  };
});

jest.mock("./src/navigation/RootNavigator", () => ({
  RootNavigator: () => null,
}));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const { View } = require("react-native");
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

jest.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    remove: jest.fn(),
    clearAll: jest.fn(),
  }),
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en" }],
}));
