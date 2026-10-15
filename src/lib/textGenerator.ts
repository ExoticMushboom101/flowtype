import { passages, quotes } from "../data/passages";
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
export function generateText(config: TestConfig, seed = Math.random()): string {
  if (config.source === "custom") return cleanCustomText(config.customText);
  if (config.source === "quote")
    return quotes[Math.floor(seed * quotes.length) % quotes.length].text;
  const pool =
    config.category === "mixed"
      ? Object.values(passages).flat()
      : passages[config.category];
  const start = Math.floor(seed * pool.length) % pool.length;
  let text = [...pool.slice(start), ...pool.slice(0, start)].join(" ");
  if (!config.punctuation)
    text = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
  const words = text.split(/\s+/);
  // A timed run extends in the engine if needed; a generous bank avoids frequent work.
  const count = config.mode === "words" ? config.wordCount : 800;
  const selected = Array.from({ length: count }, (_, i) =>
    config.numbers && i % 9 === 7
      ? String(12 + ((i * 37) % 987))
      : words[i % words.length],
  );
  if (config.punctuation && !/[.!?]$/.test(selected[selected.length - 1]))
    selected[selected.length - 1] += ".";
  return selected.join(" ");
}
