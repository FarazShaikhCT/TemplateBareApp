import { getMediaDownloadsDirectory } from "./download";

/**
 * Progressive MP4 suitable for `downloadProgressiveVideo` (single file).
 * HLS/DASH manifests are not supported by the simple downloader.
 *
 * Uses a small CC0 sample on Mozilla's CDN. The former GCS gtv-videos-bucket
 * Big Buck Bunny URL now returns 403 for anonymous clients, so downloads failed on every platform.
 */
export const DEMO_OFFLINE_PROGRESSIVE_MP4_URI =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const OFFLINE_DEMO_DIR = "media-player-offline";

/** File name written under the app documents offline demo folder. */
export const OFFLINE_DEMO_FILE_NAME = "sample-offline-demo.mp4";

export function getOfflineDemoDirectoryPath(): string {
  return `${getMediaDownloadsDirectory()}/${OFFLINE_DEMO_DIR}`;
}

export function getOfflineDemoFilePath(): string {
  return `${getOfflineDemoDirectoryPath()}/${OFFLINE_DEMO_FILE_NAME}`;
}
