import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import type {
  OnBufferData,
  OnPictureInPictureStatusChangedData,
  OnVideoErrorData,
} from 'react-native-video';
import type { VideoRef } from 'react-native-video';

import {
  MediaPlayer,
  buildDemoClearHlsSource,
  buildDemoDrmSource,
  buildLocalVideoSource,
} from '../../mediaPlayer';

import type { PlaybackMode } from './mediaPlayerScreen.types';
import { useMediaPlayerPlayerTabStyles } from './useMediaPlayerPlayerTabStyles';

type MediaPlayerPlayerTabProps = Readonly<{
  isFocused: boolean;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  showVideo: boolean;
  sourceKey: string;
  localOfflinePath: string | null;
  buffering: boolean;
  onBufferingChange: (next: boolean) => void;
  error: string | null;
  onErrorMessage: (message: string | null) => void;
}>;

export function MediaPlayerPlayerTab({
  isFocused,
  playbackMode,
  onPlaybackModeChange,
  showVideo,
  sourceKey,
  localOfflinePath,
  buffering,
  onBufferingChange,
  error,
  onErrorMessage,
}: MediaPlayerPlayerTabProps) {
  const styles = useMediaPlayerPlayerTabStyles();
  const videoRef = useRef<VideoRef>(null);

  const [pipActive, setPipActive] = useState(false);

  const source = useMemo(() => {
    if (playbackMode === 'offline' && localOfflinePath) {
      return buildLocalVideoSource(localOfflinePath);
    }
    if (playbackMode === 'drm-demo') {
      return buildDemoDrmSource();
    }
    return buildDemoClearHlsSource();
  }, [localOfflinePath, playbackMode]);

  useEffect(() => {
    setPipActive(false);
  }, [sourceKey]);

  const paused = !isFocused && !pipActive;

  const onPictureInPictureStatusChanged = useCallback(
    (e: OnPictureInPictureStatusChangedData) => {
      setPipActive(Boolean(e.isActive));
    },
    [],
  );

  const requestPictureInPicture = useCallback(() => {
    void videoRef.current?.enterPictureInPicture();
  }, []);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Media player</Text>
      <Text style={styles.caption}>
        Clear HLS streams over the network. DRM demo uses Widevine (Android) or
        FairPlay (iOS). For offline progressive MP4s, use the Downloads tab:
        queue downloads (one at a time), then open a finished file here under
        Offline file. Picture-in-picture: use the button below or leave the app
        while playing. After adding the module, run Expo prebuild (or a dev
        client build) so native PiP changes apply.
      </Text>

      <View style={styles.modeRow}>
        <Pressable
          style={[
            styles.modeBtn,
            playbackMode === 'clear-hls' && styles.modeBtnActive,
          ]}
          onPress={() => {
            onPlaybackModeChange('clear-hls');
            onErrorMessage(null);
            onBufferingChange(true);
          }}
        >
          <Text
            style={[
              styles.modeBtnText,
              playbackMode === 'clear-hls' && styles.modeBtnTextActive,
            ]}
          >
            Clear HLS
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeBtn,
            playbackMode === 'drm-demo' && styles.modeBtnActive,
          ]}
          onPress={() => {
            onPlaybackModeChange('drm-demo');
            onErrorMessage(null);
            onBufferingChange(true);
          }}
        >
          <Text
            style={[
              styles.modeBtnText,
              playbackMode === 'drm-demo' && styles.modeBtnTextActive,
            ]}
          >
            DRM demo
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeBtn,
            playbackMode === 'offline' && styles.modeBtnActive,
          ]}
          onPress={() => {
            onPlaybackModeChange('offline');
            onErrorMessage(null);
            onBufferingChange(true);
          }}
        >
          <Text
            style={[
              styles.modeBtnText,
              playbackMode === 'offline' && styles.modeBtnTextActive,
            ]}
          >
            Offline file
          </Text>
        </Pressable>
      </View>

      {showVideo ? (
        <View style={styles.playerWrap}>
          <MediaPlayer
            ref={videoRef}
            key={sourceKey}
            source={source}
            style={styles.video}
            controls
            paused={paused}
            resizeMode="contain"
            enterPictureInPictureOnLeave
            playInBackground
            hideShutterView={Platform.OS === 'android'}
            shutterColor={Platform.OS === 'android' ? '#00000000' : undefined}
            onPictureInPictureStatusChanged={onPictureInPictureStatusChanged}
            onLoadStart={() => {
              onBufferingChange(true);
              onErrorMessage(null);
            }}
            onReadyForDisplay={() => onBufferingChange(false)}
            onBuffer={({ isBuffering }: OnBufferData) =>
              onBufferingChange(isBuffering)
            }
            onError={(e: OnVideoErrorData) => {
              onBufferingChange(false);
              const err = e.error;
              const msg =
                err && typeof err.errorString === 'string'
                  ? err.errorString
                  : typeof err?.localizedDescription === 'string'
                  ? err.localizedDescription
                  : 'Playback error';
              onErrorMessage(msg);
            }}
          />
          {buffering ? (
            <View style={styles.spinnerWrap} pointerEvents="none">
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.playerWrap, styles.offlinePlaceholder]}>
          <Text style={styles.offlinePlaceholderText}>
            Go to the Downloads tab, queue at least one video, then tap a
            finished row to play it here — or choose Offline file after a file
            is on device.
          </Text>
        </View>
      )}

      {showVideo ? (
        <View style={styles.pipRow}>
          <Pressable
            style={styles.pipBtn}
            onPress={requestPictureInPicture}
            accessibilityRole="button"
            accessibilityLabel="Enter picture in picture"
          >
            <Text style={styles.pipBtnText}>Picture in picture</Text>
          </Pressable>
          <Text style={styles.pipHint}>
            Leaving the app while video plays can auto-enter PiP when the OS
            supports it.
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === 'android' && playbackMode === 'drm-demo' ? (
        <Text style={styles.hint}>
          Android: <Text style={styles.mono}>DRMType.WIDEVINE</Text> + DASH (
          <Text style={styles.mono}>format: &apos;dash&apos;</Text>).
        </Text>
      ) : null}
      {Platform.OS === 'ios' && playbackMode === 'drm-demo' ? (
        <Text style={styles.hint}>
          iOS: <Text style={styles.mono}>DRMType.FAIRPLAY</Text>,{' '}
          <Text style={styles.mono}>certificateUrl</Text>,{' '}
          <Text style={styles.mono}>licenseServer</Text>, optional{' '}
          <Text style={styles.mono}>contentId</Text>.
        </Text>
      ) : null}
    </ScrollView>
  );
}
