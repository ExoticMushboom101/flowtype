import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Feather,
  FlaskConical,
  GraduationCap,
  Leaf,
  Map,
  Shuffle,
  Sun,
} from "lucide-react";
import { categories } from "../data/passages";
import type { TestConfig } from "../types";
import { Button, PageHeading, Toggle } from "../components/common";
import {
  cleanCustomText,
  generateText,
  validateCustomText,
} from "../lib/textGenerator";
import { readStorage, writeStorage } from "../lib/storage";
const icons = {
  nature: Leaf,
  travel: Map,
  science: FlaskConical,
  creativity: Feather,
  learning: GraduationCap,
  everyday: Sun,
  mixed: Shuffle,
};
export function WordsPage({
  config,
  update,
  practice,
  onStorageError,
}: {
  config: TestConfig;
  update: (patch: Partial<TestConfig>) => void;
  practice: () => void;
  onStorageError: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    const saved = readStorage("flowtype.custom-draft.v1");
    return typeof saved === "string"
      ? saved.slice(0, 10000)
      : config.customText;
  });
  const [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false);
  const preview = useMemo(() => generateText(config, 0), [config]);
  const applyCustom = () => {
    const message = validateCustomText(draft);
    setError(message);
    if (!message) {
      update({ source: "custom", customText: cleanCustomText(draft) });
      setSaved(true);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="LET CURIOSITY LEAD"
        title="Words worth your time"
        description="Choose a world to wander through, or bring a few words of your own."
      />
      <div className="words-layout">
        <div>
          <section className="panel">
            <div className="section-title">
              <BookOpen size={18} />
              <div>
                <h2>Choose your inspiration</h2>
                <p>Original passages, a little different every time.</p>
              </div>
            </div>
            <div className="category-grid">
              {categories.map((category) => {
                const Icon = icons[category];
                return (
                  <button
                    className={`category-option ${config.category === category && config.source === "passage" ? "chosen" : ""}`}
                    aria-pressed={
                      config.category === category &&
                      config.source === "passage"
                    }
                    key={category}
                    onClick={() => update({ category, source: "passage" })}
                  >
                    <Icon size={17} />
                    <span>
                      {category === "everyday"
                        ? "Everyday life"
                        : category[0].toUpperCase() + category.slice(1)}
                    </span>
                    {config.category === category &&
                      config.source === "passage" && <Check size={13} />}
                  </button>
                );
              })}
            </div>
            <div className="source-tabs" aria-label="Passage source">
              <button
                className={config.source === "passage" ? "selected" : ""}
                aria-pressed={config.source === "passage"}
                onClick={() => update({ source: "passage" })}
              >
                Standard passages
              </button>
              <button
                className={config.source === "quote" ? "selected" : ""}
                aria-pressed={config.source === "quote"}
                onClick={() => update({ source: "quote" })}
              >
                Quote practice
              </button>
            </div>
            <label className="field-label">
              Word count <small>for word mode</small>
            </label>
            <div className="word-options">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  aria-pressed={
                    config.wordCount === n && config.mode === "words"
                  }
                  className={
                    config.wordCount === n && config.mode === "words"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    update({
                      mode: "words",
                      wordCount: n as TestConfig["wordCount"],
                    })
                  }
                >
                  {n} words
                </button>
              ))}
            </div>
            <Toggle
              label="Punctuation"
              description="Include the small pauses and full stops."
              checked={config.punctuation}
              onChange={(punctuation) =>
                update({ punctuation, source: "passage" })
              }
            />
            <Toggle
              label="Numbers"
              description="A little extra variety for your fingers."
              checked={config.numbers}
              onChange={(numbers) => update({ numbers, source: "passage" })}
            />
          </section>
          <section className="panel custom-panel">
            <div className="section-title">
              <Feather size={18} />
              <div>
                <h2>A passage of your own</h2>
                <p>A favorite paragraph, a new language, anything you like.</p>
              </div>
            </div>
            <label className="sr-only" htmlFor="custom-text">
              Custom practice text
            </label>
            <textarea
              id="custom-text"
              placeholder="Your next practice starts with a few words…"
              value={draft}
              maxLength={10000}
              aria-invalid={!!error}
              aria-describedby={error ? "custom-error" : "draft-help"}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
                setSaved(false);
                if (!writeStorage("flowtype.custom-draft.v1", e.target.value))
                  onStorageError();
              }}
            />
            <div className="custom-bottom">
              <span id="draft-help">
                Draft saved on this device · {draft.length.toLocaleString()} /
                10,000
              </span>
              <Button variant="secondary" onClick={applyCustom}>
                {saved ? (
                  <>
                    <Check size={14} /> Text selected
                  </>
                ) : (
                  "Use custom text"
                )}
              </Button>
            </div>
            {error && (
              <p className="field-error" id="custom-error" role="alert">
                {error}
              </p>
            )}
            <p className="small-note">
              Line breaks and repeated spaces are preserved. Quotes and custom
              text end at the last character; number and punctuation toggles
              apply to standard passages.
            </p>
          </section>
        </div>
        <aside className="preview-panel panel">
          <div className="preview-label">
            <span className="status-dot" /> A LITTLE PREVIEW
          </div>
          <div className="passage-preview">
            {preview.slice(0, 420)}
            {preview.length > 420 ? "…" : ""}
          </div>
          <div className="preview-config">
            <span>
              {config.source === "passage"
                ? config.category
                : config.source === "quote"
                  ? "Original quote"
                  : "Your custom text"}
            </span>
            <span>
              {config.source !== "passage"
                ? `${preview.trim().split(/\s+/).length} words`
                : config.mode === "time"
                  ? `${config.duration} seconds`
                  : `${config.wordCount} words`}
            </span>
          </div>
          <Button onClick={practice}>
            Settle in & practice <ArrowRight size={15} />
          </Button>
          <p>Take your time. The first word will be there.</p>
        </aside>
      </div>
    </>
  );
}
