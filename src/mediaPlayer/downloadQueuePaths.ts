import { getMediaDownloadsDirectory } from "./download";

const QUEUE_DIR = "media-player-queue";

export function getQueuedVideosDirectory(): string {
  return `${getMediaDownloadsDirectory()}/${QUEUE_DIR}`;
}
