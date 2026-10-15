import { useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Hash,
  Moon,
  RotateCcw,
  Search,
  Settings2,
  Type,
} from "lucide-react";
import type { TestConfig } from "../types";
import { Dialog } from "./common";
export function CommandMenu({
  close,
  restart,
  update,
  config,
  settings,
  theme,
}: {
  close: () => void;
  restart: () => void;
  update: (patch: Partial<TestConfig>) => void;
  config: TestConfig;
  settings: () => void;
  theme: () => void;
}) {
  const [query, setQuery] = useState(""),
    [index, setIndex] = useState(0);
  const commands = useMemo(
    () => [
      {
        label: "Restart test",
        description: "A fresh start, same rhythm",
        icon: RotateCcw,
        action: restart,
      },
      ...([15, 30, 60, 120] as const).map((duration) => ({
        label: `${duration} second test`,
        description: "Change duration & reset",
        icon: Clock3,
        action: () => update({ mode: "time", duration, source: "passage" }),
      })),
      {
        label: `${config.punctuation ? "Disable" : "Enable"} punctuation`,
        description: "Standard passage practice",
        icon: Type,
        action: () =>
          update({ punctuation: !config.punctuation, source: "passage" }),
      },
      {
        label: `${config.numbers ? "Disable" : "Enable"} numbers`,
        description: "Standard passage practice",
        icon: Hash,
        action: () => update({ numbers: !config.numbers, source: "passage" }),
      },
      {
        label: "Open settings",
        description: "Make this space your own",
        icon: Settings2,
        action: settings,
      },
      {
        label: "Switch light / dark theme",
        description: "A change of atmosphere",
        icon: Moon,
        action: theme,
      },
    ],
    [config, restart, update, settings, theme],
  );
  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );
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
              setIndex((i) => Math.min(filtered.length - 1, i + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(0, i - 1));
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
      >
        {filtered.length ? (
          filtered.map(({ label, description, icon: Icon, action }, i) => (
            <button
              key={label}
              id={`command-${i}`}
              role="option"
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
