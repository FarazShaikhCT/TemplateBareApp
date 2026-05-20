/**
 * Keys identifying each permission managed by this module.
 * Add new entries here when extending beyond the permissions configured at scaffold time.
 */
export enum PermissionKey {
  Camera = 'camera',
  Microphone = 'microphone',
  LocationWhenInUse = 'locationWhenInUse',
  PhotoLibrary = 'photoLibrary',
  Contacts = 'contacts',
  // Placeholder: remove this and add your own PermissionKey values
  Placeholder = 'placeholder',
}

export type PermissionStatus =
  | 'unavailable'
  | 'blocked'
  | 'denied'
  | 'limited'
  | 'granted';

export interface PermissionResult {
  key: PermissionKey;
  status: PermissionStatus;
}
