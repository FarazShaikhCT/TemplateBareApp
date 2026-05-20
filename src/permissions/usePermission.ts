import { useState, useEffect, useCallback } from 'react';
import { PermissionsManager } from './PermissionsManager';
import type { PermissionKey, PermissionResult, PermissionStatus } from './types';

interface UsePermissionResult {
  status: PermissionStatus | null;
  isLoading: boolean;
  request: () => Promise<PermissionResult>;
  openSettings: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook that tracks the runtime status of a single permission and exposes helpers
 * to request it or open the system settings when it is blocked.
 */
export function usePermission(key: PermissionKey): UsePermissionResult {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await PermissionsManager.checkPermission(key);
    setStatus(result.status);
    setIsLoading(false);
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPermission = useCallback(async (): Promise<PermissionResult> => {
    const result = await PermissionsManager.requestPermission(key);
    setStatus(result.status);
    return result;
  }, [key]);

  return {
    status,
    isLoading,
    request: requestPermission,
    openSettings: PermissionsManager.openAppSettings,
    refresh,
  };
}
