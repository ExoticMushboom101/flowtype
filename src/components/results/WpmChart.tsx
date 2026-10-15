import { useId, useState } from "react";
import type { Sample } from "../../types";
export function WpmChart({
  samples,
  label = "Typing speed over time",
  axis = "second",
}: {
  samples: Sample[];
  label?: string;
  axis?: "second" | "attempt";
}) {
  const id = useId().replace(/:/g, ""),
    [hover, setHover] = useState<number | null>(null);
  const width = 760,
    height = 205,
    left = 40,
    top = 20,
    plotW = 700,
    plotH = 140;
  const maxX = Math.max(1, ...samples.map((s) => s.second)),
    maxY = Math.max(
      40,
      Math.ceil(Math.max(0, ...samples.map((s) => s.raw)) / 20) * 20,
    );
  const minX = axis === "attempt" ? 1 : 0;
  const xPosition = (value: number) => left + (axis === "attempt" && maxX === 1 ? 0.5 : (value - minX) / Math.max(1, maxX - minX)) * plotW;
  const ticks = axis === "attempt"
    ? [...new Set([1, Math.ceil(maxX * .25), Math.ceil(maxX * .5), Math.ceil(maxX * .75), maxX])].filter(v => v >= 1)
    : [0, .25, .5, .75, 1].map(f => maxX * f);
  const point = (s: Sample, raw = false) => ({
    x: xPosition(s.second),
    y: top + plotH - ((raw ? s.raw : s.wpm) / maxY) * plotH,
  });
  const path = samples
    .map((s, i) => {
      const p = point(s);
      return `${i ? "L" : "M"}${p.x},${p.y}`;
    })
    .join(" ");
  const rawPath = samples
    .map((s, i) => {
      const p = point(s, true);
      return `${i ? "L" : "M"}${p.x},${p.y}`;
    })
    .join(" ");
  const first = samples[0] && point(samples[0]),
    last = samples.at(-1) && point(samples.at(-1)!);
  const active = hover === null ? null : samples[hover];
  const unit = axis === "second" ? "s" : " attempts";
  return (
    <div className="chart">
      <div className="chart-heading">
        <h3>{label}</h3>
        <div className="chart-legend">
          <span>
            <i /> Net WPM
          </span>
          <span>
            <i className="raw-dot" /> Raw WPM
          </span>
        </div>
      </div>
      {samples.length ? (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${label}. ${samples.length} real samples over ${Math.round(maxX)} ${axis === "second" ? "seconds" : "attempts"}. Net speed ranges from ${Math.round(Math.min(...samples.map((s) => s.wpm)))} to ${Math.round(Math.max(...samples.map((s) => s.wpm)))} WPM.`}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity=".12" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line
                  x1={left}
                  x2={left + plotW}
                  y1={top + f * plotH}
                  y2={top + f * plotH}
                  stroke="var(--border)"
                  strokeDasharray="3 5"
                />
                <text x={left - 12} y={top + f * plotH + 4} textAnchor="end">
                  {Math.round(maxY * (1 - f))}
                </text>
              </g>
            ))}
            {ticks.map((value) => (
              <text
                key={value}
                x={xPosition(value)}
                y={height - 17}
                textAnchor="middle"
              >
                {axis === "second" && maxX < 4 ? Number(value.toFixed(1)) : Math.round(value)}
                {axis === "second" ? "s" : ""}
              </text>
            ))}
            {first && last && (
              <path
                d={`${path} L${last.x},${top + plotH} L${first.x},${top + plotH}Z`}
                fill={`url(#${id})`}
              />
            )}
            <path
              d={rawPath}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              opacity=".5"
            />
            <path
              d={path}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {samples.map((s, i) => {
              const p = point(s);
              return (
                <g key={i} onPointerEnter={() => setHover(i)}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={samples.length === 1 || hover === i ? 4 : 0}
                    fill="var(--accent)"
                  />
                  <rect
                    x={p.x - Math.max(4, plotW / samples.length / 2)}
                    y={top}
                    width={Math.max(8, plotW / samples.length)}
                    height={plotH}
                    fill="transparent"
                  >
                    <title>
                      {s.second.toFixed(axis === "second" ? 1 : 0)}{unit}: {Math.round(s.wpm)} WPM,{" "}
                      {Math.round(s.raw)} raw WPM
                    </title>
                  </rect>
                </g>
              );
            })}
          </svg>
          {active && (
            <div className="chart-tooltip" role="status">
              {active.second.toFixed(axis === "second" ? 1 : 0)}
              {unit} · {Math.round(active.wpm)} WPM · {Math.round(active.raw)}{" "}
              raw
            </div>
          )}
          <p className="chart-caption">
            {axis === "attempt"
              ? "Attempt number · each point is a completed test, oldest to newest."
              : samples.length < 3
                ? "A short test — more time will reveal your rhythm."
                : "Every point is a real sample from this attempt."}
          </p>
        </>
      ) : (
        <p className="empty-chart">
          Your first samples will appear after a little typing.
        </p>
      )}
    </div>
  );
}
