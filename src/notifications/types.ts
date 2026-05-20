export interface LocalNotification {
  title: string;
  body: string;
  id?: string;
  data?: Record<string, unknown>;
  android?: AndroidNotificationOptions;
  ios?: IOSNotificationOptions;
  schedule?: NotificationSchedule;
}

export interface AndroidNotificationOptions {
  channelId?: string;
  sound?: string;
  importance?: 'default' | 'high' | 'low' | 'min';
  smallIcon?: string;
  largeIcon?: string;
  color?: string;
  autoCancel?: boolean;
  ongoing?: boolean;
  actions?: NotificationAction[];
}

export interface IOSNotificationOptions {
  sound?: string;
  badge?: number;
  categoryId?: string;
  attachments?: IOSNotificationAttachment[];
}

export interface IOSNotificationAttachment {
  url: string;
  thumbnailHidden?: boolean;
}

export interface NotificationAction {
  id: string;
  title: string;
  pressAction?: {
    id: string;
    launchActivity?: string;
  };
}

export interface NotificationSchedule {
  timestamp: number;
  repeatFrequency?: 'hourly' | 'daily' | 'weekly';
  allowWhileIdle?: boolean;
}

export interface PushNotificationData {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

export type NotificationPermissionStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'provisional';

export interface NotificationChannel {
  id: string;
  name: string;
  description?: string;
  importance?: 'default' | 'high' | 'low' | 'min';
  sound?: string;
  vibration?: boolean;
  badge?: boolean;
}
