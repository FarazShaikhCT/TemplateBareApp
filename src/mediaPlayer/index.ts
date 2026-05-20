export type {
  Drm,
  ReactVideoSource,
  StreamingFormat,
  MediaPlayerSourceInput,
  DownloadProgress,
} from './types';

export { DRMType } from './types';

export {
  buildLocalVideoSource,
  buildRemoteVideoSource,
  withDrm,
} from './buildMediaSource';
export {
  DEMO_OFFLINE_PROGRESSIVE_MP4_URI,
  OFFLINE_DEMO_FILE_NAME,
  getOfflineDemoDirectoryPath,
  getOfflineDemoFilePath,
} from './demoOfflineSources';
export { DOWNLOAD_CATALOG, type CatalogItem } from './downloadCatalog';
export {
  clearDownloadNotification,
  requestDownloadNotificationPermission,
  showDownloadFinishedNotification,
  showDownloadPausedNotification,
  showDownloadProgressNotification,
} from './downloadNotifications';
export { getQueuedVideosDirectory } from './downloadQueuePaths';
export {
  useSequentialDownloadQueue,
  type QueueItemRow,
  type QueueItemStatus,
} from './useSequentialDownloadQueue';
export {
  buildDemoClearHlsSource,
  buildDemoDrmSource,
  DEMO_CLEAR_HLS_URI,
} from './demoDrmSources';
export { fileUriFromPath } from './fileUri';
export {
  deleteMediaFile,
  deleteResumeSidecarsForDestination,
  downloadProgressiveVideo,
  downloadProgressiveVideoCancellable,
  ensureDirectoryExists,
  getMediaDownloadsDirectory,
  mediaFileExists,
  resumeChunkPathForDestination,
  type CancellableProgressiveDownload,
  type DownloadStreamOptions,
  type DownloadStreamResult,
} from './download';

export { MediaPlayer, type MediaPlayerProps } from './MediaPlayer';

export type { VideoRef } from 'react-native-video';
