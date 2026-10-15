import { describe, expect, it } from "vitest";
import { TypingEngine } from "../src/lib/typingEngine";
import {
  calculateConsistency,
  calculateMetrics,
} from "../src/lib/typingMetrics";
import {
  cleanCustomText,
  generateText,
  validateCustomText,
} from "../src/lib/textGenerator";
import { defaultConfig } from "../src/lib/storage";
const words = {
  ...defaultConfig,
  mode: "words" as const,
  wordCount: 10 as const,
};

describe("Typing state machine", () => {
  it("starts ready without an automatic timer", () => {
    const e = new TypingEngine(defaultConfig, "hello world");
    expect(e.state.status).toBe("ready");
    expect(e.tick(50000).remaining).toBe(30000);
    expect(e.state.wpm).toBe(0);
    expect(e.state.accuracy).toBe(100);
  });
  it("ignores empty input and begins with the first character", () => {
    const e = new TypingEngine(words, "hello");
    e.update("", 100);
    expect(e.state.status).toBe("ready");
    e.update("h", 200);
    expect(e.state.status).toBe("running");
    expect(e.state.startedAt).toBe(200);
    expect(e.state.correct).toBe(1);
  });
  it("tracks each incorrect keystroke without counting untyped characters", () => {
    const e = new TypingEngine(words, "hello");
    e.update("x", 0);
    e.update("xy", 500);
    e.tick(1000);
    expect(e.state.errors).toBe(2);
    expect(e.state.mismatches).toBe(2);
    expect(e.state.correct).toBe(0);
    e.tick(2000);
    expect(e.state.errors).toBe(2);
  });
  it("backspace clears a mismatch but preserves incorrect-attempt count", () => {
    const e = new TypingEngine(words, "hello");
    e.update("hx", 100);
    e.update("h", 500);
    e.update("he", 1000);
    expect(e.state.correctedErrors).toBe(1);
    expect(e.state.errors).toBe(1);
    expect(e.state.accuracy).toBe(100);
    expect(e.state.mismatches).toBe(0);
  });
  it("completes finite tests exactly at the last character, without a trailing space", () => {
    const e = new TypingEngine(words, "hello world");
    e.update("h", 0);
    e.update("hello worl", 1000);
    expect(e.state.status).toBe("running");
    e.update("hello world", 2000);
    expect(e.state.status).toBe("completed");
    expect(e.state.input).toBe("hello world");
    expect(e.state.elapsed).toBe(2000);
  });
  it("allows traversal with errors and freezes completed scores", () => {
    const e = new TypingEngine(words, "hi");
    e.update("h", 0);
    e.update("hx", 1000);
    expect(e.state.status).toBe("completed");
    expect(e.state.accuracy).toBe(50);
    const completed = e.state;
    e.update("hi", 2000);
    e.tick(50000);
    expect(e.state).toBe(completed);
  });
  it("uses the deadline and rejects input exactly as a timed test expires", () => {
    const e = new TypingEngine(
      { ...defaultConfig, duration: 15 },
      "hello world",
    );
    e.update("h", 100);
    e.update("he", 15100);
    expect(e.state.status).toBe("completed");
    expect(e.state.input).toBe("h");
    expect(e.state.elapsed).toBe(15000);
    expect(e.state.remaining).toBe(0);
  });
  it("catches up after a throttled background tab without fabricated points", () => {
    const e = new TypingEngine(defaultConfig, "hello world");
    e.update("hello", 100);
    e.tick(50000);
    expect(e.state.elapsed).toBe(30000);
    expect(e.state.samples).toHaveLength(1);
    expect(e.state.samples[0].second).toBe(30);
  });
  it("resets every attempt field but preserves configuration", () => {
    const e = new TypingEngine(defaultConfig, "hello world");
    e.update("xx", 0);
    e.tick(2000);
    e.restart();
    expect(e.state.status).toBe("ready");
    expect(e.state.input).toBe("");
    expect(e.state.errors).toBe(0);
    expect(e.state.samples).toEqual([]);
    expect(e.state.startedAt).toBeNull();
    expect(e.state.remaining).toBe(30000);
    e.restart();
    expect(e.state.status).toBe("ready");
  });
  it("makes quotes and custom text finite even in time mode", () => {
    const e = new TypingEngine({ ...defaultConfig, source: "quote" }, "hello");
    e.update("h", 0);
    e.update("hello", 3000);
    expect(e.state.status).toBe("completed");
    expect(e.state.elapsed).toBe(3000);
  });
  it("handles Unicode, newlines and repeated spaces", () => {
    const e = new TypingEngine(words, "🌿  café\nfin");
    e.update("🌿", 0);
    e.update("🌿  café\nfin", 10000);
    expect(e.state.status).toBe("completed");
    expect(e.state.accuracy).toBe(100);
    expect(e.state.total).toBe(Array.from("🌿  café\nfin").length);
  });
  it("extends timed passages rather than ending early", () => {
    const e = new TypingEngine(defaultConfig, "hi");
    e.update("h", 0);
    e.update("hi", 1000);
    expect(e.state.status).toBe("running");
    expect(e.state.text).toBe("hi hi");
  });
  it("will not record unfinished attempts or retain custom text in history", () => {
    const e = new TypingEngine(
      { ...words, source: "custom", customText: "hi" },
      "hi",
    );
    expect(() => e.result("id", "date")).toThrow();
    e.update("h", 0);
    e.update("hi", 1000);
    expect(e.result("id", "date").config.customText).toBe("");
  });
});
describe("Metrics and passages", () => {
  it("uses five-character words for correct and raw WPM", () => {
    const m = calculateMetrics("abcdeabcde", "abcdXabcde", 60000);
    expect(m.wpm).toBe(1.8);
    expect(m.rawWpm).toBe(2);
    expect(m.accuracy).toBe(90);
    expect(m.mismatches).toBe(1);
  });
  it("never divides by zero", () => {
    const m = calculateMetrics("abc", "", 0);
    expect(m.wpm).toBe(0);
    expect(m.rawWpm).toBe(0);
    expect(m.accuracy).toBe(100);
    expect(m.consistency).toBeNull();
  });
  it("derives consistency from observed windows only", () => {
    const sample = (v: number, i: number) => ({
      second: i + 1,
      wpm: v,
      raw: v,
      windowWpm: v,
    });
    expect(calculateConsistency([60, 60].map(sample))).toBeNull();
    expect(calculateConsistency([60, 60, 60].map(sample))).toBe(100);
    expect(calculateConsistency([20, 60, 100].map(sample))).toBeLessThan(50);
  });
  it("generates the exact selected word count and applies toggles", () => {
    const text = generateText({ ...words, numbers: true }, 0);
    expect(text.split(" ")).toHaveLength(10);
    expect(text).toMatch(/\d+/);
    expect(text).not.toMatch(/[.,!?]/);
    expect(generateText({ ...words, punctuation: true }, 0)).toContain(".");
  });
  it("validates custom passages and preserves intentional whitespace", () => {
    expect(validateCustomText(" \n ")).not.toBeNull();
    expect(validateCustomText("hello")).toBeNull();
    expect(validateCustomText("a".repeat(10001))).not.toBeNull();
    expect(cleanCustomText("  hi  there\r\nworld  ")).toBe("hi  there\nworld");
  });
});
