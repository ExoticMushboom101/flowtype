# FlowType

A calm, local-first typing application built with React 19, TypeScript and Vite. This application lives beside the original Designer starter projects; no existing CAD files or workflows were replaced.

**Live on Vercel:** [flowtype-sigma.vercel.app](https://flowtype-sigma.vercel.app/) · **GitHub Pages:** [exoticmushboom101.github.io/flowtype](https://exoticmushboom101.github.io/flowtype/) · **Source:** [github.com/ExoticMushboom101/flowtype](https://github.com/ExoticMushboom101/flowtype)

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

Browser tests use a locally installed Google Chrome through Playwright. They do not require a downloaded Chromium bundle. `npm run preview` serves the production build at http://localhost:4173. Hash routing means server-side route rewrites are unnecessary. Use HTTPS in production for clipboard support.

## Deployment

### Vercel (production)

Every push to `main` runs the [Vercel deployment workflow](.github/workflows/deploy-vercel.yml). GitHub Actions checks out this repository, installs with `npm ci`, runs type checking, lint and all unit tests, builds with Vercel CLI 64.2.0, and publishes the prebuilt output to production. The public URL is [flowtype-sigma.vercel.app](https://flowtype-sigma.vercel.app/). It serves the app from `/`, not the Pages `/flowtype/` prefix.

This uses GitHub Actions rather than Vercel's GitHub App: the account's saved Vercel-to-GitHub credential returned `Bad credentials` during setup. Git-based automatic production updates still work through the workflow. The project is public without a Vercel login; only this project's deployment protection was disabled.

Authentication is the encrypted repository secret `VERCEL_TOKEN`; the non-secret project identifiers are repository variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. No token is committed. To rotate the deployment credential, replace the repository secret in GitHub Settings → Secrets and variables → Actions, then revoke the old token in Vercel. Keep local Vercel settings and downloaded environment files out of git (the ignore rules cover them).

The initial production deploy passed its checks and a live Chrome smoke test: HTTP 200, fonts and artwork loaded, typing completed, results persisted after reload, no mobile horizontal overflow at 390×844, and no browser/network errors. Real live-site captures:

- [Desktop](artifacts/deployment/vercel-desktop.png)
- [Completed test](artifacts/deployment/vercel-results.png)
- [Mobile](artifacts/deployment/vercel-mobile.png)

### GitHub Pages (retained)

Every push to `main` runs the [Pages workflow](.github/workflows/deploy.yml). It installs dependencies with `npm ci`, then runs type checking, ESLint and the unit tests. It builds and publishes the result to GitHub Pages, and a failing check blocks the deploy. Browser (Playwright) tests stay local because they use an installed Chrome.

GitHub Pages serves this project from `/<repository>/`. The workflow therefore sets `BASE_PATH` from the repository name, and [Vite config](vite.config.ts) applies it to every asset URL. Local development and root-domain hosts keep the default `/`. To reproduce the Pages build locally:

```sh
BASE_PATH=/flowtype/ npm run build
BASE_PATH=/flowtype/ npx vite preview   # http://localhost:4173/flowtype/
```

Each browser keeps its own settings and history. Data saved on `localhost` doesn't carry over to the deployed site or other devices.

## What works

- **Practice:** 15/30/60/120-second runs and 10/25/50/100-word runs, independent punctuation/number options, original and public-domain quotes with attribution, custom text, and a next-passage button.
- **Typing:** per-character correctness, underlined errors, backspace correction, IME composition, Unicode code-point comparison, preserved repeated spaces and newlines, mobile input, and a cursor that follows wrapped text.
- **Keyboard:** typing a letter with nothing focused (or with a button or link focused) starts the test, so no click is needed. Changing the test configuration returns focus to the passage. While typing, Tab focuses the restart button and Enter activates it, with no custom global Tab handler. Escape opens searchable commands (restart, next passage, durations, word counts, punctuation, numbers, quote mode, every theme, and every page). Arrow keys, Home/End and Enter select; Escape closes. Inputs, selects, textareas and editable fields are never intercepted. A navbar button opens the same menu for pointer and touch users.
- **Results:** real net/raw WPM, final-input accuracy, lifetime error attempts, current mismatches, corrected errors, consistency, actual time-series data, copy results, and a short local motivational line. Try again repeats the same passage; Back to practice loads the next one.
- **Stats:** up to 200 locally stored attempts, personal best and averages, recent trend, inspectable attempt details, and confirmed history clearing.
- **Words:** seven categories, quote practice, custom text validation, and automatic local draft saving. The "Up next" preview shows exactly the text Practice will load, because both use the same passage seed, and it can be shuffled.
- **Settings:** five complete semantic palettes, local fonts, font-size control, three font choices, three cursor styles, live WPM/timer visibility, error audio, smooth cursor, landscape visibility, and confirmed preference reset.
- **Atmosphere:** an original sunrise landscape for the light palettes, and a separately painted night scene with moon and stars for Dark. The leaf-and-river logo is an inline SVG that recolors with every theme.
- **Resilience:** validated local data, quota/blocked-storage warnings, in-memory results when saving fails, missing-image fallback per scene, background-tab deadline catch-up, reduced motion, modal focus containment, route-leaving confirmation, reload warning during active tests, and a root error boundary. Result IDs work on plain-HTTP LAN addresses, where `crypto.randomUUID` is unavailable.

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
- Word, quote and custom tests end at a word boundary. Typing the final character correctly finishes immediately, with no trailing space needed. If the final character is wrong, the run waits ("Space to finish · backspace to fix"). Space or Enter submits with the error; Backspace allows a correction first. Other keys past the end are ignored. Errors earlier in the passage can remain and lower accuracy. Quotes and custom text are always finite, regardless of the previous timed-mode selection.
- The finite-mode ring shows the share of the passage still to type; the timed ring shows remaining time.
- Timed tests finish at the configured deadline. An input event arriving exactly at or after the deadline is not accepted. A timed passage extends if a very fast typist exhausts the bank.
- Samples represent actual observed cumulative speed about once a second; throttled gaps never generate fake intermediate points. Consistency is `clamp(100 × (1 − standard deviation / mean), 0, 100)` of full one-second correct-character speed windows. Partial final windows and missed multi-second windows are excluded. Fewer than three valid windows displays an em dash.
- Changing test configuration deliberately creates a fresh ready attempt. Changing appearance does not reset a running test. Retry preserves the configuration and passage and restores typing focus. "Next passage" steps through the library in order, so the new text always differs from the current one. A fresh seed is chosen on each app load.
- Preference reset restores appearance and test defaults but keeps the user's custom passage and draft.
- Navigating away from a running test asks for confirmation; unfinished attempts are not saved. Reload closes the active attempt but preserves completed history and preferences. Reloading results returns to a fresh practice screen; the completed attempt remains in Stats.
- Custom text is trimmed at its outer edges, CRLF is normalized to LF, tabs become four spaces, and non-printable controls are removed. Interior spaces/newlines remain intact. Source text is not retained inside historical records; the selected text and draft are only local preferences. Do not put secrets into practice text on shared devices.
- Paste/drop and undo are disabled in the test, but remain available in custom-text editing. Backspace and native word-backspace work from the end of the typing buffer. Arrow navigation does not move the append/correct typing position.

## Verification

The repository includes 32 unit tests and 21 Chrome browser tests, including:

- State transitions, first input, correct/incorrect characters, corrections, net/raw metrics, exact timer expiry, word-boundary submission and correction of a wrong final character, restart, background throttling, Unicode/whitespace, text validation, deterministic seeds, next passage/quote cycling, and ID fallback without `randomUUID`.
- Preferences/history round trips, seed validation, compact sample storage, malformed data, blocked storage, deduplication and the history limit.
- Keyboard-only restart, typing with nothing focused, focus return after a configuration change, real results/history, command search across themes and word counts, the night landscape, Words preview matching Practice, preference reset keeping custom text, theme changes during a run, navigation protection, custom-text draft recovery and IME commit behavior.
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

The [sunrise landscape](public/landscape.svg), [night landscape](public/landscape-night.svg), logo, favicon and prose are original FlowType assets. Quotes are either original "FlowType notes" or short public-domain excerpts (Thoreau's *Walden*, 1854; Emerson's *Nature*, 1836; Muir's *Our National Parks*, 1901). Each excerpt is attributed in the app, and its wording was checked against Project Gutenberg / Digital Thoreau editions. Inter and JetBrains Mono are bundled locally through Fontsource; their SIL OFL license notices ship in the [font license file](public/font-licenses.txt). Lucide supplies icons. There is no analytics, authentication or cross-device synchronization. Storage belongs to the browser origin; private browsing, clearing site data or changing ports may change what is available.

This is a static client-side application with no server component. Browser automation was performed in desktop Chrome with responsive viewport emulation; actual iOS/Android keyboards, Safari, Firefox and manual screen-reader interaction have not been certified. Ordinary vertical scrolling on short mobile screens is intentional. Clipboard and optional audio gracefully degrade when the browser blocks them.
