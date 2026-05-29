/**
 * Normalizes a native absolute path to a `file://` URI for `react-native-video` sources.
 */
export function fileUriFromPath(absolutePath: string): string {
  assertNonEmptyPath(absolutePath);
  const trimmed = absolutePath.trim();
  if (trimmed.startsWith("file://")) {
    return trimmed;
  }
  return `file://${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function assertNonEmptyPath(path: string): void {
  if (path.trim().length === 0) {
    throw new Error("mediaPlayer: path must be non-empty");
  }
}
