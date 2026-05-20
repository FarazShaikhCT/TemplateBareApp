import ReactNativeBlobUtil from 'react-native-blob-util';
import type { DownloadProgress } from './types';

export type DownloadStreamOptions = Readonly<{
  url: string;
  /** Directory to write into (no trailing slash required). */
  directoryPath: string;
  /** File name only (e.g. `episode.mp4`). */
  fileName: string;
  headers?: Readonly<Record<string, string>>;
  onProgress?: (p: DownloadProgress) => void;
  /**
   * When false, {@link CancellableProgressiveDownload.cancel} keeps the partial destination file
   * so the same download can be resumed with HTTP Range. Default true (legacy single-shot).
   */
  unlinkDestinationOnCancel?: boolean;
  /**
   * Full object size when already known (e.g. from a prior segment). Improves progress accuracy
   * during resume.
   */
  knownContentLength?: number | null;
}>;

export type DownloadStreamResult = Readonly<{
  path: string;
}>;

export type CancellableProgressiveDownload = Readonly<{
  cancel: () => void;
  promise: Promise<DownloadStreamResult>;
}>;

function validateDownloadUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('mediaPlayer download: url must be absolute');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('mediaPlayer download: url must be http or https');
  }
}

function assertNonEmpty(s: string, label: string): void {
  if (s.trim().length === 0) {
    throw new Error(`mediaPlayer download: ${label} must be non-empty`);
  }
}

/** Sidecar path for a single in-flight resume segment (always removed after use or on cancel). */
export function resumeChunkPathForDestination(destPath: string): string {
  return `${destPath}.rnresume`;
}

function getHeader(
  headers: Record<string, unknown>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) {
      const v = headers[k];
      return v === undefined || v === null ? undefined : String(v);
    }
  }
  return undefined;
}

function parseTotalFromContentRange(
  contentRange: string | undefined,
): number | null {
  if (!contentRange) {
    return null;
  }
  const m = /\/(\d+)\s*$/.exec(contentRange);
  if (!m) {
    return null;
  }
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
}

/** Creates a directory if it does not exist (single path segment or flat nested path). */
export async function ensureDirectoryExists(
  directoryPath: string,
): Promise<void> {
  assertNonEmpty(directoryPath, 'directoryPath');
  const normalized = directoryPath.replace(/\/$/, '');
  if (await ReactNativeBlobUtil.fs.exists(normalized)) {
    return;
  }
  await ReactNativeBlobUtil.fs.mkdir(normalized);
}

export async function mediaFileExists(absolutePath: string): Promise<boolean> {
  assertNonEmpty(absolutePath, 'absolutePath');
  return ReactNativeBlobUtil.fs.exists(absolutePath.trim());
}

export async function deleteMediaFile(absolutePath: string): Promise<void> {
  assertNonEmpty(absolutePath, 'absolutePath');
  const p = absolutePath.trim();
  if (await ReactNativeBlobUtil.fs.exists(p)) {
    await ReactNativeBlobUtil.fs.unlink(p);
  }
}

export async function deleteResumeSidecarsForDestination(
  destPath: string,
): Promise<void> {
  const chunk = resumeChunkPathForDestination(destPath);
  if (await ReactNativeBlobUtil.fs.exists(chunk)) {
    await ReactNativeBlobUtil.fs.unlink(chunk);
  }
}

type BlobFetchTask = {
  progress: (
    interval: { interval: number },
    fn: (received: number, total: number) => void,
  ) => void;
  cancel: (callback?: (reason?: string) => void) => void;
} & Promise<unknown>;

type FetchBlobResponse = {
  info: () => { status: number; headers: Record<string, unknown> };
};

/**
 * Progressive download with optional HTTP Range resume. When the destination already has bytes
 * on disk, uses `Range: bytes=<n>-`, writes the segment to a temp file, then appends to the
 * destination (so the partial file is never truncated by the native writer).
 */
export function downloadProgressiveVideoCancellable(
  options: DownloadStreamOptions,
): CancellableProgressiveDownload {
  validateDownloadUrl(options.url);
  assertNonEmpty(options.directoryPath, 'directoryPath');
  assertNonEmpty(options.fileName, 'fileName');

  const dir = options.directoryPath.replace(/\/$/, '');
  const destPath = `${dir}/${options.fileName}`;
  const chunkPath = resumeChunkPathForDestination(destPath);
  const unlinkDestOnCancel = options.unlinkDestinationOnCancel !== false;

  let fetchTask: BlobFetchTask | null = null;
  let cancelledBeforeStart = false;

  const promise = (async (): Promise<DownloadStreamResult> => {
    await ensureDirectoryExists(dir);
    if (cancelledBeforeStart) {
      throw new Error('mediaPlayer download: cancelled');
    }

    await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});

    let knownTotal: number | null =
      options.knownContentLength === undefined ||
      options.knownContentLength === null
        ? null
        : options.knownContentLength;

    const emitProgress = (bytesWritten: number, bytesExpectedHint: number) => {
      if (!options.onProgress) {
        return;
      }
      const bytesExpected =
        knownTotal !== null && knownTotal > 0
          ? knownTotal
          : bytesExpectedHint > 0
          ? bytesExpectedHint
          : bytesWritten;
      options.onProgress({
        bytesWritten:
          knownTotal !== null
            ? Math.min(bytesWritten, knownTotal)
            : bytesWritten,
        bytesExpected,
      });
    };

    const MAX_RESUME_SEGMENTS = 64;
    for (let segment = 0; segment < MAX_RESUME_SEGMENTS; segment += 1) {
      if (cancelledBeforeStart) {
        throw new Error('mediaPlayer download: cancelled');
      }

      const destExists = await ReactNativeBlobUtil.fs.exists(destPath);
      const offset = destExists
        ? (await ReactNativeBlobUtil.fs.stat(destPath)).size
        : 0;

      if (knownTotal !== null && knownTotal > 0 && offset >= knownTotal) {
        await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
        return { path: destPath };
      }

      const isResume = offset > 0;
      const writePath = isResume ? chunkPath : destPath;

      if (isResume) {
        await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
      }

      const reqHeaders: Record<string, string> = {
        ...(options.headers ? { ...options.headers } : {}),
      };
      if (isResume) {
        reqHeaders.Range = `bytes=${offset}-`;
      }

      const task = ReactNativeBlobUtil.config({ path: writePath }).fetch(
        'GET',
        options.url,
        reqHeaders,
      ) as BlobFetchTask;
      fetchTask = task;

      if (options.onProgress) {
        task.progress({ interval: 200 }, (received: number, total: number) => {
          const written = offset + received;
          let expectedHint = knownTotal ?? 0;
          if (expectedHint <= 0 && total > 0) {
            expectedHint = isResume ? offset + total : total;
          }
          emitProgress(written, expectedHint);
        });
      }

      let resp: FetchBlobResponse;
      try {
        resp = (await task) as FetchBlobResponse;
      } finally {
        fetchTask = null;
      }

      const info = resp.info();
      const status = info.status;
      const contentRange = getHeader(info.headers, 'Content-Range');
      const parsedTotal = parseTotalFromContentRange(contentRange);
      if (parsedTotal !== null) {
        knownTotal = parsedTotal;
      }

      if (!isResume) {
        if (status === 200) {
          const cl = getHeader(info.headers, 'Content-Length');
          if (knownTotal === null && cl) {
            const n = parseInt(cl, 10);
            if (!Number.isNaN(n) && n > 0) {
              knownTotal = n;
            }
          }
          await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
          return { path: destPath };
        }
        await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
        throw new Error(`mediaPlayer download: unexpected HTTP ${status}`);
      }

      if (status === 206) {
        const sizeBefore = (await ReactNativeBlobUtil.fs.stat(destPath)).size;
        await ReactNativeBlobUtil.fs.appendFile(destPath, chunkPath, 'uri');
        await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
        const sizeAfter = (await ReactNativeBlobUtil.fs.stat(destPath)).size;
        if (sizeAfter <= sizeBefore) {
          throw new Error(
            'mediaPlayer download: no bytes appended (range unsupported?)',
          );
        }
        if (knownTotal !== null && knownTotal > 0 && sizeAfter >= knownTotal) {
          return { path: destPath };
        }
        if (
          knownTotal === null &&
          parsedTotal !== null &&
          sizeAfter >= parsedTotal
        ) {
          return { path: destPath };
        }
        if (knownTotal === null) {
          return { path: destPath };
        }
        continue;
      }

      if (status === 200) {
        await ReactNativeBlobUtil.fs.unlink(destPath).catch(() => {});
        await ReactNativeBlobUtil.fs.mv(chunkPath, destPath);
        return { path: destPath };
      }

      if (status === 416) {
        await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
        if (knownTotal !== null && offset >= knownTotal) {
          return { path: destPath };
        }
        throw new Error('mediaPlayer download: range not satisfiable');
      }

      await ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
      throw new Error(`mediaPlayer download: HTTP ${status}`);
    }

    throw new Error('mediaPlayer download: too many resume segments');
  })();

  const cancel = () => {
    cancelledBeforeStart = true;
    fetchTask?.cancel(() => {});
    void ReactNativeBlobUtil.fs.unlink(chunkPath).catch(() => {});
    if (unlinkDestOnCancel) {
      void ReactNativeBlobUtil.fs.unlink(destPath).catch(() => {});
    }
  };

  return { cancel, promise };
}

/**
 * Downloads a single remote resource to disk (progressive MP4, MOV, etc.).
 * Adaptive HLS/DASH offline packaging and DRM offline licenses are not handled here;
 * use your CDN/SDK flow or vendor offline tooling for those cases.
 */
export async function downloadProgressiveVideo(
  options: DownloadStreamOptions,
): Promise<DownloadStreamResult> {
  const { promise } = downloadProgressiveVideoCancellable(options);
  return promise;
}

/** Convenience: app documents directory on the device. */
export function getMediaDownloadsDirectory(): string {
  return ReactNativeBlobUtil.fs.dirs.DocumentDir;
}
