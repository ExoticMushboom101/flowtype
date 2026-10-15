import { Clock3, Hash, Quote, SlidersHorizontal } from "lucide-react";
import type { TestConfig } from "../../types";
export function TestControls({
  config,
  update,
  openWords,
}: {
  config: TestConfig;
  update: (patch: Partial<TestConfig>) => void;
  openWords: () => void;
}) {
  const finite = config.source !== "passage";
  return (
    <div className="controls-wrap">
      <div className="controls" aria-label="Test configuration">
        <div className="control-group">
          <button
            aria-pressed={config.mode === "time" && !finite}
            className={config.mode === "time" && !finite ? "selected" : ""}
            onClick={() => update({ mode: "time", source: "passage" })}
          >
            <Clock3 size={13} />
            time
          </button>
          <button
            aria-pressed={config.mode === "words" && !finite}
            className={config.mode === "words" && !finite ? "selected" : ""}
            onClick={() => update({ mode: "words", source: "passage" })}
          >
            <Hash size={13} />
            words
          </button>
          <button
            aria-pressed={config.source === "quote"}
            className={config.source === "quote" ? "selected" : ""}
            onClick={() => update({ source: "quote" })}
          >
            <Quote size={13} />
            quote
          </button>
        </div>
        <span className="divider" />
        {!finite && (
          <>
            <div
              className="control-group"
              aria-label={config.mode === "time" ? "Duration" : "Word count"}
            >
              {(config.mode === "time"
                ? [15, 30, 60, 120]
                : [10, 25, 50, 100]
              ).map((value) => (
                <button
                  key={value}
                  className={
                    (config.mode === "time"
                      ? config.duration
                      : config.wordCount) === value
                      ? "selected"
                      : ""
                  }
                  aria-pressed={
                    (config.mode === "time"
                      ? config.duration
                      : config.wordCount) === value
                  }
                  aria-label={
                    config.mode === "time"
                      ? `${value} seconds`
                      : `${value} words`
                  }
                  onClick={() =>
                    update(
                      config.mode === "time"
                        ? { duration: value as TestConfig["duration"] }
                        : { wordCount: value as TestConfig["wordCount"] },
                    )
                  }
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="divider" />
          </>
        )}
        <div className="control-group">
          <button
            className={
              config.punctuation && !finite
                ? "selected symbol-toggle"
                : "symbol-toggle"
            }
            aria-pressed={config.punctuation && !finite}
            aria-label="Toggle punctuation"
            disabled={finite}
            title="Punctuation"
            onClick={() => update({ punctuation: !config.punctuation })}
          >
            @<span className="control-extra">punctuation</span>
          </button>
          <button
            className={
              config.numbers && !finite
                ? "selected symbol-toggle"
                : "symbol-toggle"
            }
            aria-pressed={config.numbers && !finite}
            aria-label="Toggle numbers"
            disabled={finite}
            title="Numbers"
            onClick={() => update({ numbers: !config.numbers })}
          >
            <Hash size={13} />
            <span className="control-extra">numbers</span>
          </button>
          <button
            onClick={openWords}
            aria-label="Custom text and passage options"
            title="Custom text and passage options"
            className={config.source === "custom" ? "selected" : ""}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
