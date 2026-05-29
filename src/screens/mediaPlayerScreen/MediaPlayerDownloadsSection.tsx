import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";

import type { QueueItemRow } from "../../mediaPlayer";
import { useThemedStyles } from "../../theme/useThemedStyles";

import { progressPercent, statusLabel } from "./mediaPlayerDownloads.utils";

type MediaPlayerDownloadsSectionProps = Readonly<{
  rowsReady: boolean;
  rows: readonly QueueItemRow[];
  onEnqueue: (id: string) => void;
  onPauseActive: () => void;
  onPlayDownloaded: (localPath: string) => void;
}>;

export function MediaPlayerDownloadsSection({
  rowsReady,
  rows,
  onEnqueue,
  onPauseActive,
  onPlayDownloaded,
}: MediaPlayerDownloadsSectionProps) {
  const styles = useThemedStyles(
    colors => ({
      scroll: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContent: {
        padding: 16,
        paddingBottom: 32,
      },
      intro: {
        fontSize: 14,
        color: colors.text2,
        marginBottom: 16,
      },
      center: {
        paddingVertical: 32,
        alignItems: "center",
      },
      row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
        borderRadius: 10,
        backgroundColor: colors.grayBackground,
        gap: 12,
      },
      rowDownloaded: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
      },
      iconCol: {
        width: 44,
        alignItems: "center",
        justifyContent: "center",
      },
      iconText: {
        fontSize: 22,
      },
      textCol: {
        flex: 1,
        minWidth: 0,
      },
      rowTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text1,
      },
      subtitle: {
        fontSize: 12,
        color: colors.text2,
        marginTop: 4,
      },
      actions: {
        flexDirection: "column",
        gap: 6,
        alignItems: "stretch",
      },
      btn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: "center",
      },
      btnMuted: {
        backgroundColor: colors.grayBackground,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.text2,
      },
      btnDanger: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.error,
      },
      btnText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textOnPrimary,
      },
      btnTextMuted: {
        color: colors.text1,
      },
      btnTextDanger: {
        color: colors.error,
      },
      progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.background,
        marginTop: 8,
        overflow: "hidden",
      },
      progressFill: {
        height: "100%",
        borderRadius: 2,
        backgroundColor: colors.primary,
      },
    }),
    [],
  );

  if (!rowsReady) {
    return (
      <View style={[styles.scroll, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.intro, { marginTop: 12 }]}>
          Preparing download list…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.intro}>
        One download runs at a time. Pause keeps the partial file on disk and
        resumes with HTTP Range; the next queued item starts when the active
        transfer stops. Progress also appears in a system notification (where
        the OS allows it).
      </Text>

      {rows.map(row => {
        const pct = progressPercent(row);
        const canQueue =
          row.status === "idle" ||
          row.status === "paused" ||
          row.status === "error";
        const isDownloaded = row.status === "downloaded";
        const isDownloading = row.status === "downloading";

        const body = (
          <>
            <View style={styles.iconCol}>
              {row.status === "idle" ||
              row.status === "error" ||
              row.status === "paused" ? (
                <Text style={styles.iconText} accessibilityLabel="Download">
                  ⬇
                </Text>
              ) : null}
              {row.status === "queued" ? (
                <Text
                  style={styles.iconText}
                  accessibilityLabel="Waiting in queue"
                >
                  ⋯
                </Text>
              ) : null}
              {row.status === "downloading" ? (
                <ActivityIndicator
                  color="#888"
                  accessibilityLabel="Downloading"
                />
              ) : null}
              {row.status === "downloaded" ? (
                <Text style={styles.iconText} accessibilityLabel="Downloaded">
                  ✓
                </Text>
              ) : null}
            </View>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.subtitle}>{statusLabel(row)}</Text>
              {isDownloading && row.progress ? (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              ) : null}
            </View>
            <View style={styles.actions}>
              {canQueue ? (
                <Pressable
                  style={[styles.btn, styles.btnMuted]}
                  onPress={() => onEnqueue(row.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Queue download for ${row.title}`}
                >
                  <Text style={[styles.btnText, styles.btnTextMuted]}>
                    Download
                  </Text>
                </Pressable>
              ) : null}
              {isDownloading ? (
                <Pressable
                  style={[styles.btn, styles.btnDanger]}
                  onPress={onPauseActive}
                  accessibilityRole="button"
                  accessibilityLabel={`Pause download for ${row.title}`}
                >
                  <Text style={[styles.btnText, styles.btnTextDanger]}>
                    Pause
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </>
        );

        if (isDownloaded) {
          return (
            <Pressable
              key={row.id}
              style={[styles.row, styles.rowDownloaded]}
              onPress={() => onPlayDownloaded(row.localPath)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${row.title} from device`}
            >
              {body}
            </Pressable>
          );
        }

        return (
          <View key={row.id} style={styles.row} accessibilityLabel={row.title}>
            {body}
          </View>
        );
      })}
    </ScrollView>
  );
}
