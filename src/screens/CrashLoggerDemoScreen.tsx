import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { crash, log, recordError, setCustomKey, setUserId } from '../crashLogger/crashLogger';
import { BorderRadiusToken } from '../designSystem/generated/borderRadius';
import { FontSizeToken } from '../designSystem/generated/fontSize';
import { FontWeightToken } from '../designSystem/generated/fontWeight';
import { SpacingToken } from '../designSystem/generated/spacing';
import { useThemedStyles } from '../theme/useThemedStyles';

/**
 * Demo screen for the crash-logger module.
 *
 * Provides buttons to exercise every ICrashLoggerProvider method so engineers
 * can verify the integration is wired correctly before shipping.
 *
 * Two crash buttons cover both test scenarios:
 * - JS crash: throws an uncaught error → travels through crashLoggerSetup's
 *   global handler → recorded to Crashlytics with isFatal:true → previous RN
 *   handler runs (red screen in debug, process exit in release). Works in any build.
 * - Native crash: calls crashlytics().crash() directly → bypasses JS entirely →
 *   only visible in release builds (debug builds the process signal is caught by
 *   the Metro dev server before the app terminates).
 */
export function CrashLoggerDemoScreen() {
  const insets = useSafeAreaInsets();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const onRecordError = useCallback(async () => {
    await recordError(new Error('Demo non-fatal error'), { screen: 'CrashLoggerDemoScreen', trigger: 'button' });
    setLastAction('Recorded non-fatal error');
  }, []);

  const onLog = useCallback(async () => {
    await log('CrashLoggerDemoScreen: breadcrumb log message');
    setLastAction('Logged breadcrumb message');
  }, []);

  const onSetUserId = useCallback(async () => {
    await setUserId('demo-user-123');
    setLastAction('Set user ID: demo-user-123');
  }, []);

  const onSetCustomKey = useCallback(async () => {
    await setCustomKey('demo_key', 'demo_value');
    setLastAction('Set custom key: demo_key = demo_value');
  }, []);

  const onClearUserId = useCallback(async () => {
    await setUserId(null);
    setLastAction('Cleared user ID');
  }, []);

  /**
   * Throws an uncaught JS error. This propagates through the global handler
   * registered in crashLoggerSetup.ts, which records it to Crashlytics and
   * then invokes the previous RN error handler. Works in debug and release.
   */
  const onJsCrash = useCallback(() => {
    throw new Error('CrashLoggerDemoScreen: forced JS test crash');
  }, []);

  /**
   * Calls crashlytics().crash() via the provider — a direct native process
   * termination. Only observable in release builds; in debug the Metro dev
   * server intercepts the signal and the app does not visibly exit.
   */
  const onNativeCrash = useCallback(() => {
    crash();
  }, []);

  const styles = useThemedStyles(
    colors => ({
      scroll: {
        flex: 1,
        backgroundColor: colors.background,
      },
      content: {
        padding: SpacingToken.spacing_value_4,
        paddingBottom: SpacingToken.spacing_value_8,
        paddingTop: SpacingToken.spacing_value_4 + insets.top,
        gap: SpacingToken.spacing_value_3,
      },
      title: {
        fontSize: FontSizeToken.heading_sm,
        fontWeight: FontWeightToken['body-bold'],
        color: colors.text1,
      },
      caption: {
        fontSize: FontSizeToken.body_sm,
        color: colors.text3,
      },
      sectionHeader: {
        fontSize: FontSizeToken.body_xs,
        fontWeight: '600',
        color: colors.text2,
        textTransform: 'uppercase',
        marginTop: SpacingToken.spacing_value_2,
      },
      btn: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingVertical: SpacingToken.spacing_value_3,
        paddingHorizontal: SpacingToken.spacing_value_4,
        borderRadius: BorderRadiusToken.lg,
        marginTop: SpacingToken.spacing_value_1,
      },
      btnDanger: {
        alignSelf: 'flex-start',
        backgroundColor: colors.error,
        paddingVertical: SpacingToken.spacing_value_3,
        paddingHorizontal: SpacingToken.spacing_value_4,
        borderRadius: BorderRadiusToken.lg,
        marginTop: SpacingToken.spacing_value_1,
      },
      btnText: { color: colors.textOnPrimary, fontWeight: '600' },
      status: {
        fontSize: FontSizeToken.body_sm,
        color: colors.text1,
        marginTop: SpacingToken.spacing_value_2,
      },
    }),
    [insets.top],
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Crash Logger demo</Text>
      <Text style={styles.caption}>
        Exercises the ICrashLoggerProvider abstraction (backed by Firebase Crashlytics).
        Non-fatal actions appear in the Crashlytics dashboard within a few minutes.
        Use "Throw JS error" to test the full pipeline in any build; use "Native crash"
        only in a release build — it is a no-op in debug.
      </Text>

      <Text style={styles.sectionHeader}>Non-fatal reporting</Text>

      <Pressable
        style={styles.btn}
        onPress={onRecordError}
        accessibilityRole="button"
        accessibilityLabel="Record a non-fatal demo error"
      >
        <Text style={styles.btnText}>Record non-fatal error</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={onLog}
        accessibilityRole="button"
        accessibilityLabel="Append a breadcrumb log message"
      >
        <Text style={styles.btnText}>Log breadcrumb message</Text>
      </Pressable>

      <Text style={styles.sectionHeader}>User / context</Text>

      <Pressable
        style={styles.btn}
        onPress={onSetUserId}
        accessibilityRole="button"
        accessibilityLabel="Set demo user ID on crash reports"
      >
        <Text style={styles.btnText}>Set user ID (demo-user-123)</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={onClearUserId}
        accessibilityRole="button"
        accessibilityLabel="Clear user ID from crash reports"
      >
        <Text style={styles.btnText}>Clear user ID</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={onSetCustomKey}
        accessibilityRole="button"
        accessibilityLabel="Attach a custom key-value pair to crash reports"
      >
        <Text style={styles.btnText}>Set custom key (demo_key)</Text>
      </Pressable>

      <Text style={styles.sectionHeader}>Test crash</Text>

      <Pressable
        style={styles.btnDanger}
        onPress={onJsCrash}
        accessibilityRole="button"
        accessibilityLabel="Throw an uncaught JS error to test the global crash handler pipeline"
      >
        <Text style={styles.btnText}>Throw JS error (debug + release)</Text>
      </Pressable>

      <Pressable
        style={styles.btnDanger}
        onPress={onNativeCrash}
        accessibilityRole="button"
        accessibilityLabel="Force a native process crash — only visible in release builds"
      >
        <Text style={styles.btnText}>Native crash (release builds only)</Text>
      </Pressable>

      {lastAction ? <Text style={styles.status}>Last: {lastAction}</Text> : null}
    </ScrollView>
  );
}
