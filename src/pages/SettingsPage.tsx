import { useState } from "react";
import {
  Check,
  Moon,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import type { Settings } from "../types";
import { THEMES } from "../types";
import {
  Button,
  ConfirmDialog,
  PageHeading,
  Toggle,
} from "../components/common";
export function SettingsPage({
  settings,
  update,
  reset,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space, your pace"
        description="A few thoughtful adjustments to help you settle into your flow."
      />
      <div className="settings-grid">
        <section className="panel appearance-panel">
          <div className="section-title">
            <Palette size={18} />
            <div>
              <h2>Appearance</h2>
              <p>A different atmosphere. The same calm.</p>
            </div>
          </div>
          <div className="theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme}
                className={`theme-option ${settings.theme === theme ? "chosen" : ""}`}
                aria-pressed={settings.theme === theme}
                aria-label={`${theme[0].toUpperCase() + theme.slice(1)} theme`}
                onClick={() => update({ theme })}
              >
                <span className={`theme-swatch swatch-${theme}`}>
                  <span />
                  <span />
                  <span />
                  {settings.theme === theme && <Check size={15} />}
                </span>
                <span>
                  {theme === "dark" && <Moon size={11} />}{" "}
                  {theme[0].toUpperCase() + theme.slice(1)}
                </span>
              </button>
            ))}
          </div>
          <Toggle
            label="Landscape background"
            description="A little nature at the edge of your workspace."
            checked={settings.landscape}
            onChange={(landscape) => update({ landscape })}
          />
        </section>
        <section className="panel typography-panel">
          <div className="section-title">
            <Type size={18} />
            <div>
              <h2>Typography</h2>
              <p>Find a comfortable reading rhythm.</p>
            </div>
          </div>
          <label className="field-label" htmlFor="font-size">
            Font size <span>{settings.fontSize}px</span>
          </label>
          <input
            id="font-size"
            className="range-input"
            type="range"
            min="18"
            max="36"
            step="1"
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
          <div className="two-fields">
            <label>
              Typing font
              <select
                value={settings.font}
                onChange={(e) =>
                  update({ font: e.target.value as Settings["font"] })
                }
              >
                <option value="jetbrains">JetBrains Mono</option>
                <option value="system">System monospace</option>
                <option value="serif">Georgia</option>
              </select>
            </label>
            <label>
              Cursor style
              <select
                value={settings.cursor}
                onChange={(e) =>
                  update({ cursor: e.target.value as Settings["cursor"] })
                }
              >
                <option value="line">Thin line</option>
                <option value="block">Soft block</option>
                <option value="underline">Underline</option>
              </select>
            </label>
          </div>
          <div
            className={`font-preview preview-${settings.cursor}`}
            style={{
              fontSize: Math.min(settings.fontSize, 30),
              fontFamily:
                settings.font === "jetbrains"
                  ? '"JetBrains Mono", monospace'
                  : settings.font === "serif"
                    ? "Georgia, serif"
                    : "monospace",
            }}
          >
            find your <span>f</span>low
          </div>
        </section>
        <section className="panel preferences-panel">
          <div className="section-title">
            <SlidersHorizontal size={18} />
            <div>
              <h2>The little things</h2>
              <p>Less distraction. More attention.</p>
            </div>
          </div>
          <Toggle
            label="Live WPM"
            description="See your typing speed as you go."
            checked={settings.liveWpm}
            onChange={(liveWpm) => update({ liveWpm })}
          />
          <Toggle
            label="Visible timer"
            description="Show the countdown or elapsed time."
            checked={settings.showTimer}
            onChange={(showTimer) => update({ showTimer })}
          />
          <Toggle
            label="Sound on errors"
            description="A soft, short note for an incorrect character."
            checked={settings.sound}
            onChange={(sound) => update({ sound })}
          />
          <Toggle
            label="Smooth cursor"
            description="Let the cursor move gently between characters."
            checked={settings.smoothCursor}
            onChange={(smoothCursor) => update({ smoothCursor })}
          />
        </section>
        <section className="settings-note">
          <div className="local-badge">
            <span className="status-dot" /> JUST ON THIS DEVICE
          </div>
          <h3>Make it yours. Keep it yours.</h3>
          <p>
            Your preferences and practice history live in this browser. No
            account, no tracking, no distractions.
          </p>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw size={14} /> Reset preferences
          </Button>
        </section>
      </div>
      {confirm && (
        <ConfirmDialog
          title="A fresh starting point?"
          message="This resets appearance, typography, and test preferences. Your completed test history will stay right here."
          confirmLabel="Reset preferences"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            reset();
            setConfirm(false);
          }}
        />
      )}
    </>
  );
}
