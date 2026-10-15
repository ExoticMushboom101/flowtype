import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, HardDrive, ShieldCheck, X } from "lucide-react";
import { Navbar, BackgroundLandscape, Footer } from "./components/layout";
import { Button, ConfirmDialog, Dialog } from "./components/common";
import { CommandMenu } from "./components/CommandMenu";
import { PracticePage } from "./pages/PracticePage";
import type { PracticeHandle } from "./pages/PracticePage";
import { StatsPage } from "./pages/StatsPage";
import { WordsPage } from "./pages/WordsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { usePreferences } from "./hooks/usePreferences";
import {
  defaultConfig,
  defaultSettings,
  HISTORY_KEY,
  loadHistory,
  saveResult,
  writeStorage,
} from "./lib/storage";
import type { Page, TestResult } from "./types";
function currentPage(): Page {
  const hash = location.hash.replace(/^#\//, "");
  return ["practice", "stats", "words", "settings"].includes(hash)
    ? (hash as Page)
    : "practice";
}
export default function App() {
  const {
    settings,
    config,
    updateSettings,
    updateConfig,
    storageError,
    setStorageError,
  } = usePreferences();
  const [page, setPage] = useState<Page>(currentPage),
    [history, setHistory] = useState(loadHistory);
  const [running, setRunning] = useState(false),
    [commands, setCommands] = useState(false),
    [profile, setProfile] = useState(false),
    [pendingPage, setPendingPage] = useState<Page | null>(null);
  const practiceRef = useRef<PracticeHandle>(null),
    main = useRef<HTMLElement>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const historyRef = useRef(history);
  historyRef.current = history;
  const runningRef = useRef(running);
  runningRef.current = running;
  const commitNavigation = useCallback((next: Page) => {
    setPage(next);
    setPendingPage(null);
    if (location.hash !== `#/${next}`) location.hash = `/${next}`;
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
  }, []);
  const navigate = useCallback(
    (next: Page) => {
      if (next === pageRef.current) return;
      if (runningRef.current) {
        setPendingPage(next);
        return;
      }
      commitNavigation(next);
    },
    [commitNavigation],
  );
  useEffect(() => {
    const onHash = () => {
      const next = currentPage();
      if (next === pageRef.current) return;
      if (runningRef.current) {
        window.history.replaceState(null, "", `#/${pageRef.current}`);
        setPendingPage(next);
      } else commitNavigation(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [commitNavigation]);
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if (
        e.key !== "Escape" ||
        e.repeat ||
        commands ||
        profile ||
        pendingPage ||
        document.querySelector("dialog[open]")
      )
        return;
      const target = e.target as HTMLElement | null;
      if (
        target?.matches(
          'input, select, textarea:not(.typing-input), [contenteditable="true"]',
        )
      )
        return;
      e.preventDefault();
      setCommands(true);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [commands, profile, pendingPage]);
  useEffect(() => {
    document.title = `FlowType — ${page[0].toUpperCase() + page.slice(1)}`;
  }, [page]);
  const record = useCallback(
    (result: TestResult) => {
      const saved = saveResult(result, historyRef.current);
      historyRef.current = saved.history;
      setHistory(saved.history);
      if (!saved.saved) setStorageError(true);
    },
    [setStorageError],
  );
  const clear = () => {
    if (writeStorage(HISTORY_KEY, [])) setHistory([]);
    else setStorageError(true);
  };
  const toggleTheme = () =>
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  const restart = () => {
    if (pageRef.current === "practice") practiceRef.current?.restart();
    else navigate("practice");
  };
  return (
    <div className="app">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Navbar
        page={page}
        theme={settings.theme}
        navigate={navigate}
        toggleTheme={toggleTheme}
        openProfile={() => setProfile(true)}
      />
      {storageError && (
        <div className="storage-warning" role="status">
          <HardDrive size={14} /> Your browser couldn’t save changes. You can
          still practice, but new data may not survive a reload.
          <button
            aria-label="Dismiss storage warning"
            onClick={() => setStorageError(false)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={page === "practice" ? "practice-page" : "content-page"}
      >
        {page === "practice" && (
          <PracticePage
            key={JSON.stringify(config)}
            ref={practiceRef}
            config={config}
            settings={settings}
            updateConfig={updateConfig}
            onComplete={record}
            setRunning={setRunning}
            openWords={() => navigate("words")}
            openStats={() => navigate("stats")}
            openCommands={() => setCommands(true)}
          />
        )}{" "}
        {page === "stats" && (
          <StatsPage
            history={history}
            clear={clear}
            practice={() => navigate("practice")}
          />
        )}{" "}
        {page === "words" && (
          <WordsPage
            config={config}
            update={updateConfig}
            practice={() => navigate("practice")}
            onStorageError={() => setStorageError(true)}
          />
        )}{" "}
        {page === "settings" && (
          <SettingsPage
            settings={settings}
            update={updateSettings}
            reset={() => {
              updateSettings(defaultSettings);
              updateConfig(defaultConfig);
            }}
          />
        )}
      </main>
      <BackgroundLandscape visible={settings.landscape} />
      <Footer openCommands={() => setCommands(true)} />
      {commands && (
        <CommandMenu
          close={() => setCommands(false)}
          restart={restart}
          update={updateConfig}
          config={config}
          settings={() => navigate("settings")}
          theme={toggleTheme}
        />
      )}{" "}
      {profile && (
        <Dialog
          title="Your own little corner"
          onClose={() => setProfile(false)}
        >
          <div className="profile-icon">
            <ShieldCheck size={28} />
          </div>
          <h3 className="profile-title">No account. Just your progress.</h3>
          <p className="dialog-copy">
            FlowType keeps your preferences and up to 200 completed attempts in
            this browser. Nothing is synced or sent to a server.
          </p>
          <div className="profile-stat">
            <strong>{history.length}</strong>
            <span>moments of practice</span>
          </div>
          <Button
            onClick={() => {
              setProfile(false);
              navigate("stats");
            }}
          >
            Your practice journal <ArrowRight size={15} />
          </Button>
        </Dialog>
      )}
      {pendingPage && (
        <ConfirmDialog
          title="Leave this moment of focus?"
          message="Your current attempt will end without being saved. Your completed tests and preferences will stay safe."
          confirmLabel="Leave test"
          onClose={() => setPendingPage(null)}
          onConfirm={() => {
            setRunning(false);
            commitNavigation(pendingPage);
          }}
        />
      )}
    </div>
  );
}
