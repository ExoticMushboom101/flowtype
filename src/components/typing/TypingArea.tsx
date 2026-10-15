import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, RefObject } from "react";
import { MousePointer2 } from "lucide-react";
import type { Settings } from "../../types";
const TypingWord = memo(function TypingWord({
  text,
  typed,
  current,
}: {
  text: string;
  typed: string;
  current: number;
}) {
  const chars = Array.from(text),
    input = Array.from(typed);
  return (
    <span className={/^\s+$/u.test(text) ? "whitespace" : "typing-word"}>
      {chars.map((char, i) => (
        <span
          key={i}
          data-current={i === current ? "true" : undefined}
          className={
            i < input.length
              ? input[i] === char
                ? "char correct"
                : "char incorrect"
              : "char"
          }
        >
          {char === "\n" ? (
            <>
              <span className="newline-mark" aria-hidden="true">
                ↵
              </span>
              {"\n"}
            </>
          ) : (
            char
          )}
        </span>
      ))}
    </span>
  );
});
export const TypingArea = memo(function TypingArea({
  text,
  input,
  settings,
  onInput,
  inputRef,
  onFocusChange,
  focusRequest,
}: {
  text: string;
  input: string;
  settings: Settings;
  onInput: (v: string) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onFocusChange: (v: boolean) => void;
  focusRequest: number;
}) {
  const viewport = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false),
    [draft, setDraft] = useState<string | null>(null);
  const composing = useRef(false);
  const cursor = useRef<HTMLSpanElement>(null);
  const tokens = useMemo(() => {
    let offset = 0;
    return (text.match(/\S+|\s+/gu) ?? []).map((word) => {
      const start = offset;
      offset += Array.from(word).length;
      return { text: word, start, length: offset - start };
    });
  }, [text]);
  const entered = useMemo(() => Array.from(input), [input]);
  const position = entered.length;
  const fontStyle = {
    "--typing-size": `${settings.fontSize}px`,
    "--typing-font":
      settings.font === "jetbrains"
        ? '"JetBrains Mono", monospace'
        : settings.font === "serif"
          ? "Georgia, serif"
          : 'ui-monospace, "SFMono-Regular", Consolas, monospace',
  } as CSSProperties;
  const positionCursor = useCallback(() => {
    const active = content.current?.querySelector<HTMLElement>(
      '[data-current="true"]',
    );
    if (!active || !content.current || !cursor.current || !viewport.current)
      return;
    const target = active.getBoundingClientRect(),
      parent = content.current.getBoundingClientRect();
    const x = target.left - parent.left,
      y = target.top - parent.top;
    cursor.current.style.transform = `translate(${x}px, ${y}px)`;
    cursor.current.style.height = `${target.height}px`;
    cursor.current.style.setProperty(
      "--char-width",
      `${Math.max(8, target.width)}px`,
    );
    const lineHeight = parseFloat(getComputedStyle(content.current).lineHeight);
    const scrollTarget = Math.max(0, y - lineHeight);
    if (Math.abs(viewport.current.scrollTop - scrollTarget) > lineHeight * 0.5)
      viewport.current.scrollTo({ top: scrollTarget, behavior: "instant" });
  }, []);
  useLayoutEffect(() => {
    positionCursor();
  }, [position, text, settings.fontSize, settings.font, positionCursor]);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(positionCursor);
    if (viewport.current) observer.observe(viewport.current);
    document.fonts.ready.then(positionCursor);
    return () => observer.disconnect();
  }, [positionCursor]);
  useLayoutEffect(() => {
    if (focusRequest > 0) {
      setDraft(null);
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [focusRequest, inputRef]);
  return (
    <div
      className={`typing-shell ${focused ? "is-focused" : ""}`}
      style={fontStyle}
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
    >
      <div className="typing-viewport" ref={viewport}>
        <div className="passage" ref={content} aria-hidden="true">
          {tokens.map((word, i) => (
            <TypingWord
              key={i}
              text={word.text}
              typed={entered
                .slice(word.start, Math.min(position, word.start + word.length))
                .join("")}
              current={
                position >= word.start && position < word.start + word.length
                  ? position - word.start
                  : -1
              }
            />
          ))}
          <span
            ref={cursor}
            className={`typing-cursor cursor-${settings.cursor} ${settings.smoothCursor ? "smooth" : ""} ${input.length ? "" : "blink"}`}
          />
        </div>
      </div>
      <textarea
        ref={inputRef}
        className="typing-input"
        aria-label="Typing input"
        aria-describedby="typing-instructions target-passage"
        value={draft ?? input}
        onChange={(e) => {
          if (composing.current) setDraft(e.target.value);
          else onInput(e.target.value);
        }}
        onCompositionStart={() => {
          composing.current = true;
          setDraft(input);
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setDraft(null);
          onInput(e.currentTarget.value);
        }}
        onFocus={() => {
          setFocused(true);
          onFocusChange(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange(false);
        }}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
              "End",
            ].includes(e.key) &&
            !e.metaKey &&
            !e.ctrlKey
          )
            e.preventDefault();
          if (e.key === "Enter" && !composing.current) {
            e.preventDefault();
            onInput(input + "\n");
          }
          if (
            (e.ctrlKey || e.metaKey) &&
            ["v", "z", "y"].includes(e.key.toLowerCase())
          )
            e.preventDefault();
        }}
        onSelect={(e) => {
          const el = e.currentTarget;
          if (
            !composing.current &&
            (el.selectionStart !== el.value.length ||
              el.selectionEnd !== el.value.length)
          )
            el.setSelectionRange(el.value.length, el.value.length);
        }}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
      />
      <span id="typing-instructions" className="sr-only">
        Type the passage from left to right. Backspace corrects previous
        characters. Paste is disabled. Tab then Enter restarts. Escape opens
        commands.
      </span>
      <span id="target-passage" className="sr-only">
        {text}
      </span>
      {!focused && (
        <span className="focus-message">
          <MousePointer2 size={12} /> Click the text or tab to focus
        </span>
      )}
    </div>
  );
});
