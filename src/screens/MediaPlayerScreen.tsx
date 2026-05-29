import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DOWNLOAD_CATALOG, useSequentialDownloadQueue } from "../mediaPlayer";

import { MediaPlayerDownloadsSection } from "./mediaPlayerScreen/MediaPlayerDownloadsSection";
import { MediaPlayerPlayerTab } from "./mediaPlayerScreen/MediaPlayerPlayerTab";
import { MediaPlayerTabBar } from "./mediaPlayerScreen/MediaPlayerTabBar";
import type {
  MainTab,
  PlaybackMode,
} from "./mediaPlayerScreen/mediaPlayerScreen.types";
import { useMediaPlayerScreenRootStyles } from "./mediaPlayerScreen/useMediaPlayerScreenRootStyles";

export function MediaPlayerScreen() {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { rowsReady, rows, enqueue, pauseCurrentDownload } =
    useSequentialDownloadQueue(DOWNLOAD_CATALOG);

  const [mainTab, setMainTab] = useState<MainTab>("player");
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("clear-hls");
  const [buffering, setBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localOfflinePath, setLocalOfflinePath] = useState<string | null>(null);

  const layoutStyles = useMediaPlayerScreenRootStyles(insets.top);

  const offlinePlayable = useMemo(() => {
    if (playbackMode !== "offline" || localOfflinePath === null) {
      return false;
    }
    return rows.some(
      r => r.localPath === localOfflinePath && r.status === "downloaded",
    );
  }, [localOfflinePath, playbackMode, rows]);

  const sourceKey =
    playbackMode === "drm-demo"
      ? `drm-${Platform.OS}`
      : playbackMode === "offline"
      ? `offline-${localOfflinePath ?? "none"}`
      : "clear";

  const showVideo = playbackMode !== "offline" || offlinePlayable;

  const onPlayDownloaded = useCallback((localPath: string) => {
    setLocalOfflinePath(localPath);
    setMainTab("player");
    setPlaybackMode("offline");
    setError(null);
    setBuffering(true);
  }, []);

  return (
    <View style={layoutStyles.root}>
      <MediaPlayerTabBar
        mainTab={mainTab}
        onSelect={setMainTab}
        styles={layoutStyles}
      />

      {mainTab === "downloads" ? (
        <MediaPlayerDownloadsSection
          rowsReady={rowsReady}
          rows={rows}
          onEnqueue={enqueue}
          onPauseActive={pauseCurrentDownload}
          onPlayDownloaded={onPlayDownloaded}
        />
      ) : (
        <MediaPlayerPlayerTab
          isFocused={isFocused}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          showVideo={showVideo}
          sourceKey={sourceKey}
          localOfflinePath={localOfflinePath}
          buffering={buffering}
          onBufferingChange={setBuffering}
          error={error}
          onErrorMessage={setError}
        />
      )}
    </View>
  );
}
