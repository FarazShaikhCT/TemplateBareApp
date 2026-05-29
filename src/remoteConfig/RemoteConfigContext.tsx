import {
  activate,
  getRemoteConfig,
  onConfigUpdate,
} from "@react-native-firebase/remote-config";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { createRemoteConfigProvider } from "./createRemoteConfigProvider";
import type { IRemoteConfigProvider } from "./providers/IRemoteConfigProvider";
import {
  REMOTE_CONFIG_DEFAULTS,
  REMOTE_CONFIG_KEYS,
} from "./remoteConfigDefaults";

/** Current Remote Config parameter values and SDK read metadata (last fetch). */
export type RemoteConfigKeyValue = {
  showLanguagePicker: boolean;
  showThemeToggle: boolean;
  demoMessage: string;
  demoFeatureEnabled: boolean;
  demoRolloutPercent: number;
  lastFetchStatus: string;
  fetchTimeMillis: number;
};

export type RemoteConfigContextValue = {
  ready: boolean;
  values: RemoteConfigKeyValue;
  refresh: () => Promise<boolean>;
};

const RemoteConfigContext = createContext<RemoteConfigContextValue | null>(
  null,
);

function defaultSnapshot(): RemoteConfigKeyValue {
  return {
    showLanguagePicker: Boolean(
      REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.showLanguagePicker],
    ),
    showThemeToggle: Boolean(
      REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.showThemeToggle],
    ),
    demoMessage: String(REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.demoMessage]),
    demoFeatureEnabled: Boolean(
      REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.demoFeatureEnabled],
    ),
    demoRolloutPercent: Number(
      REMOTE_CONFIG_DEFAULTS[REMOTE_CONFIG_KEYS.demoRolloutPercent],
    ),
    lastFetchStatus: "",
    fetchTimeMillis: -1,
  };
}

function readSnapshot(provider: IRemoteConfigProvider): RemoteConfigKeyValue {
  return {
    showLanguagePicker: provider.getBoolean(
      REMOTE_CONFIG_KEYS.showLanguagePicker,
    ),
    showThemeToggle: provider.getBoolean(REMOTE_CONFIG_KEYS.showThemeToggle),
    demoMessage: provider.getString(REMOTE_CONFIG_KEYS.demoMessage),
    demoFeatureEnabled: provider.getBoolean(
      REMOTE_CONFIG_KEYS.demoFeatureEnabled,
    ),
    demoRolloutPercent: provider.getNumber(
      REMOTE_CONFIG_KEYS.demoRolloutPercent,
    ),
    lastFetchStatus: provider.getLastFetchStatus(),
    fetchTimeMillis: provider.getFetchTimeMillis(),
  };
}

export function RemoteConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const provider = useMemo(() => createRemoteConfigProvider(), []);
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<RemoteConfigKeyValue>(() =>
    defaultSnapshot(),
  );

  const syncFromProvider = useCallback(() => {
    setSnapshot(readSnapshot(provider));
  }, [provider]);

  const refresh = useCallback(async () => {
    try {
      const ok = await provider.fetchAndActivate();
      syncFromProvider();
      return ok;
    } catch {
      syncFromProvider();
      return false;
    }
  }, [provider, syncFromProvider]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeRealtime: (() => void) | undefined;

    (async () => {
      try {
        await provider.setDefaults(REMOTE_CONFIG_DEFAULTS);
        await provider.fetchAndActivate();
      } catch {
        /* keep defaults from REMOTE_CONFIG_DEFAULTS via getters */
      }
      if (!cancelled) {
        syncFromProvider();
        setReady(true);
      }

      try {
        // Requires Real-time Remote Config enabled in the Firebase project for push-style updates.
        const rc = getRemoteConfig();
        unsubscribeRealtime = onConfigUpdate(rc, {
          next: async () => {
            try {
              await activate(rc);
              syncFromProvider();
            } catch {
              syncFromProvider();
            }
          },
          error: () => {
            /* ignore listener errors; same as prior onConfigUpdated error branch */
          },
          complete: () => {
            /* stream is never-ending per SDK; unused */
          },
        });
      } catch {
        /* SDK or project may not support real-time listener */
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeRealtime?.();
    };
  }, [provider, syncFromProvider]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== "active") {
        return;
      }
      void provider.fetchAndActivate().then(() => {
        syncFromProvider();
      });
    };

    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [provider, syncFromProvider]);

  const value = useMemo<RemoteConfigContextValue>(
    () => ({
      ready,
      values: snapshot,
      refresh,
    }),
    [ready, snapshot, refresh],
  );

  return (
    <RemoteConfigContext.Provider value={value}>
      {children}
    </RemoteConfigContext.Provider>
  );
}

export function useRemoteConfig(): RemoteConfigContextValue {
  const ctx = useContext(RemoteConfigContext);
  if (ctx === null) {
    throw new Error("useRemoteConfig must be used within RemoteConfigProvider");
  }
  return ctx;
}
