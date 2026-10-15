import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock3,
  Hash,
  Palette,
  RotateCcw,
  Search,
  Settings2,
  Shuffle,
  Type,
  WholeWord,
} from "lucide-react";
import type { TestConfig, Theme } from "../types";
import { THEMES } from "../types";
import { Dialog } from "./common";
const title = (s: string) => s[0].toUpperCase() + s.slice(1);
export function CommandMenu({
  close,
  restart,
  nextPassage,
  update,
  config,
  settings,
  words,
  stats,
  theme,
  setTheme,
  currentTheme,
}: {
  close: () => void;
  restart: () => void;
  nextPassage: () => void;
  update: (patch: Partial<TestConfig>) => void;
  config: TestConfig;
  settings: () => void;
  words: () => void;
  stats: () => void;
  theme: () => void;
  setTheme: (theme: Theme) => void;
  currentTheme: Theme;
}) {
  const [query, setQuery] = useState(""),
    [index, setIndex] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const commands = useMemo(
    () => [
      {
        label: "Restart test",
        description: "A fresh start, same passage",
        keywords: "reset again retry",
        icon: RotateCcw,
        action: restart,
      },
      {
        label: config.source === "quote" ? "Next quote" : "Next passage",
        description: "Same settings, new words",
        keywords: "new shuffle different text",
        icon: Shuffle,
        action: nextPassage,
      },
      ...([15, 30, 60, 120] as const).map((duration) => ({
        label: `${duration} second test`,
        description: "Change duration & reset",
        keywords: "time timer duration seconds",
        icon: Clock3,
        action: () => update({ mode: "time", duration, source: "passage" }),
      })),
      ...([10, 25, 50, 100] as const).map((wordCount) => ({
        label: `${wordCount} word test`,
        description: "Change word count & reset",
        keywords: "words count length",
        icon: WholeWord,
        action: () => update({ mode: "words", wordCount, source: "passage" }),
      })),
      {
        label: `${config.punctuation ? "Disable" : "Enable"} punctuation`,
        description: "Standard passage practice",
        keywords: "symbols commas",
        icon: Type,
        action: () =>
          update({ punctuation: !config.punctuation, source: "passage" }),
      },
      {
        label: `${config.numbers ? "Disable" : "Enable"} numbers`,
        description: "Standard passage practice",
        keywords: "digits",
        icon: Hash,
        action: () => update({ numbers: !config.numbers, source: "passage" }),
      },
      {
        label: "Quote practice",
        description: "A single finite quote",
        keywords: "quote mode",
        icon: BookOpen,
        action: () => update({ source: "quote" }),
      },
      {
        label: "Switch light / dark theme",
        description: "A change of atmosphere",
        keywords: "theme mode night day",
        icon: Palette,
        action: theme,
      },
      ...THEMES.filter((t) => t !== currentTheme).map((t) => ({
        label: `${title(t)} theme`,
        description: "Apply this palette everywhere",
        keywords: "theme color appearance",
        icon: Palette,
        action: () => setTheme(t),
      })),
      {
        label: "Words & custom text",
        description: "Categories, quotes, your own passage",
        keywords: "custom passage category library",
        icon: BookOpen,
        action: words,
      },
      {
        label: "View stats",
        description: "Your practice journal",
        keywords: "history results progress",
        icon: BarChart3,
        action: stats,
      },
      {
        label: "Open settings",
        description: "Make this space your own",
        keywords: "preferences font cursor sound",
        icon: Settings2,
        action: settings,
      },
    ],
    [config, restart, nextPassage, update, settings, words, stats, theme, setTheme, currentTheme],
  );
  const needle = query.trim().toLowerCase();
  const filtered = commands.filter((c) =>
    `${c.label} ${c.keywords}`.toLowerCase().includes(needle),
  );
  useEffect(() => {
    list.current
      ?.querySelector(`#command-${index}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [index]);
  const run = (action: () => void) => {
    close();
    requestAnimationFrame(action);
  };
  return (
    <Dialog
      title="A little shortcut"
      onClose={close}
      className="command-dialog"
    >
      <div className="command-search">
        <Search size={17} />
        <input
          autoFocus
          placeholder="Where would you like to go?"
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-list"
          aria-autocomplete="list"
          aria-activedescendant={
            filtered[index] ? `command-${index}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => (i + 1) % Math.max(1, filtered.length));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex(
                (i) =>
                  (i - 1 + Math.max(1, filtered.length)) %
                  Math.max(1, filtered.length),
              );
            }
            if (e.key === "Home") {
              e.preventDefault();
              setIndex(0);
            }
            if (e.key === "End") {
              e.preventDefault();
              setIndex(Math.max(0, filtered.length - 1));
            }
            if (e.key === "Enter" && filtered[index]) {
              e.preventDefault();
              run(filtered[index].action);
            }
          }}
        />
      </div>
      <div
        id="command-list"
        role="listbox"
        aria-label="Commands"
        className="command-list"
        ref={list}
      >
        {filtered.length ? (
          filtered.map(({ label, description, icon: Icon, action }, i) => (
            <button
              key={label}
              id={`command-${i}`}
              role="option"
              tabIndex={-1}
              aria-selected={i === index}
              className={i === index ? "highlighted" : ""}
              onPointerMove={() => setIndex(i)}
              onClick={() => run(action)}
            >
              <Icon size={17} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight size={14} />
            </button>
          ))
        ) : (
          <p className="no-commands">
            No commands found. Try “theme” or “restart”.
          </p>
        )}
      </div>
      <div className="command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>enter</kbd> to select
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
      <p className="small-note">
        A running timer keeps going while this menu is open.
      </p>
    </Dialog>
  );
}
