import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { Linking } from 'react-native';
import { logger } from '../utils/logger';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  logger.debug('Background message received:', remoteMessage);

  if (remoteMessage.notification) {
    await notifee.displayNotification({
      title: remoteMessage.notification.title || '',
      body: remoteMessage.notification.body || '',
      data: remoteMessage.data,
      android: {
        channelId: 'default',
        smallIcon: 'ic_launcher',
      },
    });
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  logger.debug('Background notification event:', type);

  if (type === EventType.PRESS && detail.notification?.data) {
    logger.debug('Notification pressed in background:', detail.notification);

    const deepLink = detail.notification.data.deepLink;
    if (deepLink && typeof deepLink === 'string') {
      logger.debug('Opening deep link from background:', deepLink);
      try {
        await Linking.openURL(deepLink);
      } catch (error) {
        logger.error('Failed to open deep link:', error);
      }
    }
  }
});
