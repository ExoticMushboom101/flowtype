import { Clock3, Gauge, Target, X } from "lucide-react";
import type { Settings, TestState } from "../../types";
export function LiveStats({
  state,
  timed,
  settings,
  duration,
}: {
  state: TestState;
  timed: boolean;
  settings: Settings;
  duration: number;
}) {
  const ready = state.status === "ready";
  // Timed: the ring drains with the remaining time. Finite passages have no
  // deadline, so the ring drains with the share of the passage still to type.
  const length = Array.from(state.text).length || 1;
  const progress = timed
    ? state.remaining / (duration * 1000)
    : 1 - Math.min(1, Array.from(state.input).length / length);
  return (
    <div className="live-stats" aria-label="Live typing statistics">
      <div className="stat-card">
        <span>
          <Gauge size={13} /> WPM
        </span>
        <strong data-testid="live-wpm">
          {!settings.liveWpm ? "···" : ready ? "0" : Math.round(state.wpm)}
          <small> wpm</small>
        </strong>
      </div>
      <div className="stat-card">
        <span>
          <Target size={13} /> Accuracy
        </span>
        <strong>
          {ready ? "100" : Math.round(state.accuracy)}
          <small>%</small>
        </strong>
      </div>
      <div className="stat-card timer-card">
        <span>
          <Clock3 size={13} /> {timed ? "Time left" : "Elapsed"}
        </span>
        <strong data-testid="live-timer">
          {settings.showTimer
            ? timed
              ? Math.ceil(state.remaining / 1000)
              : Math.floor(state.elapsed / 1000)
            : "···"}
          {settings.showTimer && <small> s</small>}
        </strong>
        {settings.showTimer && (
          <svg
            className="timer-ring"
            width="38"
            height="38"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="16" className="ring-track" />
            <circle
              cx="20"
              cy="20"
              r="16"
              className={`ring-progress ${state.status === "running" ? "running" : ""}`}
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - progress * 100}
            />
          </svg>
        )}
      </div>
      <div className={`stat-card ${state.errors ? "has-errors" : ""}`}>
        <span>
          <X size={13} /> Errors
        </span>
        <strong>
          {state.errors}
          <small> {state.errors === 1 ? "error" : "errors"}</small>
        </strong>
      </div>
    </div>
  );
}
