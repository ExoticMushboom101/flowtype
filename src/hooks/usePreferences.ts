import { useCallback, useEffect, useState } from "react";
import type { Settings, TestConfig } from "../types";
import {
  CONFIG_KEY,
  readStorage,
  SETTINGS_KEY,
  validateConfig,
  validateSettings,
  writeStorage,
} from "../lib/storage";
export function usePreferences() {
  const [settings, setSettings] = useState(() =>
    validateSettings(readStorage(SETTINGS_KEY)),
  );
  const [config, setConfig] = useState(() =>
    validateConfig(readStorage(CONFIG_KEY)),
  );
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((previous) => {
      const next = validateSettings({ ...previous, ...patch });
      if (!writeStorage(SETTINGS_KEY, next)) setStorageError(true);
      return next;
    });
  }, []);
  const updateConfig = useCallback((patch: Partial<TestConfig>) => {
    setConfig((previous) => {
      const next = validateConfig({ ...previous, ...patch });
      if (!writeStorage(CONFIG_KEY, next)) setStorageError(true);
      return next;
    });
  }, []);
  return {
    settings,
    config,
    updateSettings,
    updateConfig,
    storageError,
    setStorageError,
  };
}
