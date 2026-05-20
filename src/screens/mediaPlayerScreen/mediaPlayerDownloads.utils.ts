import type { QueueItemRow } from '../../mediaPlayer';

export function progressPercent(row: QueueItemRow): number {
  if (!row.progress || row.progress.bytesExpected <= 0) {
    return 0;
  }
  return Math.min(
    100,
    Math.round((100 * row.progress.bytesWritten) / row.progress.bytesExpected),
  );
}

export function statusLabel(row: QueueItemRow): string {
  switch (row.status) {
    case 'idle':
      return 'Not downloaded';
    case 'queued':
      return 'In queue';
    case 'downloading':
      return `Downloading${row.progress ? ` · ${progressPercent(row)}%` : ''}`;
    case 'paused':
      return 'Paused — tap download to queue again';
    case 'downloaded':
      return 'On device — tap row to play';
    case 'error':
      return row.errorMessage ?? 'Download failed';
    default:
      return '';
  }
}
