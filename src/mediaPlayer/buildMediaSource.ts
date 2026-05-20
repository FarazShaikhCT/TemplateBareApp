import type { Drm, ReactVideoSource } from 'react-native-video';
import type { MediaPlayerSourceInput, StreamingFormat } from './types';
import { fileUriFromPath } from './fileUri';

const FORMAT_TO_SOURCE_TYPE: Record<StreamingFormat, string> = {
  hls: 'm3u8',
  dash: 'mpd',
  smoothStreaming: 'ism',
};

function assertNonEmptyUri(uri: string): void {
  const t = uri.trim();
  if (t.length === 0) {
    throw new Error('mediaPlayer: uri must be a non-empty string');
  }
}

function validateHttpUrl(uri: string): void {
  assertNonEmptyUri(uri);
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('mediaPlayer: uri must be an absolute URL for this helper');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('mediaPlayer: uri must use http or https');
  }
}

/**
 * Builds a {@link ReactVideoSource} for remote playback. Validates `uri` at the boundary.
 * Use `format` when the URL path does not match the stream type (e.g. `.php` serving MPD).
 */
/** Local file playback (e.g. after a successful `downloadProgressiveVideo` call). */
export function buildLocalVideoSource(absolutePath: string): ReactVideoSource {
  return { uri: fileUriFromPath(absolutePath) };
}

export function buildRemoteVideoSource(
  input: MediaPlayerSourceInput,
): ReactVideoSource {
  validateHttpUrl(input.uri);
  const base: ReactVideoSource = {
    uri: input.uri,
    ...(input.headers && Object.keys(input.headers).length > 0
      ? { headers: { ...input.headers } }
      : {}),
  };
  if (input.format && input.format !== 'progressive') {
    return {
      ...base,
      type: FORMAT_TO_SOURCE_TYPE[input.format],
      ...(input.drm ? { drm: attachDrm(input.drm) } : {}),
    };
  }
  return input.drm ? { ...base, drm: attachDrm(input.drm) } : base;
}

/** Merges DRM config into an existing source (e.g. local file URI after download). */
export function withDrm(source: ReactVideoSource, drm: Drm): ReactVideoSource {
  return { ...source, drm: attachDrm(drm) };
}

function attachDrm(drm: Drm): Drm {
  if (!drm.type) {
    throw new Error('mediaPlayer: drm.type is required when drm is provided');
  }
  return drm;
}
