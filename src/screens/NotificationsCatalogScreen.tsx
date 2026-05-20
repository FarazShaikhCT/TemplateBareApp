import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { deepLinkSchemePrefix } from '../navigation/linking';
import { useNotificationsCatalogController } from '../notifications/useNotificationsCatalogController';
import { useThemedStyles } from '../theme/useThemedStyles';

/** Demo screen for Notifee + FCM; uses the same safe-area pattern as `FeedbackCatalogScreen` (drawer stack). */
export function NotificationsCatalogScreen() {
  const insets = useSafeAreaInsets();
  const {
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
  } = useNotificationsCatalogController();

  const styles = useThemedStyles(
    colors => ({
      safeArea: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scroll: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContent: {
        flexGrow: 1,
        paddingBottom: Math.max(24, insets.bottom + 16),
      },
      section: {
        backgroundColor: colors.white,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: colors.text1,
      },
      statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.primaryLight,
        borderRadius: 6,
        marginBottom: 12,
      },
      statusLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 8,
        color: colors.text2,
      },
      statusValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text2,
      },
      statusAuthorized: {
        color: colors.success,
      },
      statusDenied: {
        color: colors.error,
      },
      tokenCard: {
        padding: 12,
        backgroundColor: colors.primaryLight,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.grayBackground,
      },
      tokenText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: colors.text2,
      },
      tokenHint: {
        fontSize: 11,
        color: colors.text3,
        marginTop: 8,
        fontStyle: 'italic',
      },
      button: {
        backgroundColor: colors.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
      },
      buttonSecondary: {
        backgroundColor: colors.grayBackground,
      },
      buttonText: {
        color: colors.textOnPrimary,
        fontSize: 16,
        fontWeight: '600',
      },
      buttonTextSecondary: {
        color: colors.text1,
      },
      infoText: {
        fontSize: 14,
        color: colors.text3,
        lineHeight: 20,
        fontStyle: 'italic',
      },
      infoTextSpacing: {
        marginTop: 12,
      },
      infoTextSpacingSm: {
        marginTop: 8,
      },
      loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `${colors.black}4D`,
        justifyContent: 'center',
        alignItems: 'center',
      },
    }),
    [insets.bottom],
  );

  function Button({
    title,
    onPress,
    variant = 'primary',
    style,
  }: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: object;
  }) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          variant === 'secondary' && styles.buttonSecondary,
          style,
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextSecondary,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              (permissionStatus === 'authorized' ||
                permissionStatus === 'provisional') &&
                styles.statusAuthorized,
              permissionStatus === 'denied' && styles.statusDenied,
            ]}
          >
            {permissionStatus}
          </Text>
        </View>
        {permissionStatus !== 'authorized' && (
          <Button title="Request Permission" onPress={handleRequestPermission} />
        )}
      </View>

      {(permissionStatus === 'authorized' || permissionStatus === 'provisional') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FCM Token (Push Notifications)</Text>
          {!fcmToken && (
            <Button
              title="Get FCM Token"
              onPress={loadFCMToken}
              variant="secondary"
            />
          )}
          {fcmToken && (
            <TouchableOpacity
              style={styles.tokenCard}
              onPress={onFcmTokenPress}
            >
              <Text style={styles.tokenText} numberOfLines={3}>
                {fcmToken}
              </Text>
              <Text style={styles.tokenHint}>Tap to view full token</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local Notifications</Text>
        <Button
          title="Simple Notification"
          onPress={handleShowSimpleNotification}
        />
        <Button
          title="High Priority Notification"
          onPress={handleShowHighPriorityNotification}
        />
        <Button
          title="Notification with Data"
          onPress={handleShowNotificationWithData}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
        <Button
          title="Schedule in 10 Seconds"
          onPress={handleScheduleNotification}
        />
        <Button
          title="Schedule Daily at 9 AM"
          onPress={handleScheduleDailyNotification}
        />
        <Button
          title="Cancel All Scheduled"
          onPress={handleCancelAllNotifications}
          variant="secondary"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deep Link Testing</Text>
        <Text style={styles.infoText}>
          Schedule a notification that will navigate to Home screen when tapped.
        </Text>
        <Button
          title="🔔 Schedule Test Deep Link (3s)"
          onPress={handleScheduleDeepLinkNotification}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.infoText}>
          To test push notifications from a backend, use your Firebase Console to send a
          message to this device's FCM token.
        </Text>
        <Text style={[styles.infoText, styles.infoTextSpacing]}>
          {`To test deep links on iOS Simulator: Run \`xcrun simctl openurl booted ${deepLinkSchemePrefix}home\` in Terminal.`}
        </Text>
        <Text style={[styles.infoText, styles.infoTextSpacingSm]}>
          {`To test deep links on Android: Run \`adb shell am start -W -a android.intent.action.VIEW -d "${deepLinkSchemePrefix}home" <your-application-id>\` in Terminal (use your app applicationId).`}
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}
