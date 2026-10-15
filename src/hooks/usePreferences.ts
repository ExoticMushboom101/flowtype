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
import { nextSeed } from "../lib/textGenerator";
// The single owner of persisted preferences and test configuration. Components
// receive values and patch callbacks; nothing else reads or writes these keys.
export function usePreferences() {
  const [settings, setSettings] = useState(() =>
    validateSettings(readStorage(SETTINGS_KEY)),
  );
  // A fresh passage seed per visit: reloads feel new, but the Words preview and
  // Practice always agree because both read the same config.seed.
  const [config, setConfig] = useState(() => ({
    ...validateConfig(readStorage(CONFIG_KEY)),
    seed: Math.random(),
  }));
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    // Keep the mobile browser chrome in the same atmosphere as the page.
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", bg || "#f7f7f0");
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
  /** Same configuration, the next passage or quote in the library. */
  const newPassage = useCallback(() => {
    setConfig((previous) => {
      const next = { ...previous, seed: nextSeed(previous) };
      if (!writeStorage(CONFIG_KEY, next)) setStorageError(true);
      return next;
    });
  }, []);
  return {
    settings,
    config,
    updateSettings,
    updateConfig,
    newPassage,
    storageError,
    setStorageError,
  };
}
