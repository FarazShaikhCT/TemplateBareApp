import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  deleteMediaFile,
  deleteResumeSidecarsForDestination,
  downloadProgressiveVideoCancellable,
  ensureDirectoryExists,
  mediaFileExists,
} from './download';
import {
  clearDownloadNotification,
  requestDownloadNotificationPermission,
  showDownloadFinishedNotification,
  showDownloadPausedNotification,
  showDownloadProgressNotification,
} from './downloadNotifications';
import type { CatalogItem } from './downloadCatalog';
import { getQueuedVideosDirectory } from './downloadQueuePaths';
import type { DownloadProgress } from './types';

export type QueueItemStatus =
  | 'idle'
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'downloaded'
  | 'error';

export type QueueItemRow = Readonly<{
  id: string;
  title: string;
  url: string;
  fileName: string;
  localPath: string;
  status: QueueItemStatus;
  queuedAt: number | null;
  progress: DownloadProgress | null;
  errorMessage: string | null;
  /** Full size when known (from progress or Content-Range); kept through pause for resume. */
  totalBytesExpected: number | null;
}>;

function pickNextQueued(
  rows: readonly QueueItemRow[],
): QueueItemRow | undefined {
  return rows
    .filter(r => r.status === 'queued')
    .sort((a, b) => (a.queuedAt ?? 0) - (b.queuedAt ?? 0))[0];
}

const NOTIF_THROTTLE_MS = 450;

export function useSequentialDownloadQueue(catalog: readonly CatalogItem[]) {
  const [rowsReady, setRowsReady] = useState(false);
  const [rows, setRows] = useState<QueueItemRow[]>([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const cancelRef = useRef<(() => void) | null>(null);
  const workingRef = useRef(false);
  const userPauseRef = useRef(false);
  const disposedRef = useRef(false);
  const activeDownloadIdRef = useRef<string | null>(null);
  const lastNotifRef = useRef({ t: 0, written: -1 });

  const queueSignature = useMemo(
    () => rows.map(r => `${r.id}:${r.status}`).join('|'),
    [rows],
  );

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      userPauseRef.current = false;
      const activeId = activeDownloadIdRef.current;
      if (activeId) {
        void clearDownloadNotification(activeId);
      }
      cancelRef.current?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dir = getQueuedVideosDirectory();
      await ensureDirectoryExists(dir);
      const nextRows: QueueItemRow[] = await Promise.all(
        catalog.map(async c => {
          const localPath = `${dir}/${c.fileName}`;
          const exists = await mediaFileExists(localPath);
          return {
            id: c.id,
            title: c.title,
            url: c.url,
            fileName: c.fileName,
            localPath,
            status: exists ? ('downloaded' as const) : ('idle' as const),
            queuedAt: null,
            progress: null,
            errorMessage: null,
            totalBytesExpected: null,
          };
        }),
      );
      if (!cancelled) {
        setRows(nextRows);
        setRowsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const pushProgressNotification = useCallback(
    (id: string, title: string, written: number, expected: number) => {
      const now = Date.now();
      if (
        now - lastNotifRef.current.t < NOTIF_THROTTLE_MS &&
        written === lastNotifRef.current.written
      ) {
        return;
      }
      lastNotifRef.current = { t: now, written };
      void showDownloadProgressNotification(id, title, {
        bytesWritten: written,
        bytesExpected: expected,
      });
    },
    [],
  );

  const runWorker = useCallback(async () => {
    if (!rowsReady || workingRef.current || disposedRef.current) {
      return;
    }
    const snap = rowsRef.current;
    if (snap.some(r => r.status === 'downloading')) {
      return;
    }
    const next = pickNextQueued(snap);
    if (!next) {
      return;
    }

    workingRef.current = true;
    const {
      id,
      url,
      fileName,
      localPath,
      title,
      totalBytesExpected: priorTotal,
    } = next;
    const queueDir = getQueuedVideosDirectory();
    activeDownloadIdRef.current = id;
    lastNotifRef.current = { t: 0, written: -1 };

    setRows(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: 'downloading', progress: null, errorMessage: null }
          : r,
      ),
    );

    void requestDownloadNotificationPermission();
    void showDownloadProgressNotification(id, title, {
      bytesWritten: 0,
      bytesExpected: priorTotal ?? 0,
    });

    const { cancel, promise } = downloadProgressiveVideoCancellable({
      url,
      directoryPath: queueDir,
      fileName,
      unlinkDestinationOnCancel: false,
      knownContentLength: priorTotal,
      onProgress: p => {
        if (disposedRef.current) {
          return;
        }
        setRows(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  progress: p,
                  totalBytesExpected:
                    p.bytesExpected > 0
                      ? p.bytesExpected
                      : r.totalBytesExpected,
                }
              : r,
          ),
        );
        pushProgressNotification(id, title, p.bytesWritten, p.bytesExpected);
      },
    });
    cancelRef.current = cancel;

    try {
      await promise;
      if (disposedRef.current) {
        return;
      }
      void showDownloadFinishedNotification(id, title, true);
      setRows(prev =>
        prev.map(r =>
          r.id === id
            ? {
                ...r,
                status: 'downloaded',
                progress: null,
                queuedAt: null,
                errorMessage: null,
                totalBytesExpected: null,
              }
            : r,
        ),
      );
    } catch (e) {
      if (disposedRef.current) {
        return;
      }
      if (userPauseRef.current) {
        userPauseRef.current = false;
        await deleteResumeSidecarsForDestination(localPath).catch(() => {});
        void showDownloadPausedNotification(id, title);
        setRows(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'paused',
                  progress: null,
                  queuedAt: null,
                  errorMessage: null,
                  totalBytesExpected: r.totalBytesExpected,
                }
              : r,
          ),
        );
      } else {
        await deleteMediaFile(localPath).catch(() => {});
        await deleteResumeSidecarsForDestination(localPath).catch(() => {});
        void showDownloadFinishedNotification(id, title, false);
        const msg = e instanceof Error ? e.message : 'Download failed';
        setRows(prev =>
          prev.map(r =>
            r.id === id
              ? {
                  ...r,
                  status: 'error',
                  progress: null,
                  queuedAt: null,
                  errorMessage: msg,
                  totalBytesExpected: null,
                }
              : r,
          ),
        );
      }
    } finally {
      cancelRef.current = null;
      workingRef.current = false;
      activeDownloadIdRef.current = null;
    }
  }, [rowsReady, pushProgressNotification]);

  useEffect(() => {
    void runWorker();
  }, [queueSignature, rowsReady, runWorker]);

  const enqueue = useCallback((id: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) {
          return r;
        }
        if (
          r.status === 'downloaded' ||
          r.status === 'queued' ||
          r.status === 'downloading'
        ) {
          return r;
        }
        return {
          ...r,
          status: 'queued',
          queuedAt: Date.now(),
          errorMessage: null,
        };
      }),
    );
  }, []);

  const pauseCurrentDownload = useCallback(() => {
    userPauseRef.current = true;
    cancelRef.current?.();
  }, []);

  return { rowsReady, rows, enqueue, pauseCurrentDownload };
}
