import { recordError } from "./crashLogger";

/**
 * Registers global JS error handlers so unhandled exceptions and promise
 * rejections are forwarded to the crash logger automatically.
 *
 * Call this once from the app entry point (index.js / index.ts) before
 * registering the root component — it must run before React initialises.
 */

const previousHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  recordError(error, { fatal: isFatal ?? false });
  previousHandler(error, isFatal);
});
