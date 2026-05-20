/**
 * THIS FILE IS GENERATED AT SCAFFOLD TIME.
 * It contains only the permissions configured for this app.
 *
 * To add or remove a permission:
 *   1. Update CONFIGURED_PERMISSIONS below
 *   2. Add/remove the corresponding entry in PermissionKey (src/permissions/types.ts)
 *   3. Add/remove the platform mapping in PermissionsManager.ts (resolvePermission)
 *   4. Update ios/Podfile setup_permissions([...]) and ios/<AppName>/Info.plist
 *   5. Update android/app/src/main/AndroidManifest.xml
 */
import { PermissionKey } from './types';

export interface ConfiguredPermission {
  label: string;
  key: PermissionKey;
}

export const CONFIGURED_PERMISSIONS: ConfiguredPermission[] = [
  { label: 'Camera', key: PermissionKey.Camera },
  { label: 'Microphone', key: PermissionKey.Microphone },
  { label: 'Location (When In Use)', key: PermissionKey.LocationWhenInUse },
  { label: 'Photo Library', key: PermissionKey.PhotoLibrary },
  { label: 'Contacts', key: PermissionKey.Contacts },
];
