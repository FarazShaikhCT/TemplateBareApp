/**
 * Firebase Remote Config parameter keys and in-app defaults.
 * Defaults apply when remote values are unavailable or before first fetch.
 */
export const REMOTE_CONFIG_KEYS = {
  demoMessage: "demo_message",
  demoFeatureEnabled: "demo_feature_enabled",
  demoRolloutPercent: "demo_rollout_percent",
  showLanguagePicker: "show_language_picker",
  showThemeToggle: "show_theme_toggle",
} as const;

export const REMOTE_CONFIG_DEFAULTS: Record<string, string | number | boolean> =
  {
    [REMOTE_CONFIG_KEYS.demoMessage]:
      "Hello from defaults (fetch to load remote)",
    [REMOTE_CONFIG_KEYS.demoFeatureEnabled]: false,
    [REMOTE_CONFIG_KEYS.demoRolloutPercent]: 0,
    [REMOTE_CONFIG_KEYS.showLanguagePicker]: true,
    [REMOTE_CONFIG_KEYS.showThemeToggle]: true,
  };
