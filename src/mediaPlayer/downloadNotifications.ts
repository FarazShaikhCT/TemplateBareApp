import notifee, { AndroidImportance } from "@notifee/react-native";
import { Platform } from "react-native";

const ANDROID_CHANNEL_ID = "mediaPlayerDownloads";

let androidChannelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android" || androidChannelReady) {
    return;
  }
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: "Media downloads",
    importance: AndroidImportance.DEFAULT,
  });
  androidChannelReady = true;
}

function notificationId(itemId: string): string {
  return `mp-download-${itemId}`;
}

/**
 * Prompts for notification permission where required (iOS; Android 13+).
 */
export async function requestDownloadNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    const s = settings.authorizationStatus;
    // Notifee: AUTHORIZED = 1, PROVISIONAL = 2 (iOS quiet delivery).
    return s === 1 || s === 2;
  } catch {
    return false;
  }
}

export async function showDownloadProgressNotification(
  itemId: string,
  title: string,
  progress: Readonly<{ bytesWritten: number; bytesExpected: number }>,
): Promise<void> {
  try {
    await ensureAndroidChannel();
    const id = notificationId(itemId);
    const hasTotal = progress.bytesExpected > 0;
    const max = hasTotal ? progress.bytesExpected : 100;
    const current = hasTotal
      ? Math.min(progress.bytesWritten, max)
      : Math.min(progress.bytesWritten, 100);
    const pct = hasTotal
      ? Math.min(
          100,
          Math.round((100 * progress.bytesWritten) / progress.bytesExpected),
        )
      : 0;

    await notifee.displayNotification({
      id,
      title: title.slice(0, 80),
      body: hasTotal
        ? `${pct}% · ${formatBytes(progress.bytesWritten)} / ${formatBytes(
            progress.bytesExpected,
          )}`
        : `${formatBytes(progress.bytesWritten)} downloaded`,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        ongoing: true,
        onlyAlertOnce: true,
        progress: {
          max,
          current,
          indeterminate: !hasTotal,
        },
        pressAction: { id: "default" },
      },
    });
  } catch {
    /* native module missing or permission denied */
  }
}

export async function showDownloadPausedNotification(
  itemId: string,
  title: string,
): Promise<void> {
  try {
    await ensureAndroidChannel();
    await notifee.displayNotification({
      id: notificationId(itemId),
      title: title.slice(0, 80),
      body: "Download paused — open the app to resume.",
      android: {
        channelId: ANDROID_CHANNEL_ID,
        ongoing: false,
        onlyAlertOnce: true,
      },
      ios: { sound: "default" },
    });
  } catch {
    /* ignore */
  }
}

export async function showDownloadFinishedNotification(
  itemId: string,
  title: string,
  ok: boolean,
): Promise<void> {
  try {
    await ensureAndroidChannel();
    await notifee.cancelNotification(notificationId(itemId));
    await notifee.displayNotification({
      id: `${notificationId(itemId)}-done`,
      title: title.slice(0, 80),
      body: ok ? "Download complete" : "Download failed",
      android: {
        channelId: ANDROID_CHANNEL_ID,
        pressAction: { id: "default" },
      },
      ios: { sound: "default" },
    });
  } catch {
    /* ignore */
  }
}

export async function clearDownloadNotification(itemId: string): Promise<void> {
  try {
    await notifee.cancelNotification(notificationId(itemId));
    await notifee.cancelNotification(`${notificationId(itemId)}-done`);
  } catch {
    /* ignore */
  }
}

function formatBytes(n: number): string {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
