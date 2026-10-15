import type { Metrics, Sample } from "../types";
export function calculateConsistency(samples: Sample[]): number | null {
  // Coefficient of variation of complete, one-second correct-character speed windows.
  const windows = samples
    .filter(
      (s) => (s.windowSeconds ?? (Number.isInteger(s.second) ? 1 : 0)) === 1,
    )
    .map((s) => s.windowWpm);
  if (windows.length < 3) return null;
  const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
  if (!mean) return 0;
  const variance =
    windows.reduce((sum, v) => sum + (v - mean) ** 2, 0) / windows.length;
  return Math.max(0, Math.min(100, 100 * (1 - Math.sqrt(variance) / mean)));
}
export function calculateMetrics(
  text: string,
  input: string,
  elapsedMs: number,
  errors = 0,
  correctedErrors = 0,
  samples: Sample[] = [],
): Metrics {
  const target = Array.from(text);
  const entered = Array.from(input);
  const correct = entered.reduce(
    (count, char, i) => count + Number(char === target[i]),
    0,
  );
  const total = entered.length;
  const minutes = Math.max(0, elapsedMs) / 60000;
  // Speeds and accuracy use the current (final, after corrections) input. Raw includes
  // its mismatches, not deleted characters. Lifetime incorrect attempts are separate.
  return {
    correct,
    total,
    mismatches: total - correct,
    errors,
    correctedErrors,
    wpm: minutes > 0 ? correct / 5 / minutes : 0,
    rawWpm: minutes > 0 ? total / 5 / minutes : 0,
    accuracy: total ? (correct / total) * 100 : 100,
    consistency: calculateConsistency(samples),
  };
}
