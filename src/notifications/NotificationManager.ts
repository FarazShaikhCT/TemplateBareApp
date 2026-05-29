import messaging from '@react-native-firebase/messaging';
import { logger } from '../utils/logger';
import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import type {
  LocalNotification,
  NotificationChannel,
  NotificationPermissionStatus,
  PushNotificationData,
} from './types';

/** @see @notifee/react-native/dist/types/Trigger.js — avoid named enum imports; Metro can bind them as undefined from CJS `__exportStar`. */
const NOTIFEE_TRIGGER_TIMESTAMP = 0;

const NOTIFEE_REPEAT = {
  HOURLY: 0,
  DAILY: 1,
  WEEKLY: 2,
} as const;

class NotificationManagerClass {
  private fcmToken: string | null = null;
  /** Set when {@link getFCMToken} fails (e.g. Firebase Installations AUTHENTICATION_FAILED on Android). */
  private lastFCMTokenFetchError: string | null = null;
  private readonly onTokenRefreshCallbacks = new Set<(token: string) => void>();
  private readonly onNotificationReceivedCallbacks = new Set<
    (data: PushNotificationData) => void
  >();
  private readonly onNotificationOpenedCallbacks = new Set<
    (data: PushNotificationData) => void
  >();

  private emitTokenRefresh(token: string): void {
    this.onTokenRefreshCallbacks.forEach(cb => cb(token));
  }

  private emitNotificationReceived(data: PushNotificationData): void {
    this.onNotificationReceivedCallbacks.forEach(cb => cb(data));
  }

  private emitNotificationOpened(data: PushNotificationData): void {
    this.onNotificationOpenedCallbacks.forEach(cb => cb(data));
  }

  async initialize() {
    await this.createDefaultChannels();
    this.setupMessageHandlers();
    this.setupForegroundListener();
    this.setupNotificationOpenedListener();
  }

  private async createDefaultChannels() {
    await notifee.createChannel({
      id: 'default',
      name: 'Default',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.createChannel({
      id: 'high-priority',
      name: 'High Priority',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: 'low-priority',
      name: 'Low Priority',
      importance: AndroidImportance.LOW,
    });
  }

  private setupMessageHandlers() {
    messaging().onMessage(async remoteMessage => {
      this.emitNotificationReceived(remoteMessage as PushNotificationData);

      if (remoteMessage.notification) {
        await this.displayNotification({
          title: remoteMessage.notification.title || '',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data as Record<string, unknown>,
          android: {
            channelId: 'default',
          },
        });
      }
    });

    messaging().onTokenRefresh(token => {
      this.fcmToken = token;
      this.emitTokenRefresh(token);
    });
  }

  private setupForegroundListener() {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification) {
        const data: PushNotificationData = {
          data: detail.notification.data as Record<string, string>,
        };
          this.emitNotificationOpened(data);
      }
    });
  }

  private setupNotificationOpenedListener() {
    messaging().onNotificationOpenedApp(remoteMessage => {
      this.emitNotificationOpened(remoteMessage as PushNotificationData);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          this.emitNotificationOpened(remoteMessage as PushNotificationData);
        }
      });
  }

  async requestPermission(): Promise<NotificationPermissionStatus> {
    // Notifee drives the system dialog on Android 13+ (POST_NOTIFICATIONS) and iOS (UNUserNotificationCenter).
    await notifee.requestPermission();
    await messaging().requestPermission();

    const settings = await notifee.getNotificationSettings();
    const status = this.mapNotifeeAuthorizationStatus(settings.authorizationStatus);

    if (status === 'authorized' || status === 'provisional') {
      await messaging().registerDeviceForRemoteMessages();
    }

    return status;
  }

  async checkPermission(): Promise<NotificationPermissionStatus> {
    const settings = await notifee.getNotificationSettings();
    return this.mapNotifeeAuthorizationStatus(settings.authorizationStatus);
  }

  private mapNotifeeAuthorizationStatus(
    status: number,
  ): NotificationPermissionStatus {
    switch (status) {
      case AuthorizationStatus.AUTHORIZED:
        return 'authorized';
      case AuthorizationStatus.PROVISIONAL:
        return 'provisional';
      case AuthorizationStatus.DENIED:
        return 'denied';
      case AuthorizationStatus.NOT_DETERMINED:
      default:
        return 'notDetermined';
    }
  }

  getLastFCMTokenFetchError(): string | null {
    return this.lastFCMTokenFetchError;
  }

  async getFCMToken(): Promise<string | null> {
    this.lastFCMTokenFetchError = null;
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      const permissionStatus = await this.checkPermission();
      if (permissionStatus === 'authorized' || permissionStatus === 'provisional') {
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          await messaging().registerDeviceForRemoteMessages();
        }
        this.fcmToken = await messaging().getToken();
        logger.debug('FCM token:', this.fcmToken);
        return this.fcmToken;
      }
    } catch (error) {
      this.lastFCMTokenFetchError = formatErrorForDiagnostics(error);
      logger.warn('FCM token not available:', error);
    }

    return null;
  }

  async displayNotification(notification: LocalNotification): Promise<string> {
    const channelId = notification.android?.channelId || 'default';

    const androidConfig: any = {
      channelId,
      smallIcon: notification.android?.smallIcon || 'ic_launcher',
      autoCancel: notification.android?.autoCancel ?? true,
      ongoing: notification.android?.ongoing ?? false,
      importance: this.mapImportance(notification.android?.importance),
    };

    if (notification.android?.largeIcon && typeof notification.android.largeIcon === 'string') {
      androidConfig.largeIcon = notification.android.largeIcon;
    }
    if (notification.android?.color && typeof notification.android.color === 'string') {
      androidConfig.color = notification.android.color;
    }
    if (notification.android?.sound && typeof notification.android.sound === 'string') {
      androidConfig.sound = notification.android.sound;
    }
    if (notification.android?.actions && Array.isArray(notification.android.actions)) {
      androidConfig.actions = notification.android.actions;
    }

    const iosConfig: any = {};
    if (notification.ios?.sound && typeof notification.ios.sound === 'string') {
      iosConfig.sound = notification.ios.sound;
    }
    if (notification.ios?.badge && typeof notification.ios.badge === 'number') {
      iosConfig.badgeCount = notification.ios.badge;
    }
    if (notification.ios?.categoryId && typeof notification.ios.categoryId === 'string') {
      iosConfig.categoryId = notification.ios.categoryId;
    }
    if (notification.ios?.attachments && Array.isArray(notification.ios.attachments)) {
      iosConfig.attachments = notification.ios.attachments;
    }

    const notificationPayload: any = {
      title: notification.title,
      body: notification.body,
      android: androidConfig,
      ios: iosConfig,
    };

    if (notification.id && typeof notification.id === 'string' && notification.id.trim().length > 0) {
      notificationPayload.id = notification.id.trim();
    }

    if (notification.data) {
      notificationPayload.data = notification.data;
    }

    const notificationId = await notifee.displayNotification(notificationPayload);

    return notificationId;
  }

  async scheduleNotification(
    notification: LocalNotification,
  ): Promise<string> {
    if (!notification.schedule) {
      throw new Error('Schedule configuration is required for scheduled notifications');
    }

    await ensureAndroidExactAlarmsAllowedForTriggers();

    const channelId = notification.android?.channelId || 'default';

    const notificationIdKey =
      typeof notification.id === 'string' && notification.id.trim().length > 0
        ? notification.id.trim()
        : `scheduled-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const trigger: any = {
      type: NOTIFEE_TRIGGER_TIMESTAMP,
      timestamp: notification.schedule.timestamp,
      alarmManager: {
        allowWhileIdle: notification.schedule.allowWhileIdle ?? true,
      },
    };

    if (notification.schedule.repeatFrequency) {
      trigger.type = NOTIFEE_TRIGGER_TIMESTAMP;
      trigger.repeatFrequency = this.mapRepeatFrequency(
        notification.schedule.repeatFrequency,
      );
    }

    const iosConfig: any = {};
    if (notification.ios?.sound && typeof notification.ios.sound === 'string') {
      iosConfig.sound = notification.ios.sound;
    }
    if (notification.ios?.categoryId && typeof notification.ios.categoryId === 'string') {
      iosConfig.categoryId = notification.ios.categoryId;
    }

    const notificationId = await notifee.createTriggerNotification(
      {
        id: notificationIdKey,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        android: {
          channelId,
          smallIcon: notification.android?.smallIcon || 'ic_launcher',
          importance: this.mapImportance(notification.android?.importance),
        },
        ios: iosConfig,
      },
      trigger,
    );

    return notificationId;
  }

  private mapImportance(importance?: string): AndroidImportance {
    switch (importance) {
      case 'high':
        return AndroidImportance.HIGH;
      case 'low':
        return AndroidImportance.LOW;
      case 'min':
        return AndroidImportance.MIN;
      default:
        return AndroidImportance.DEFAULT;
    }
  }

  private mapRepeatFrequency(frequency: string): number {
    switch (frequency) {
      case 'hourly':
        return NOTIFEE_REPEAT.HOURLY;
      case 'daily':
        return NOTIFEE_REPEAT.DAILY;
      case 'weekly':
        return NOTIFEE_REPEAT.WEEKLY;
      default:
        return NOTIFEE_REPEAT.DAILY;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }

  async createChannel(channel: NotificationChannel): Promise<void> {
    await notifee.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: this.mapImportance(channel.importance),
      sound: channel.sound,
      vibration: channel.vibration ?? true,
      badge: channel.badge ?? true,
    });
  }

  async deleteChannel(channelId: string): Promise<void> {
    await notifee.deleteChannel(channelId);
  }

  async getBadgeCount(): Promise<number> {
    return await notifee.getBadgeCount();
  }

  async setBadgeCount(count: number): Promise<void> {
    await notifee.setBadgeCount(count);
  }

  async incrementBadge(): Promise<void> {
    const currentCount = await this.getBadgeCount();
    await this.setBadgeCount(currentCount + 1);
  }

  async decrementBadge(): Promise<void> {
    const currentCount = await this.getBadgeCount();
    await this.setBadgeCount(Math.max(0, currentCount - 1));
  }

  onTokenRefresh(callback: (token: string) => void): () => void {
    this.onTokenRefreshCallbacks.add(callback);
    return () => {
      this.onTokenRefreshCallbacks.delete(callback);
    };
  }

  onNotificationReceived(
    callback: (data: PushNotificationData) => void,
  ): () => void {
    this.onNotificationReceivedCallbacks.add(callback);
    return () => {
      this.onNotificationReceivedCallbacks.delete(callback);
    };
  }

  onNotificationOpened(
    callback: (data: PushNotificationData) => void,
  ): () => void {
    this.onNotificationOpenedCallbacks.add(callback);
    return () => {
      this.onNotificationOpenedCallbacks.delete(callback);
    };
  }

  async subscribeToTopic(topic: string): Promise<void> {
    await messaging().subscribeToTopic(topic);
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    await messaging().unsubscribeFromTopic(topic);
  }

  async deleteToken(): Promise<void> {
    await messaging().deleteToken();
    this.fcmToken = null;
  }
}

export const NotificationManager = new NotificationManagerClass();

function formatErrorForDiagnostics(error: unknown): string {
  if (error && typeof error === 'object') {
    const anyErr = error as { code?: string; message?: string };
    if (typeof anyErr.code === 'string' && typeof anyErr.message === 'string') {
      return `${anyErr.code}: ${anyErr.message}`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Android 12+ timestamp triggers need the "Alarms & reminders" (exact alarm) permission.
 * @see https://notifee.app/react-native/docs/triggers#android-12-limitations
 */
async function ensureAndroidExactAlarmsAllowedForTriggers(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 31) return;

  const settings = await notifee.getNotificationSettings();
  if (settings.android?.alarm !== AndroidNotificationSetting.ENABLED) {
    await notifee.openAlarmPermissionSettings();
    throw new Error(
      'Scheduled notifications need the "Alarms & reminders" permission on Android 12+. Enable it in Settings (we opened that screen), then try scheduling again.',
    );
  }
}
