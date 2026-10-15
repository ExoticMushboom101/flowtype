import { THEMES } from "../types";
import type { Settings, TestConfig, TestResult } from "../types";
import { categories } from "../data/passages";
import { cleanCustomText } from "./textGenerator";
export const SETTINGS_KEY = "flowtype.settings.v1";
export const CONFIG_KEY = "flowtype.config.v1";
export const HISTORY_KEY = "flowtype.history.v1";
export const defaultSettings: Settings = {
  theme: "light",
  fontSize: 27,
  font: "jetbrains",
  cursor: "line",
  liveWpm: true,
  showTimer: true,
  sound: false,
  smoothCursor: true,
  landscape: true,
};
export const defaultConfig: TestConfig = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  source: "passage",
  category: "nature",
  punctuation: false,
  numbers: false,
  customText: "",
  seed: 0,
};
export function readStorage(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
export function writeStorage(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
export function validateSettings(value: unknown): Settings {
  const v = object(value);
  const s = { ...defaultSettings };
  if (THEMES.includes(v.theme as Settings["theme"]))
    s.theme = v.theme as Settings["theme"];
  if (typeof v.fontSize === "number" && Number.isFinite(v.fontSize))
    s.fontSize = Math.min(36, Math.max(18, v.fontSize));
  if (["jetbrains", "system", "serif"].includes(v.font as string))
    s.font = v.font as Settings["font"];
  if (["line", "block", "underline"].includes(v.cursor as string))
    s.cursor = v.cursor as Settings["cursor"];
  for (const key of [
    "liveWpm",
    "showTimer",
    "sound",
    "smoothCursor",
    "landscape",
  ] as const)
    if (typeof v[key] === "boolean") s[key] = v[key];
  return s;
}
export function validateConfig(value: unknown): TestConfig {
  const v = object(value),
    c = { ...defaultConfig };
  if (v.mode === "time" || v.mode === "words") c.mode = v.mode;
  if ([15, 30, 60, 120].includes(v.duration as number))
    c.duration = v.duration as TestConfig["duration"];
  if ([10, 25, 50, 100].includes(v.wordCount as number))
    c.wordCount = v.wordCount as TestConfig["wordCount"];
  if (["passage", "quote", "custom"].includes(v.source as string))
    c.source = v.source as TestConfig["source"];
  if (categories.includes(v.category as TestConfig["category"]))
    c.category = v.category as TestConfig["category"];
  if (typeof v.punctuation === "boolean") c.punctuation = v.punctuation;
  if (typeof v.numbers === "boolean") c.numbers = v.numbers;
  if (typeof v.customText === "string")
    c.customText = cleanCustomText(v.customText.slice(0, 10000));
  if (
    typeof v.seed === "number" &&
    Number.isFinite(v.seed) &&
    v.seed >= 0 &&
    v.seed < 1
  )
    c.seed = v.seed;
  if (c.source === "custom" && !c.customText.trim()) c.source = "passage";
  return c;
}
const finite = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
export function loadHistory(): TestResult[] {
  const stored = readStorage(HISTORY_KEY);
  if (!Array.isArray(stored)) return [];
  const seen = new Set<string>();
  return stored
    .filter((value): value is TestResult => {
      const v = object(value);
      if (
        typeof v.id !== "string" ||
        seen.has(v.id) ||
        typeof v.completedAt !== "string" ||
        !Number.isFinite(Date.parse(v.completedAt))
      )
        return false;
      if (
        ![
          "wpm",
          "rawWpm",
          "accuracy",
          "errors",
          "mismatches",
          "correctedErrors",
          "correct",
          "total",
          "elapsed",
        ].every((k) => finite(v[k]))
      )
        return false;
      if (
        (v.accuracy as number) > 100 ||
        (v.consistency !== null &&
          (!finite(v.consistency) || (v.consistency as number) > 100))
      )
        return false;
      if (
        !Array.isArray(v.samples) ||
        v.samples.length > 7200 ||
        !v.samples.every((s) =>
          ["second", "wpm", "raw", "windowWpm"].every((k) =>
            finite(object(s)[k]),
          ),
        )
      )
        return false;
      if (
        !v.config ||
        !["passage", "quote", "custom"].includes(
          object(v.config).source as string,
        )
      )
        return false;
      seen.add(v.id);
      return true;
    })
    .slice(0, 200)
    .map((result) => ({
      ...result,
      config: {
        ...validateConfig(result.config),
        source: result.config.source,
        customText: "",
      },
    }));
}
export function saveResult(
  result: TestResult,
  previous = loadHistory(),
): { history: TestResult[]; saved: boolean } {
  const history = [result, ...previous.filter((r) => r.id !== result.id)].slice(
    0,
    200,
  );
  return { history, saved: writeStorage(HISTORY_KEY, history) };
}
