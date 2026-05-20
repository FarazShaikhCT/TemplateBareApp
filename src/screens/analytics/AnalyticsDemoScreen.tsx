import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logEvent, logScreenView } from '../../analytics/analytics';
import { useThemedStyles } from '../../theme/useThemedStyles';

export function AnalyticsDemoScreen() {
  const insets = useSafeAreaInsets();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const onLogEvent = useCallback(async () => {
    await logEvent('analytics_demo', { trigger: 'demo_button' });
    setLastAction('Sent logEvent: analytics_demo');
  }, []);

  const onLogScreenView = useCallback(async () => {
    await logScreenView('AnalyticsDemoScreen');
    setLastAction('Sent logScreenView: AnalyticsDemoScreen');
  }, []);

  const styles = useThemedStyles(
    colors => ({
      scroll: {
        flex: 1,
        backgroundColor: colors.background,
      },
      content: {
        padding: 16,
        paddingBottom: 32,
        paddingTop: 16 + insets.top,
        gap: 12,
      },
      title: { fontSize: 22, fontWeight: '700', color: colors.text1 },
      caption: { fontSize: 14, opacity: 0.75, color: colors.text2 },
      btn: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 4,
      },
      btnText: { color: colors.textOnPrimary, fontWeight: '600' },
      status: { fontSize: 14, color: colors.text1, marginTop: 8 },
    }),
    [insets.top],
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics demo</Text>
      <Text style={styles.caption}>
        Sends Firebase Analytics calls. Inspect Firebase DebugView or native logs to
        verify delivery; this screen shows a short local confirmation after each tap.
      </Text>

      <Pressable
        style={styles.btn}
        onPress={onLogEvent}
        accessibilityRole="button"
        accessibilityLabel="Log analytics demo event"
      >
        <Text style={styles.btnText}>Log event (analytics_demo)</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={onLogScreenView}
        accessibilityRole="button"
        accessibilityLabel="Log screen view for Analytics demo screen"
      >
        <Text style={styles.btnText}>Log screen view (AnalyticsDemoScreen)</Text>
      </Pressable>

      {lastAction ? <Text style={styles.status}>{lastAction}</Text> : null}
    </ScrollView>
  );
}
