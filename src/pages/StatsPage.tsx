import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock3,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { TestResult } from "../types";
import { Button, ConfirmDialog, PageHeading } from "../components/common";
import { WpmChart } from "../components/results/WpmChart";
import { modeLabel, ResultsView } from "../components/results/ResultsView";
export function StatsPage({
  history,
  clear,
  practice,
}: {
  history: TestResult[];
  clear: () => void;
  practice: () => void;
}) {
  const [confirm, setConfirm] = useState(false),
    [selected, setSelected] = useState<TestResult | null>(null);
  if (selected)
    return (
      <ResultsView
        historical
        result={selected}
        retry={practice}
        back={practice}
        stats={() => setSelected(null)}
      />
    );
  const avg = (key: "wpm" | "accuracy") =>
    history.length
      ? history.reduce((s, r) => s + r[key], 0) / history.length
      : 0;
  const best = Math.max(0, ...history.map((r) => r.wpm));
  const recent = history.slice(0, 20).reverse();
  return (
    <>
      <PageHeading
        eyebrow="YOUR PRACTICE JOURNAL"
        title="Small steps add up"
        description="Not a competition. Just a little perspective on how far you’ve come."
      />
      <div className="summary-grid">
        {[
          { icon: Clock3, label: "Completed tests", value: history.length },
          {
            icon: TrendingUp,
            label: "Average WPM",
            value: history.length ? Math.round(avg("wpm")) : "—",
          },
          {
            icon: Sparkles,
            label: "Personal best",
            value: history.length ? Math.round(best) : "—",
          },
          {
            icon: Target,
            label: "Average accuracy",
            value: history.length ? `${avg("accuracy").toFixed(1)}%` : "—",
          },
        ].map(({ icon: Icon, label, value }) => (
          <div className="stat-card" key={label}>
            <span>
              <Icon size={14} />
              {label}
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {!history.length ? (
        <section className="empty-state panel">
          <div className="empty-icon">
            <BarChart3 size={30} strokeWidth={1.4} />
          </div>
          <h2>Your story starts with a single word.</h2>
          <p>
            Finish your first test and your practice history will grow here.
            <br />
            No account needed. Just you, finding your rhythm.
          </p>
          <Button onClick={practice}>
            Begin a little practice <ArrowRight size={15} />
          </Button>
        </section>
      ) : (
        <>
          <section className="panel trend-panel">
            <WpmChart
              samples={recent.map((r, i) => ({
                second: i + 1,
                wpm: r.wpm,
                raw: r.rawWpm,
                windowWpm: r.wpm,
              }))}
              label="Your recent rhythm"
              axis="attempt"
            />
          </section>
          <section className="panel history-panel">
            <div className="history-heading">
              <div>
                <h2>Recent practice</h2>
                <p>
                  Your latest {history.length}{" "}
                  {history.length === 1 ? "moment" : "moments"} of focus.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setConfirm(true)}>
                <Trash2 size={13} /> Clear history
              </Button>
            </div>
            <div className="history-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Practice</th>
                    <th>WPM</th>
                    <th>Accuracy</th>
                    <th>Errors</th>
                    <th>
                      <span className="sr-only">View attempt</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((result) => (
                    <tr key={result.id}>
                      <td>
                        <time dateTime={result.completedAt}>
                          {new Date(result.completedAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </time>
                        <small>
                          {new Date(result.completedAt).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </small>
                      </td>
                      <td>
                        <span className="mode-tag">{modeLabel(result)}</span>
                      </td>
                      <td className="table-wpm">{Math.round(result.wpm)}</td>
                      <td>{result.accuracy.toFixed(1)}%</td>
                      <td>{result.errors}</td>
                      <td>
                        <button
                          className="icon-button"
                          onClick={() => setSelected(result)}
                          aria-label={`View result from ${new Date(result.completedAt).toLocaleString()}`}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <p className="data-note">
        Stored in this browser only. Up to 200 attempts. Different modes and
        durations are not directly comparable.
      </p>
      {confirm && (
        <ConfirmDialog
          title="Turn a new page?"
          message="This permanently clears your completed attempts from this browser. Your settings and custom text will not change."
          confirmLabel="Clear history"
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            clear();
            setConfirm(false);
          }}
        />
      )}
    </>
  );
}
