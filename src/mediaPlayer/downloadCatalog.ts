/**
 * Curated progressive MP4s for the download-queue demo (single-file GET only).
 * Replace with your own CDN URLs in production apps.
 */
export type CatalogItem = Readonly<{
  id: string;
  title: string;
  url: string;
  /** File name under the app documents `media-player-queue` folder (unique per id). */
  fileName: string;
}>;

export const DOWNLOAD_CATALOG: readonly CatalogItem[] = [
  {
    id: "cc0-flower",
    title: "MDN sample — Flower (CC0)",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    fileName: "queue-flower.mp4",
  },
  {
    id: "w3s-bbb",
    title: "W3Schools sample — Big Buck Bunny clip",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    fileName: "queue-w3s-bbb.mp4",
  },
  {
    id: "webrtc-chrome",
    title: "WebRTC samples — Chrome clip",
    url: "https://webrtc.github.io/samples/src/video/chrome.mp4",
    fileName: "queue-webrtc-chrome.mp4",
  },
];
