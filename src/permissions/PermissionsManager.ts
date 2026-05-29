import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
  Permission,
} from "react-native-permissions";
import { Platform } from "react-native";
import type {
  PermissionKey,
  PermissionResult,
  PermissionStatus,
} from "./types";

/**
 * Maps a PermissionKey to the platform-specific react-native-permissions constant.
 * Extend this map when new PermissionKey values are added to types.ts.
 */
function resolvePermission(key: PermissionKey): Permission | null {
  if (Platform.OS === "ios") {
    const iosMap: Partial<Record<PermissionKey, Permission>> = {
      camera: PERMISSIONS.IOS.CAMERA,
      microphone: PERMISSIONS.IOS.MICROPHONE,
      locationWhenInUse: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      photoLibrary: PERMISSIONS.IOS.PHOTO_LIBRARY,
      contacts: PERMISSIONS.IOS.CONTACTS,
    };
    return iosMap[key] ?? null;
  }

  if (Platform.OS === "android") {
    const androidMap: Partial<Record<PermissionKey, Permission>> = {
      camera: PERMISSIONS.ANDROID.CAMERA,
      microphone: PERMISSIONS.ANDROID.RECORD_AUDIO,
      locationWhenInUse: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      photoLibrary: PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      contacts: PERMISSIONS.ANDROID.READ_CONTACTS,
    };
    return androidMap[key] ?? null;
  }

  return null;
}

function normalizeStatus(raw: string): PermissionStatus {
  switch (raw) {
    case RESULTS.UNAVAILABLE:
      return "unavailable";
    case RESULTS.BLOCKED:
      return "blocked";
    case RESULTS.DENIED:
      return "denied";
    case RESULTS.LIMITED:
      return "limited";
    case RESULTS.GRANTED:
      return "granted";
    default:
      return "denied";
  }
}

export const PermissionsManager = {
  /**
   * Returns the current status for a permission without triggering a system prompt.
   */
  async checkPermission(key: PermissionKey): Promise<PermissionResult> {
    const permission = resolvePermission(key);
    if (!permission) return { key, status: "unavailable" };
    const raw = await check(permission);
    return { key, status: normalizeStatus(raw) };
  },

  /**
   * Requests a permission, showing the system prompt if the status is 'denied'.
   * Returns the resulting status after the request.
   */
  async requestPermission(key: PermissionKey): Promise<PermissionResult> {
    const permission = resolvePermission(key);
    if (!permission) return { key, status: "unavailable" };
    const raw = await request(permission);
    return { key, status: normalizeStatus(raw) };
  },

  /**
   * Opens the app's native settings page so the user can manually grant a blocked permission.
   */
  openAppSettings(): Promise<void> {
    return openSettings();
  },
};
