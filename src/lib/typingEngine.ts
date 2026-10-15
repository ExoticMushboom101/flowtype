import type { TestConfig, TestResult, TestState } from "../types";
import { calculateConsistency, calculateMetrics } from "./typingMetrics";

// Independent of React, clocks, DOM and storage: all transitions accept an injected
// monotonic timestamp. Wrong characters may be traversed. Finite (word/quote/custom)
// tests end at a word boundary: typing the final character correctly finishes at once;
// if the final character is wrong the run waits, so the user can backspace and fix it
// or press space/enter to submit with the error. Deleting a mismatch records a
// corrected error.
const round = (n: number) => Math.round(n * 100) / 100;
export class TypingEngine {
  state: TestState;
  private lastSampleSecond = 0;
  private lastSampleCorrect = 0;
  constructor(
    public config: TestConfig,
    text: string,
  ) {
    if (!text.trim())
      throw new Error("A typing test needs a non-empty passage.");
    this.state = this.ready(text);
  }
  get timed() {
    return this.config.mode === "time" && this.config.source === "passage";
  }
  /** The finite test is at its end but the final character is wrong. */
  get awaitingSubmit() {
    if (this.timed || this.state.status !== "running") return false;
    const target = Array.from(this.state.text),
      entered = Array.from(this.state.input);
    return (
      entered.length === target.length && entered.at(-1) !== target.at(-1)
    );
  }
  private ready(text: string): TestState {
    return {
      ...calculateMetrics(text, "", 0),
      status: "ready",
      text,
      input: "",
      elapsed: 0,
      remaining: this.timed ? this.config.duration * 1000 : 0,
      startedAt: null,
      samples: [],
    };
  }
  restart() {
    this.lastSampleSecond = 0;
    this.lastSampleCorrect = 0;
    this.state = this.ready(this.state.text);
    return this.state;
  }
  update(input: string, now: number) {
    if (this.state.status === "completed") return this.state;
    const advanced = this.tick(now);
    if (advanced.status === "completed") return advanced;
    const previous = Array.from(this.state.input);
    let entered = Array.from(input.replace(/\r\n?/g, "\n"));
    if (this.timed && entered.length >= Array.from(this.state.text).length) {
      this.state = {
        ...this.state,
        text: this.state.text + " " + this.state.text,
      };
    }
    const target = Array.from(this.state.text);
    if (
      !this.timed &&
      this.state.status === "running" &&
      entered.length > target.length &&
      previous.length === target.length &&
      /\s/u.test(entered[target.length])
    ) {
      // Whitespace after a fully traversed passage is the word-boundary submit.
      this.finish(now);
      return this.state;
    }
    entered = entered.slice(0, target.length);
    if (entered.join("") === this.state.input) return this.state;
    if (!entered.length && this.state.status === "ready") return this.state;
    let common = 0;
    while (
      common < previous.length &&
      common < entered.length &&
      previous[common] === entered[common]
    )
      common++;
    let errors = this.state.errors;
    let correctedErrors = this.state.correctedErrors;
    for (let i = common; i < previous.length; i++)
      if (previous[i] !== target[i]) correctedErrors++;
    for (let i = common; i < entered.length; i++)
      if (entered[i] !== target[i]) errors++;
    const startedAt = this.state.startedAt ?? now;
    const elapsed = this.state.startedAt === null ? 0 : this.state.elapsed;
    const value = entered.join("");
    this.state = {
      ...this.state,
      ...calculateMetrics(
        this.state.text,
        value,
        elapsed,
        errors,
        correctedErrors,
        this.state.samples,
      ),
      status: "running",
      input: value,
      startedAt,
    };
    if (
      !this.timed &&
      entered.length === target.length &&
      entered.at(-1) === target.at(-1)
    )
      this.finish(now);
    return this.state;
  }
  tick(now: number) {
    if (this.state.status !== "running" || this.state.startedAt === null)
      return this.state;
    const limit = this.timed ? this.config.duration * 1000 : Infinity;
    const elapsed = Math.min(
      limit,
      Math.max(this.state.elapsed, now - this.state.startedAt),
    );
    let samples = this.state.samples;
    const metrics = calculateMetrics(
      this.state.text,
      this.state.input,
      elapsed,
      this.state.errors,
      this.state.correctedErrors,
      samples,
    );
    const second = Math.floor(elapsed / 1000);
    if (second > this.lastSampleSecond) {
      // A throttled tab contributes one elapsed window, never invented intermediate samples.
      const windowWpm =
        Math.max(0, metrics.correct - this.lastSampleCorrect) /
        5 /
        ((second - this.lastSampleSecond) / 60);
      samples = [
        ...samples,
        {
          second,
          wpm: metrics.wpm,
          raw: metrics.rawWpm,
          windowWpm,
          windowSeconds: second - this.lastSampleSecond,
        },
      ];
      this.lastSampleSecond = second;
      this.lastSampleCorrect = metrics.correct;
    }
    this.state = {
      ...this.state,
      ...metrics,
      consistency: calculateConsistency(samples),
      samples,
      elapsed,
      remaining: this.timed ? Math.max(0, limit - elapsed) : 0,
    };
    if (elapsed >= limit) this.finish(now);
    return this.state;
  }
  private finish(now: number) {
    if (this.state.status === "completed") return;
    const elapsed = this.timed
      ? this.config.duration * 1000
      : Math.max(1, this.state.elapsed, now - (this.state.startedAt ?? now));
    const metrics = calculateMetrics(
      this.state.text,
      this.state.input,
      elapsed,
      this.state.errors,
      this.state.correctedErrors,
      this.state.samples,
    );
    const samples = [...this.state.samples];
    if (
      !samples.length ||
      elapsed / 1000 > samples[samples.length - 1].second
    ) {
      samples.push({
        second: elapsed / 1000,
        wpm: metrics.wpm,
        raw: metrics.rawWpm,
        windowWpm: 0,
        windowSeconds: 0,
      });
    } else {
      const last = samples[samples.length - 1];
      samples[samples.length - 1] = {
        ...last,
        wpm: metrics.wpm,
        raw: metrics.rawWpm,
        windowWpm:
          last.windowWpm +
          (Math.max(0, metrics.correct - this.lastSampleCorrect) * 12) /
            (last.windowSeconds || 1),
      };
    }
    this.state = {
      ...this.state,
      ...metrics,
      consistency: calculateConsistency(samples),
      status: "completed",
      elapsed,
      remaining: 0,
      samples,
    };
  }
  result(id: string, completedAt: string): TestResult {
    if (this.state.status !== "completed")
      throw new Error("Cannot record an unfinished test.");
    const {
      wpm,
      rawWpm,
      accuracy,
      errors,
      mismatches,
      correctedErrors,
      correct,
      total,
      consistency,
      elapsed,
      samples,
    } = this.state;
    // Never retain a user's custom passage in history; only its mode and metrics.
    // Samples are rounded to two decimals so 200 stored tests stay compact.
    return {
      id,
      completedAt,
      wpm,
      rawWpm,
      accuracy,
      errors,
      mismatches,
      correctedErrors,
      correct,
      total,
      consistency,
      elapsed,
      config: { ...this.config, customText: "" },
      samples: samples.map((s) => ({
        second: round(s.second),
        wpm: round(s.wpm),
        raw: round(s.raw),
        windowWpm: round(s.windowWpm),
        windowSeconds: s.windowSeconds,
      })),
    };
  }
}
