import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { REMOTE_CONFIG_KEYS } from '../../remoteConfig/remoteConfigDefaults';
import { useRemoteConfig } from '../../remoteConfig/RemoteConfigContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { useThemedStyles } from '../../theme/useThemedStyles';

export function RemoteConfigScreen() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useAppTheme();
  const { ready, refresh, values } = useRemoteConfig();
  const {
    demoMessage,
    demoFeatureEnabled,
    demoRolloutPercent,
    lastFetchStatus,
    fetchTimeMillis,
  } = values;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState<boolean | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const onFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ok = await refresh();
      setActivated(ok);
      setLastFetchedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

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
      row: { gap: 4 },
      label: { fontSize: 12, fontWeight: '600', color: colors.text2 },
      value: { fontSize: 16, color: colors.text1 },
      btn: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
      },
      btnText: { color: colors.textOnPrimary, fontWeight: '600' },
      error: { color: colors.error, fontSize: 14 },
    }),
    [insets.top],
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Remote config</Text>
      <Text style={styles.caption}>
        Uses Firebase Remote Config. Set the same keys in the Firebase console to
        override defaults after fetch.
      </Text>

      <Pressable
        style={styles.btn}
        onPress={onFetch}
        disabled={!ready || loading}
        accessibilityRole="button"
        accessibilityLabel="Fetch and activate remote config"
      >
        {loading ? (
          <ActivityIndicator color={themeColors.textOnPrimary} />
        ) : (
          <Text style={styles.btnText}>Fetch and activate</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {activated !== null ? (
        <Text style={styles.caption}>
          fetchAndActivate returned: {activated ? 'true' : 'false'}
          {lastFetchedAt !== null
            ? ` · ${new Date(lastFetchedAt).toLocaleTimeString()}`
            : ''}
        </Text>
      ) : null}

      <View style={styles.row}>
        <Text style={styles.label}>{REMOTE_CONFIG_KEYS.demoMessage}</Text>
        <Text style={styles.value}>{demoMessage}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{REMOTE_CONFIG_KEYS.demoFeatureEnabled}</Text>
        <Text style={styles.value}>{String(demoFeatureEnabled)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{REMOTE_CONFIG_KEYS.demoRolloutPercent}</Text>
        <Text style={styles.value}>{String(demoRolloutPercent)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>lastFetchStatus</Text>
        <Text style={styles.value}>{lastFetchStatus}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>fetchTimeMillis</Text>
        <Text style={styles.value}>{String(fetchTimeMillis)}</Text>
      </View>
    </ScrollView>
  );
}
