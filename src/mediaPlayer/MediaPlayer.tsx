import React, { forwardRef } from 'react';
import Video from 'react-native-video';
import type { ReactVideoProps, VideoRef } from 'react-native-video';

export type MediaPlayerProps = ReactVideoProps;

/**
 * Thin wrapper around react-native-video with the same props and ref API.
 * Prefer building `source` with {@link buildRemoteVideoSource} for typed streaming/DRM setup.
 */
export const MediaPlayer = forwardRef<VideoRef, MediaPlayerProps>(
  function MediaPlayer(props, ref) {
    return <Video ref={ref} {...props} />;
  },
);
