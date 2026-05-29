import { Platform } from 'react-native';
import type { ReactVideoSource } from 'react-native-video';

import { buildRemoteVideoSource } from './buildMediaSource';
import { DRMType } from './types';

/** Public clear HLS sample (no DRM). */
export const DEMO_CLEAR_HLS_URI =
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8';

/**
 * Google Widevine test vector (DASH + CBCS). Android only.
 * @see https://docs.thewidlarzgroup.com/react-native-video/docs/v6/component/drm
 */
const WIDEVINE_TEST_MPD =
  'https://storage.googleapis.com/wvmedia/cbcs/h264/tears/tears_aes_cbcs.mpd';
const WIDEVINE_TEST_LICENSE =
  'https://proxy.uat.widevine.com/proxy?provider=widevine_test';

/**
 * EZDRM public FairPlay demo (HLS + certificate + license server).
 * @see https://www.ezdrm.com/docs/EZDRM-Shaka-Player.pdf
 * @see https://github.com/video-dev/hls.js/issues/7156
 *
 * FairPlay requires a physical iOS device, not the Simulator.
 *
 * The previous drm.cloud + AWS MediaPackage URLs are no longer valid (manifest host
 * NXDOMAIN; bundled drm.cloud JWT expired). Replace these constants with your own
 * endpoints from your DRM vendor console when integrating production content.
 */
const FAIRPLAY_DEMO_MANIFEST = 'https://na-fps.ezdrm.com/demo/ezdrm/master.m3u8';

const FAIRPLAY_DEMO_CERTIFICATE = 'https://fps.ezdrm.com/demo/video/eleisure.cer';

const FAIRPLAY_DEMO_LICENSE =
  'https://fps.ezdrm.com/api/licenses/b99ed9e5-c641-49d1-bfa8-43692b686ddb';

/** Matches the asset id in the EZDRM `skd://` URI and license path. */
const FAIRPLAY_DEMO_CONTENT_ID = 'b99ed9e5-c641-49d1-bfa8-43692b686ddb';

export function buildDemoClearHlsSource(): ReactVideoSource {
  return buildRemoteVideoSource({
    uri: DEMO_CLEAR_HLS_URI,
    format: 'hls',
  });
}

/** Widevine (Android) or FairPlay (iOS) using public demo assets. */
export function buildDemoDrmSource(): ReactVideoSource {
  if (Platform.OS === 'android') {
    return buildRemoteVideoSource({
      uri: WIDEVINE_TEST_MPD,
      format: 'dash',
      drm: {
        type: DRMType.WIDEVINE,
        licenseServer: WIDEVINE_TEST_LICENSE,
      },
    });
  }

  return buildRemoteVideoSource({
    uri: FAIRPLAY_DEMO_MANIFEST,
    format: 'hls',
    drm: {
      type: DRMType.FAIRPLAY,
      certificateUrl: FAIRPLAY_DEMO_CERTIFICATE,
      licenseServer: FAIRPLAY_DEMO_LICENSE,
      contentId: FAIRPLAY_DEMO_CONTENT_ID,
    },
  });
}
