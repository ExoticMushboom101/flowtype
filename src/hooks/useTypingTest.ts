import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestConfig, TestResult } from "../types";
import { TypingEngine } from "../lib/typingEngine";
import { generateText } from "../lib/textGenerator";
import { createId } from "../lib/id";
export function useTypingTest(
  config: TestConfig,
  onComplete: (result: TestResult) => void,
) {
  // Every configuration object (including a new passage seed) is a deliberate
  // change, so it creates a fresh ready engine. Appearance settings never do.
  const engine = useMemo(
    () => new TypingEngine(config, generateText(config)),
    [config],
  );
  const [snapshot, setSnapshot] = useState(engine.state);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const recorded = useRef<TypingEngine | null>(null);
  const state = snapshot === engine.state ? snapshot : engine.state;
  const publish = useCallback(() => {
    setSnapshot(engine.state);
    if (engine.state.status === "completed" && recorded.current !== engine) {
      recorded.current = engine;
      callback.current(engine.result(createId(), new Date().toISOString()));
    }
  }, [engine]);
  useEffect(() => {
    if (state.status !== "running") return;
    // One interval per running engine. Elapsed time is derived from timestamps,
    // so a throttled or late tick can never drift the deadline.
    const timer = window.setInterval(() => {
      engine.tick(performance.now());
      publish();
    }, 100);
    const catchUp = () => {
      engine.tick(performance.now());
      publish();
    };
    document.addEventListener("visibilitychange", catchUp);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", catchUp);
    };
  }, [engine, state.status, publish]);
  const input = useCallback(
    (value: string) => {
      const previousErrors = engine.state.errors;
      engine.update(value, performance.now());
      publish();
      return engine.state.errors > previousErrors;
    },
    [engine, publish],
  );
  const restart = useCallback(() => {
    recorded.current = null;
    engine.restart();
    publish();
  }, [engine, publish]);
  return {
    state,
    input,
    restart,
    timed: engine.timed,
    awaitingSubmit: engine.awaitingSubmit,
  };
}
