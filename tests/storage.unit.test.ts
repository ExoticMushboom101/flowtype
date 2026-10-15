import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONFIG_KEY,
  defaultConfig,
  defaultSettings,
  HISTORY_KEY,
  loadHistory,
  readStorage,
  saveResult,
  SETTINGS_KEY,
  validateConfig,
  validateSettings,
  writeStorage,
} from "../src/lib/storage";
import { TypingEngine } from "../src/lib/typingEngine";
const data = new Map<string, string>();
beforeEach(() => {
  data.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  });
});
describe("Resilient local persistence", () => {
  it("round-trips valid settings and all five themes", () => {
    for (const theme of [
      "light",
      "dark",
      "pastel",
      "sunset",
      "ocean",
    ] as const) {
      const s = { ...defaultSettings, theme, fontSize: 32, sound: true };
      expect(writeStorage(SETTINGS_KEY, s)).toBe(true);
      expect(validateSettings(readStorage(SETTINGS_KEY))).toEqual(s);
    }
  });
  it("validates corrupted and unknown settings", () => {
    data.set(SETTINGS_KEY, "{bad");
    expect(validateSettings(readStorage(SETTINGS_KEY))).toEqual(
      defaultSettings,
    );
    expect(
      validateSettings({ theme: "neon", fontSize: Infinity, sound: "yes" }),
    ).toEqual(defaultSettings);
    expect(validateSettings({ fontSize: 500 }).fontSize).toBe(36);
  });
  it("validates config and empty custom text", () => {
    expect(validateConfig({ source: "custom", customText: " " }).source).toBe(
      "passage",
    );
    expect(validateConfig({ duration: -5 }).duration).toBe(30);
    const c = { ...defaultConfig, wordCount: 100 };
    writeStorage(CONFIG_KEY, c);
    expect(validateConfig(readStorage(CONFIG_KEY)).wordCount).toBe(100);
  });
  it("saves completed results, deduplicates, and reloads history", () => {
    const e = new TypingEngine({ ...defaultConfig, source: "quote" }, "hi");
    e.update("h", 0);
    e.update("hi", 1000);
    const result = e.result("first", new Date().toISOString());
    expect(saveResult(result).saved).toBe(true);
    saveResult(result);
    expect(loadHistory()).toEqual([result]);
  });
  it("discards malformed history and caps storage to 200 records", () => {
    writeStorage(HISTORY_KEY, [{ id: "bad", wpm: "fast" }, null]);
    expect(loadHistory()).toEqual([]);
    const e = new TypingEngine({ ...defaultConfig, source: "quote" }, "hi");
    e.update("h", 0);
    e.update("hi", 1000);
    const records = Array.from({ length: 205 }, (_, i) =>
      e.result(String(i), new Date().toISOString()),
    );
    writeStorage(HISTORY_KEY, records);
    expect(loadHistory()).toHaveLength(200);
  });
  it("handles blocked storage without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    });
    expect(readStorage(SETTINGS_KEY)).toBeNull();
    expect(writeStorage(SETTINGS_KEY, defaultSettings)).toBe(false);
    expect(loadHistory()).toEqual([]);
  });
});
