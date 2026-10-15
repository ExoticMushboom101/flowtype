export const THEMES = ["light", "dark", "pastel", "sunset", "ocean"] as const;
export type Theme = (typeof THEMES)[number];
export type Page = "practice" | "stats" | "words" | "settings";
export type Category =
  | "nature"
  | "travel"
  | "science"
  | "creativity"
  | "learning"
  | "everyday"
  | "mixed";
export interface TestConfig {
  mode: "time" | "words";
  duration: 15 | 30 | 60 | 120;
  wordCount: 10 | 25 | 50 | 100;
  source: "passage" | "quote" | "custom";
  category: Category;
  punctuation: boolean;
  numbers: boolean;
  customText: string;
}
export interface Settings {
  theme: Theme;
  fontSize: number;
  font: "jetbrains" | "system" | "serif";
  cursor: "line" | "block" | "underline";
  liveWpm: boolean;
  showTimer: boolean;
  sound: boolean;
  smoothCursor: boolean;
  landscape: boolean;
}
export interface Sample {
  second: number;
  wpm: number;
  raw: number;
  windowWpm: number;
  windowSeconds?: number;
}
export interface Metrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  mismatches: number;
  correctedErrors: number;
  correct: number;
  total: number;
  consistency: number | null;
}
export interface TestState extends Metrics {
  status: "ready" | "running" | "completed";
  text: string;
  input: string;
  elapsed: number;
  remaining: number;
  startedAt: number | null;
  samples: Sample[];
}
export interface TestResult extends Metrics {
  id: string;
  completedAt: string;
  elapsed: number;
  config: TestConfig;
  samples: Sample[];
}
