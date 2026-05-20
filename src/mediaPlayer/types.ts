import type { Drm, ReactVideoSource } from 'react-native-video';
import { DRMType } from 'react-native-video';

export type { Drm, ReactVideoSource };
export { DRMType };

/** Adaptive / packaged streaming kinds mapped to react-native-video `source.type`. */
export type StreamingFormat = 'hls' | 'dash' | 'smoothStreaming';

export type MediaPlayerSourceInput = Readonly<{
  uri: string;
  format?: StreamingFormat | 'progressive';
  headers?: Readonly<Record<string, string>>;
  drm?: Drm;
}>;

export type DownloadProgress = Readonly<{
  bytesWritten: number;
  bytesExpected: number;
}>;
