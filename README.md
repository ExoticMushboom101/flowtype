# FlowType

A calm, local-first typing application built with React 19, TypeScript and Vite. This application lives beside the original Designer starter projects; no existing CAD files or workflows were replaced.

## Run

Use Node.js 22.12+ (developed and checked with Node 24) and npm.

```sh
# From this directory
npm ci
npm run dev
# http://localhost:5173
```

From the workspace root, use `npm --prefix flowtype run dev` instead. No API keys, accounts, backend, or remote font/image services are required.

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

Browser tests use a locally installed Google Chrome through Playwright. They do not require a downloaded Chromium bundle. `npm run preview` serves the production build at http://localhost:4173. Deploy the generated output to a static host at the domain root. Hash routing means server-side route rewrites are unnecessary. Use HTTPS in production for clipboard support.

## What works

- **Practice:** 15/30/60/120-second runs and 10/25/50/100-word runs, independent punctuation/number options, original quotes, and custom text.
- **Typing:** per-character correctness, underlined errors, backspace correction, IME composition, Unicode code-point comparison, preserved repeated spaces and newlines, mobile input, and a cursor that follows wrapped text.
- **Keyboard:** while typing, Tab focuses the restart button and Enter activates it without a custom global Tab handler. Escape opens searchable commands; arrows/Enter select and Escape closes. Normal inputs and editable fields are not intercepted.
- **Results:** real net/raw WPM, final-input accuracy, lifetime error attempts, current mismatches, corrected errors, consistency, actual time-series data, copy results, retry, and navigation.
- **Stats:** up to 200 locally stored attempts, personal best and averages, recent trend, inspectable attempt details, and confirmed history clearing.
- **Words:** seven categories, quote practice, custom text validation and preview, automatic local draft saving, and configuration reflected in Practice.
- **Settings:** five complete semantic palettes, local fonts, font-size control, three font choices, three cursor styles, live WPM/timer visibility, error audio, smooth cursor, landscape visibility, and confirmed preference reset.
- **Resilience:** validated local data, quota/blocked-storage warnings, in-memory results when saving fails, missing-image fallback, background-tab deadline catch-up, reduced motion, modal focus containment, route-leaving confirmation, reload warning during active tests, and a root error boundary.

## Architecture

- [Application shell and hash navigation](src/App.tsx)
- [Framework-independent typing state machine](src/lib/typingEngine.ts)
- [Metric definitions and calculations](src/lib/typingMetrics.ts)
- [Text generation and custom-text normalization](src/lib/textGenerator.ts)
- [Storage validation and persistence](src/lib/storage.ts)
- [Typed application contracts](src/types.ts)
- [Engine lifecycle hook](src/hooks/useTypingTest.ts)
- [Single preference/configuration owner](src/hooks/usePreferences.ts)
- [Memoized typing viewport and cursor](src/components/typing/TypingArea.tsx)
- [Live statistics](src/components/typing/LiveStats.tsx)
- [SVG performance chart](src/components/results/WpmChart.tsx)
- [Results presentation](src/components/results/ResultsView.tsx)
- [Five semantic palettes](src/themes.css)
- [Responsive styles](src/styles.css)

Practice owns its fast-changing engine snapshot so typing does not re-render the navigation and supporting pages. The viewport is memoized against timer-only changes, and individual word components isolate character changes. Cursor measurements happen only on input position, font/viewport changes and font readiness. Timers are cleaned up on completion/unmount. Charts are lightweight SVG, not a charting framework. Sound uses a short Web Audio oscillator only after a wrong-input gesture.

## Scoring and behavior contract

- Time is derived from an injected monotonic timestamp, with a 100 ms display tick. It is not a decrementing counter. Hidden tabs, unfocused input and command menus **do not pause** the deadline. On returning to the tab, the engine catches up.
- First non-empty input starts the run. Empty input, focus, and backspace on an empty field do not start it.
- Net WPM = current correct Unicode code points / 5 / elapsed minutes.
- Raw WPM = all current code points, including mismatches / 5 / elapsed minutes. Deleted characters are not included in either speed.
- Accuracy = correct / total current input. Before input, accuracy is 100%. After correction, the removed mismatch no longer lowers accuracy.
- Every newly entered mismatch counts individually as an incorrect keystroke. Removing a mismatch increases corrected errors. The current mismatch count is tracked independently.
- Word tests end on the final character, with no trailing space required. Errors are allowed to remain and lower accuracy. Quotes and custom text are always finite, regardless of the previous timed-mode selection.
- Timed tests finish at the configured deadline. An input event arriving exactly at or after the deadline is not accepted. A timed passage extends if a very fast typist exhausts the bank.
- Samples represent actual observed cumulative speed about once a second; throttled gaps never generate fake intermediate points. Consistency is `clamp(100 × (1 − standard deviation / mean), 0, 100)` of full one-second correct-character speed windows. Partial final windows and missed multi-second windows are excluded. Fewer than three valid windows displays an em dash.
- Changing test configuration deliberately creates a fresh ready attempt. Changing appearance does not reset a running test. Retry preserves the configuration and passage and restores typing focus.
- Navigating away from a running test asks for confirmation; unfinished attempts are not saved. Reload closes the active attempt but preserves completed history and preferences. Reloading results returns to a fresh practice screen; the completed attempt remains in Stats.
- Custom text is trimmed at its outer edges, CRLF is normalized to LF, tabs become four spaces, and non-printable controls are removed. Interior spaces/newlines remain intact. Source text is not retained inside historical records; the selected text and draft are only local preferences. Do not put secrets into practice text on shared devices.
- Paste/drop and undo are disabled in the test, but remain available in custom-text editing. Backspace and native word-backspace work from the end of the typing buffer. Arrow navigation does not move the append/correct typing position.

## Verification

The repository includes 24 unit tests and 16 Chrome browser tests, including:

- State transitions, first input, correct/incorrect characters, corrections, metrics, exact timer expiry, word boundaries, restart, background throttling, Unicode/whitespace and text validation.
- Preferences/history round trips, malformed data, blocked storage, deduplication and the history limit.
- Keyboard-only restart, real results/history, command search, theme changes during a run, navigation protection, custom-text draft recovery and IME commit behavior.
- All four pages at 1440×900, 1280×800, 768×1024, 390×844 and 320×640 with no page-level horizontal overflow.
- Automated axe WCAG A/AA checks on every page in every theme, mobile practice in every theme, the command menu and real completed results. These are automated checks, not a substitute for manual assistive-technology testing.

With the dev server running, regenerate seven real UI captures:

```sh
node scripts/verify-visuals.mjs
```

- [Desktop practice](artifacts/verification/practice-desktop.png)
- [Mobile practice](artifacts/verification/practice-mobile.png)
- [Night atmosphere](artifacts/verification/practice-dark.png)
- [Real completed test](artifacts/verification/results-desktop.png)
- [Practice journal](artifacts/verification/stats-desktop.png)
- [Settings](artifacts/verification/settings-desktop.png)
- [Words](artifacts/verification/words-desktop.png)

## Assets, privacy and boundaries

The [landscape](public/landscape.svg), favicon, prose and quotes are original FlowType assets. Inter and JetBrains Mono are bundled locally through Fontsource; their SIL OFL license notices ship in the [font license file](public/font-licenses.txt). Lucide supplies icons. There is no analytics, authentication or cross-device synchronization. Storage belongs to the browser origin; private browsing, clearing site data or changing ports may change what is available.

This is a client-side application, not a deployed hosted service. Browser automation was performed in desktop Chrome with responsive viewport emulation; actual iOS/Android keyboards, Safari, Firefox and manual screen-reader interaction have not been certified. Ordinary vertical scrolling on short mobile screens is intentional. Clipboard and optional audio gracefully degrade when the browser blocks them.
