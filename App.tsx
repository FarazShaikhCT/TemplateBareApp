import "./src/third-party/i18n/i18n";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemedNavigationContainer } from "./src/navigation/ThemedNavigationContainer";
import { QueryProvider } from "./src/query/QueryProvider";
import { AppThemeProvider } from "./src/theme/ThemeContext";
import { ConnectivityProvider } from "./src/connectivity/ConnectivityHelper";
import { AppRootErrorBoundary } from "./src/utils/errorBoundary";
import { LoadingProvider } from "./src/utils/loading";
import { logEvent } from "./src/analytics/analytics";
import { RemoteConfigProvider } from "./src/remoteConfig/RemoteConfigContext";
import { FeedbackProvider } from "./src/feedback";
import { NotificationsProvider } from "./src/notifications";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <NotificationsProvider>
            <FeedbackProvider>
              <QueryProvider>
                <AppThemeProvider>
                  <ConnectivityProvider>
                    <LoadingProvider>
                      <AppRootErrorBoundary>
                        <RemoteConfigProvider>
                          <ThemedNavigationContainer />
                        </RemoteConfigProvider>
                      </AppRootErrorBoundary>
                    </LoadingProvider>
                  </ConnectivityProvider>
                </AppThemeProvider>
              </QueryProvider>
            </FeedbackProvider>
          </NotificationsProvider>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
