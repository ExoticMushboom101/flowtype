import { passages, quotes } from "../data/passages";
import type { Quote } from "../data/passages";
import type { TestConfig } from "../types";
export function validateCustomText(text: string): string | null {
  if (!cleanCustomText(text))
    return "Add a few words before starting a custom practice.";
  if (text.length > 10000)
    return "Please keep your passage under 10,000 characters.";
  return null;
}
export function cleanCustomText(text: string) {
  return Array.from(text.replace(/\r\n?/g, "\n").replace(/\t/g, "    "))
    .filter((char) => char === "\n" || char.charCodeAt(0) >= 32)
    .join("")
    .trim();
}
function pool(config: TestConfig) {
  return config.category === "mixed"
    ? Object.values(passages).flat()
    : passages[config.category];
}
const pick = (seed: number, length: number) =>
  Math.min(length - 1, Math.max(0, Math.floor(seed * length)));
/** The quote a quote-mode test will use for this seed. */
export function selectQuote(seed: number): Quote {
  return quotes[pick(seed, quotes.length)];
}
/**
 * The seed for the next passage (or quote) in sequence. Stepping through the pool
 * guarantees the new text differs from the current one whenever the pool has more
 * than one entry, unlike re-rolling a random number.
 */
export function nextSeed(config: TestConfig): number {
  const length =
    config.source === "quote" ? quotes.length : pool(config).length;
  return (((pick(config.seed, length) + 1) % length) + 0.5) / length;
}
/** Deterministic for a given config + seed, so Words previews exactly what Practice loads. */
export function generateText(config: TestConfig, seed = config.seed): string {
  if (config.source === "custom") return cleanCustomText(config.customText);
  if (config.source === "quote") return selectQuote(seed).text;
  const source = pool(config);
  const start = pick(seed, source.length);
  let text = [...source.slice(start), ...source.slice(0, start)].join(" ");
  if (!config.punctuation)
    text = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
  const words = text.split(/\s+/);
  // A timed run extends in the engine if needed; a generous bank avoids frequent work.
  const count = config.mode === "words" ? config.wordCount : 800;
  const selected = Array.from({ length: count }, (_, i) =>
    config.numbers && i % 9 === 7
      ? String(12 + ((i * 37 + start * 101) % 987))
      : words[i % words.length],
  );
  if (config.punctuation && !/[.!?]$/.test(selected[selected.length - 1]))
    selected[selected.length - 1] = selected[selected.length - 1].replace(
      /[,;:]$/,
      "",
    ) + ".";
  return selected.join(" ");
}
