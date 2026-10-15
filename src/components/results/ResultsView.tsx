import { ArrowRight, Check, Copy, RotateCcw, Sprout } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TestResult } from "../../types";
import { motivations } from "../../data/passages";
import { Button, PageHeading } from "../common";
import { WpmChart } from "./WpmChart";
/** Stable per result (derived from its id), so a re-render never swaps the line. */
function motivationFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return motivations[Math.abs(hash) % motivations.length];
}
export function modeLabel(result: TestResult) {
  return result.config.source === "custom"
    ? "Custom text"
    : result.config.source === "quote"
      ? "Quote"
      : result.config.mode === "time"
        ? `${result.config.duration} seconds`
        : `${result.config.wordCount} words`;
}
export function ResultsView({
  result,
  retry,
  back,
  stats,
  historical = false,
}: {
  result: TestResult;
  retry: () => void;
  back: () => void;
  stats: () => void;
  historical?: boolean;
}) {
  const [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `FlowType · ${Math.round(result.wpm)} WPM · ${result.accuracy.toFixed(1)}% accuracy · ${modeLabel(result)} · ${result.errors} errors`,
      );
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <section
      className="results-view"
      ref={heading}
      tabIndex={-1}
      aria-label="Test results"
    >
      <PageHeading
        eyebrow={
          historical ? "FROM YOUR PRACTICE JOURNAL" : "ONE SMALL STEP FORWARD"
        }
        title="A moment of progress"
        description={
          historical
            ? new Date(result.completedAt).toLocaleString()
            : "Every word is a little more practice. Here’s how you flowed."
        }
      />
      <div className="results-main">
        <div className="score-circle">
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="4"
            />
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              pathLength="100"
              strokeDasharray={`${result.accuracy} 100`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div>
            <span className="score-value">{Math.round(result.wpm)}</span>
            <span>words per minute</span>
          </div>
        </div>
        <div className="result-metrics">
          {[
            ["Accuracy", `${result.accuracy.toFixed(1)}%`],
            ["Raw speed", `${Math.round(result.rawWpm)} wpm`],
            [
              "Consistency",
              result.consistency === null
                ? "—"
                : `${Math.round(result.consistency)}%`,
            ],
            ["Incorrect keystrokes", result.errors],
            [
              "Uncorrected / corrected",
              `${result.mismatches} / ${result.correctedErrors}`,
            ],
            [
              "Test",
              `${modeLabel(result)} · ${(result.elapsed / 1000).toFixed(1)}s`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <WpmChart samples={result.samples} />
      <div className="result-actions">
        <Button onClick={retry}>
          <RotateCcw size={15} />
          {historical ? "Practice again" : "Try again"}
        </Button>
        <Button variant="secondary" onClick={back}>
          Back to practice
        </Button>
        <Button variant="ghost" onClick={stats}>
          View stats <ArrowRight size={14} />
        </Button>
        <button
          className="icon-button"
          aria-label="Copy results"
          onClick={() => void copy()}
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      {(copied || copyError) && (
        <p role="status" className="inline-notice">
          {copied
            ? "Results copied to your clipboard."
            : "Clipboard unavailable. You can select and copy your scores directly."}
        </p>
      )}
      <p className="motivation">
        <Sprout size={16} /> {motivationFor(result.id)}
      </p>
      <details className="metric-definitions">
        <summary>How your scores are calculated</summary>
        <p>
          Net WPM = correct characters ÷ 5 ÷ elapsed minutes. Raw WPM includes
          current mismatches, but not deleted characters. Accuracy uses your
          final input after corrections. Each wrong character entered counts as
          one incorrect keystroke; deleting it counts as a corrected error.
          Errors can remain when a finite passage ends. Consistency is 100 minus
          the coefficient of variation of complete one-second speed windows,
          clamped to 0–100; it needs at least three windows. The timer continues
          in background tabs and while commands are open. Word, quote and custom
          tests finish when the last character is typed correctly; if it is
          wrong, press space to finish with the error or backspace to fix it.
        </p>
      </details>
    </section>
  );
}
