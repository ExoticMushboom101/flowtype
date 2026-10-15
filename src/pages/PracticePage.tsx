import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronDown, RotateCcw, Sparkles } from "lucide-react";
import type { Settings, TestConfig, TestResult } from "../types";
import { useTypingTest } from "../hooks/useTypingTest";
import { TestControls } from "../components/typing/TestControls";
import { TypingArea } from "../components/typing/TypingArea";
import { LiveStats } from "../components/typing/LiveStats";
import { ResultsView } from "../components/results/ResultsView";
import { playErrorSound } from "../lib/sound";
export interface PracticeHandle {
  restart: () => void;
}
export const PracticePage = forwardRef<
  PracticeHandle,
  {
    config: TestConfig;
    settings: Settings;
    updateConfig: (patch: Partial<TestConfig>) => void;
    onComplete: (result: TestResult) => void;
    setRunning: (running: boolean) => void;
    openWords: () => void;
    openStats: () => void;
    openCommands: () => void;
  }
>(function PracticePage(
  {
    config,
    settings,
    updateConfig,
    onComplete,
    setRunning,
    openWords,
    openStats,
    openCommands,
  },
  ref,
) {
  const [result, setResult] = useState<TestResult | null>(null),
    [focusRequest, setFocusRequest] = useState(0),
    [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const complete = useCallback(
    (record: TestResult) => {
      setResult(record);
      onComplete(record);
    },
    [onComplete],
  );
  const { state, input, restart, timed } = useTypingTest(config, complete);
  const soundEnabled = useRef(settings.sound);
  soundEnabled.current = settings.sound;
  const type = useCallback(
    (value: string) => {
      if (input(value) && soundEnabled.current) playErrorSound();
    },
    [input],
  );
  const reset = useCallback(() => {
    setResult(null);
    restart();
    setFocusRequest((n) => n + 1);
  }, [restart]);
  useImperativeHandle(ref, () => ({ restart: reset }), [reset]);
  useEffect(() => {
    setRunning(state.status === "running");
    return () => setRunning(false);
  }, [state.status, setRunning]);
  if (result && state.status === "completed")
    return (
      <ResultsView
        result={result}
        retry={reset}
        back={reset}
        stats={openStats}
      />
    );
  const finiteWordCount = state.text.trim().split(/\s+/).length;
  return (
    <>
      <div className="hero">
        <p className="eyebrow">
          <span /> SLOW DOWN. FIND YOUR FLOW.
        </p>
        <h1>
          Find your rhythm<span>.</span>
        </h1>
        <p>A clear mind. A steady pace. One word at a time.</p>
      </div>
      <section className="workspace" aria-label="Typing test">
        <TestControls
          config={config}
          update={updateConfig}
          openWords={openWords}
        />
        <div className="passage-meta">
          <button className="language-control" onClick={openWords}>
            <span className="status-dot" /> English{" "}
            <span className="meta-dot">/</span>{" "}
            {config.source === "passage"
              ? config.category
              : config.source === "quote"
                ? "quote practice"
                : "your words"}
            <ChevronDown size={11} />
          </button>
          <span
            className={`test-status ${state.status === "running" ? "status-running" : ""}`}
            aria-live="polite"
          >
            {state.status === "ready" ? (
              <>
                <Sparkles size={11} /> Begin typing to start
              </>
            ) : timed ? (
              "In your flow · changing mode resets this attempt"
            ) : (
              `${state.input.trim().split(/\s+/).filter(Boolean).length} / ${finiteWordCount} words`
            )}
          </span>
        </div>
        <TypingArea
          text={state.text}
          input={state.input}
          settings={settings}
          onInput={type}
          inputRef={inputRef}
          onFocusChange={setFocused}
          focusRequest={focusRequest}
        />
        <LiveStats
          state={state}
          timed={timed}
          settings={settings}
          duration={config.duration}
        />
        <div className="restart-row">
          <button
            className="restart-button"
            onClick={reset}
            aria-label="Restart test"
            title="Restart test (Tab, then Enter)"
          >
            <RotateCcw size={17} />
          </button>
          <span className="sr-only" role="status">
            {state.status === "running" && !focused
              ? "Test is running. The timer continues while unfocused."
              : ""}
          </span>
        </div>
        <div className="keyboard-hints">
          <span>
            <kbd>tab</kbd> + <kbd>enter</kbd> restart test
          </span>
          <span className="hint-divider" />
          <button onClick={openCommands}>
            <kbd>esc</kbd> command menu
          </button>
        </div>
        <p className="practice-footnote">Progress, not perfection.</p>
      </section>
    </>
  );
});
