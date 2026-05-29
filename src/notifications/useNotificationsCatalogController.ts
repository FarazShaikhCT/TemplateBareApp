import { useCallback, useEffect, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { deepLinkSchemePrefix } from "../navigation/linking";
import { useAppTheme } from "../theme/ThemeContext";
import { NotificationManager } from "./NotificationManager";
import type { NotificationPermissionStatus } from "./types";
import { logger } from "../utils/logger";

function buildFcmTokenErrorAlert(detail: string | null): {
  title: string;
  message: string;
} {
  const authHint =
    Platform.OS === "android" && detail?.includes("AUTHENTICATION_FAILED")
      ? "\n\nThis usually means Firebase cannot verify your app: register the signing key SHA-1 and SHA-256 in Firebase Console → Project settings → Your Android app, download a fresh google-services.json, and ensure package_name matches your applicationId (including dev/staging flavor suffixes)."
      : "";
  return {
    title: "Could not get FCM token",
    message: `${
      detail ? `${detail}\n` : ""
    }Push still works on iOS with APNs; on Android, FCM needs a valid Firebase Android app config.${authHint}`,
  };
}

export function useNotificationsCatalogController() {
  const { colors: themeColors } = useAppTheme();
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>("notDetermined");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await NotificationManager.checkPermission();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    refreshPermissionStatus();

    const unsubToken = NotificationManager.onTokenRefresh(token => {
      setFcmToken(token);
    });

    const unsubReceived = NotificationManager.onNotificationReceived(data => {
      logger.debug("Notification received:", data);
    });

    const unsubOpened = NotificationManager.onNotificationOpened(data => {
      logger.debug("Notification opened:", data);
    });

    const appStateSub = AppState.addEventListener("change", nextState => {
      if (nextState === "active") {
        refreshPermissionStatus();
      }
    });

    return () => {
      unsubToken();
      unsubReceived();
      unsubOpened();
      appStateSub.remove();
    };
  }, [refreshPermissionStatus]);

  useFocusEffect(
    useCallback(() => {
      refreshPermissionStatus();
    }, [refreshPermissionStatus]),
  );

  const loadFCMToken = useCallback(async () => {
    const token = await NotificationManager.getFCMToken();
    setFcmToken(token);
    if (!token) {
      const { title, message } = buildFcmTokenErrorAlert(
        NotificationManager.getLastFCMTokenFetchError(),
      );
      Alert.alert(title, message);
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await NotificationManager.requestPermission();
      await refreshPermissionStatus();
      if (status === "authorized" || status === "provisional") {
        await loadFCMToken();
        Alert.alert("Success", "Notification permission granted!");
      } else {
        Alert.alert(
          "Permission Denied",
          "Notification permission was not granted",
        );
      }
    } catch (error) {
      console.error("Permission request error:", error);
      await refreshPermissionStatus();
      Alert.alert("Error", "Failed to request permission");
    } finally {
      setIsLoading(false);
    }
  }, [loadFCMToken, refreshPermissionStatus]);

  const handleShowSimpleNotification = useCallback(async () => {
    await NotificationManager.displayNotification({
      title: "Simple Notification",
      body: "This is a simple local notification",
      android: {
        channelId: "default",
      },
    });
  }, []);

  const handleShowHighPriorityNotification = useCallback(async () => {
    await NotificationManager.displayNotification({
      title: "Important Alert",
      body: "This is a high priority notification with sound and vibration",
      android: {
        channelId: "high-priority",
        importance: "high",
        color: themeColors.error,
        autoCancel: true,
      },
      ios: {
        sound: "default",
      },
    });
  }, [themeColors.error]);

  const handleShowNotificationWithData = useCallback(async () => {
    await NotificationManager.displayNotification({
      title: "Notification with Data & Deep Link",
      body: `Tap to open via deep link: ${deepLinkSchemePrefix}notifications`,
      data: {
        screen: "NotificationsCatalog",
        itemId: "12345",
        timestamp: Date.now().toString(),
        deepLink: `${deepLinkSchemePrefix}notifications?source=notification`,
      },
      android: {
        channelId: "default",
      },
    });
  }, []);

  const handleScheduleNotification = useCallback(async () => {
    try {
      const scheduledTime = Date.now() + 10000;

      await NotificationManager.scheduleNotification({
        title: "Scheduled Notification",
        body: "This notification was scheduled 10 seconds ago",
        schedule: {
          timestamp: scheduledTime,
          allowWhileIdle: true,
        },
        android: {
          channelId: "default",
        },
      });

      Alert.alert("Success", "Notification scheduled for 10 seconds from now");
    } catch (e) {
      Alert.alert(
        "Schedule failed",
        e instanceof Error ? e.message : "Could not schedule notification",
      );
    }
  }, []);

  const handleScheduleDeepLinkNotification = useCallback(async () => {
    try {
      const scheduledTime = Date.now() + 3000;

      await NotificationManager.scheduleNotification({
        title: "Test Deep Link",
        body: "Tap to navigate to Home",
        data: {
          deepLink: `${deepLinkSchemePrefix}home?source=test`,
        },
        schedule: {
          timestamp: scheduledTime,
          allowWhileIdle: true,
        },
        android: {
          channelId: "default",
        },
        ios: {
          sound: "default",
        },
      });

      Alert.alert(
        "Success",
        "Test notification scheduled for 3 seconds from now. It will navigate to Home when tapped.",
      );
    } catch (e) {
      Alert.alert(
        "Schedule failed",
        e instanceof Error ? e.message : "Could not schedule notification",
      );
    }
  }, []);

  const handleScheduleDailyNotification = useCallback(async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await NotificationManager.scheduleNotification({
        title: "Daily Reminder",
        body: "This is your daily reminder",
        schedule: {
          timestamp: tomorrow.getTime(),
          repeatFrequency: "daily",
          allowWhileIdle: true,
        },
        android: {
          channelId: "default",
        },
      });

      Alert.alert("Success", "Daily notification scheduled for 9:00 AM");
    } catch (e) {
      Alert.alert(
        "Schedule failed",
        e instanceof Error ? e.message : "Could not schedule notification",
      );
    }
  }, []);

  const handleCancelAllNotifications = useCallback(async () => {
    await NotificationManager.cancelAllNotifications();
    Alert.alert("Success", "All notifications cancelled");
  }, []);

  const onFcmTokenPress = useCallback(() => {
    if (fcmToken) {
      Alert.alert("FCM Token", fcmToken, [{ text: "OK" }]);
    }
  }, [fcmToken]);

  return {
    permissionStatus,
    fcmToken,
    isLoading,
    themeColors,
    loadFCMToken,
    handleRequestPermission,
    handleShowSimpleNotification,
    handleShowHighPriorityNotification,
    handleShowNotificationWithData,
    handleScheduleNotification,
    handleScheduleDeepLinkNotification,
    handleScheduleDailyNotification,
    handleCancelAllNotifications,
    onFcmTokenPress,
  };
}
