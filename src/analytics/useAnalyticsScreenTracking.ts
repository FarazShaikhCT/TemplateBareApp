import { useRef, useCallback } from "react";
import type { NavigationContainerRef } from "@react-navigation/native";
import { logScreenView } from "./analytics";

/**
 * Hook that tracks screen views via Firebase Analytics.
 * Attach the returned `onStateChange` and `ref` to your NavigationContainer.
 *
 * Usage:
 * ```tsx
 * const { navigationRef, onStateChange } = useAnalyticsScreenTracking();
 * <NavigationContainer ref={navigationRef} onStateChange={onStateChange}>
 * ```
 */
export function useAnalyticsScreenTracking() {
  const navigationRef = useRef<NavigationContainerRef<{}>>(null);
  const routeNameRef = useRef<string | undefined>();

  const onReady = useCallback(() => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  }, []);

  const onStateChange = useCallback(() => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (currentRouteName && previousRouteName !== currentRouteName) {
      logScreenView(currentRouteName);
    }

    routeNameRef.current = currentRouteName;
  }, []);

  return { navigationRef, onReady, onStateChange };
}
