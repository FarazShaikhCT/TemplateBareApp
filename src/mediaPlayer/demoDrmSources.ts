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
 * FairPlay sample from drm.cloud documentation (CBCS HLS + FPS cert + license URL).
 * The bundled `usertoken` can expire; copy a fresh `acquire-license` URL from:
 * https://developers.drm.cloud/licence-acquisition/examples/fairplay-example
 *
 * FairPlay typically requires a physical iOS device, not the Simulator.
 */
const FAIRPLAY_DEMO_MANIFEST =
  'https://e09f957480c8b1e479a1edb0fabc72d8.egress.mediapackage-vod.eu-west-1.amazonaws.com/out/v1/6f12444e793e4206ad363f810cb2aead/9ea4e8148b794c8ba2c6295b824e5ad5/46a61bf2c081464bb9476f2a55a06f48/index.m3u8';

const FAIRPLAY_DEMO_CERTIFICATE =
  'https://customer-tests.la.drm.cloud/certificate/fairplay?BrandGuid=5a96a0d0-d13f-42b0-ab2b-ba8cfc4aa0a0';

const FAIRPLAY_DEMO_LICENSE =
  'https://customer-tests.la.drm.cloud/acquire-license/fairplay?KID=4376a4b3-d8ef-4f21-9a6b-faa81a2e59e3&brandguid=5a96a0d0-d13f-42b0-ab2b-ba8cfc4aa0a0&usertoken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MzU2ODk2MDAsImRybVRva2VuSW5mbyI6eyJleHAiOiIyMDI1LTEyLTA3VDE1OjMwOjA5LjU5MDgxMjUrMDE6MDAiLCJraWQiOlsiKiJdLCJwIjp7InBlcnMiOnRydWUsImVkIjoiMjAyNS0xMi0wN1QxNTozMDowOS41OTExMzA1KzAxOjAwIn19fQ.xEToUttAk9AVFgP3bHyDlcvm6BR-8_hsl8V3n-jrDwM';

const FAIRPLAY_DEMO_CONTENT_ID = '4376a4b3-d8ef-4f21-9a6b-faa81a2e59e3';

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
