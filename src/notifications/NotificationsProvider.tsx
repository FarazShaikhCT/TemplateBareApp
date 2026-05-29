import React, { useEffect } from "react";
import { AppState, Linking } from "react-native";
import { NotificationManager } from "./NotificationManager";
import type { PushNotificationData } from "./types";
import { logger } from "../utils/logger";

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({
  children,
}: NotificationsProviderProps) {
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    let cancelled = false;

    async function initializeNotifications() {
      try {
        await NotificationManager.initialize();
        if (cancelled) {
          return;
        }

        unsubscribers.push(
          NotificationManager.onTokenRefresh(token => {
            logger.debug("FCM token refreshed:", token);
          }),
        );

        unsubscribers.push(
          NotificationManager.onNotificationReceived(data => {
            logger.debug("Notification received in foreground:", data);
          }),
        );

        unsubscribers.push(
          NotificationManager.onNotificationOpened(
            (data: PushNotificationData) => {
              logger.debug("Notification opened:", data);

              if (data.data?.deepLink) {
                const deepLinkUrl = data.data.deepLink as string;
                logger.debug(
                  "Opening deep link from notification:",
                  deepLinkUrl,
                );
                Linking.openURL(deepLinkUrl).catch(err => {
                  logger.error("Failed to open deep link:", err);
                });
              }
            },
          ),
        );
      } catch (error) {
        logger.error("Failed to initialize notifications:", error);
      }
    }

    initializeNotifications();

    const appStateSubscription = AppState.addEventListener(
      "change",
      nextAppState => {
        if (nextAppState === "active") {
          NotificationManager.getBadgeCount();
        }
      },
    );

    return () => {
      cancelled = true;
      unsubscribers.forEach(unsub => unsub());
      appStateSubscription.remove();
    };
  }, []);

  return <>{children}</>;
}
