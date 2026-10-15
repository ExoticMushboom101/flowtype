import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Keyboard,
  Moon,
  Settings2,
  Sun,
  UserRound,
  Command,
} from "lucide-react";
import type { Page, Theme } from "../types";
const links = [
  { page: "practice", title: "Practice", icon: Keyboard },
  { page: "stats", title: "Stats", icon: BarChart3 },
  { page: "words", title: "Words", icon: BookOpen },
  { page: "settings", title: "Settings", icon: Settings2 },
] as const;
/**
 * FlowType mark: a leaf whose midrib becomes a river, with two currents
 * flowing through it. Drawn with currentColor so every theme recolors it.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 26.5C5.5 14.5 12.8 5.5 26.5 5.5c0 13.7-9 21-21 21Z"
        fill="currentColor"
        opacity=".14"
      />
      <path
        d="M5.5 26.5C5.5 14.5 12.8 5.5 26.5 5.5c0 13.7-9 21-21 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 26.5c4.2-4 6.4-5 9.2-7.3 3-2.4 4.9-5.6 7.6-9.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.2 15.4c2.2.5 3.6 1.6 4.4 3.2M16.6 10.4c1.6.7 2.6 1.9 3.1 3.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}
export function Navbar({
  page,
  theme,
  navigate,
  toggleTheme,
  openProfile,
  openCommands,
}: {
  page: Page;
  theme: Theme;
  navigate: (page: Page) => void;
  toggleTheme: () => void;
  openProfile: () => void;
  openCommands: () => void;
}) {
  return (
    <header className="navbar">
      <a
        className="brand"
        href="#/practice"
        onClick={(e) => {
          e.preventDefault();
          navigate("practice");
        }}
        aria-label="FlowType home"
      >
        <Logo />
        <span>
          FlowType<span className="brand-dot">.</span>
        </span>
      </a>
      <nav aria-label="Main navigation">
        {links.map(({ page: route, title, icon: Icon }) => (
          <a
            key={route}
            href={`#/${route}`}
            aria-current={page === route ? "page" : undefined}
            className={page === route ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigate(route);
            }}
          >
            <Icon className="nav-link-icon" size={16} aria-hidden="true" />
            {title}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <span className="nav-note">A space to focus.</span>
        <button
          className="icon-button nav-command"
          onClick={openCommands}
          aria-label="Open command menu"
          title="Command menu (Esc)"
        >
          <Command size={17} />
        </button>
        <button
          className="icon-button theme-button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          title="Switch light / dark"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <span className="nav-separator" />
        <button
          className="avatar"
          onClick={openProfile}
          aria-label="Your local profile"
        >
          <UserRound size={17} />
        </button>
      </div>
    </header>
  );
}
/**
 * Decorative, local SVG scenery. Dark uses its own night painting rather than a
 * dimmed copy of the sunrise. If an image fails, the themed gradient behind it
 * remains, and failure is tracked per source so switching themes can recover.
 */
export function BackgroundLandscape({
  visible,
  theme,
}: {
  visible: boolean;
  theme: Theme;
}) {
  // BASE_URL keeps assets working when GitHub Pages serves the app from /<repo>/.
  const src = `${import.meta.env.BASE_URL}${theme === "dark" ? "landscape-night.svg" : "landscape.svg"}`;
  const [failed, setFailed] = useState<string[]>([]);
  if (!visible) return null;
  return (
    <div className="landscape" aria-hidden="true">
      {!failed.includes(src) && (
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          onError={() => setFailed((list) => [...list, src])}
        />
      )}
    </div>
  );
}
export function Footer({ openCommands }: { openCommands: () => void }) {
  return (
    <footer className="footer">
      <span className="footer-signature">
        <Logo size={15} /> A little practice. A little progress.
      </span>
      <span className="footer-center">Find your flow, not your hurry.</span>
      <button onClick={openCommands} className="footer-command">
        <Command size={12} /> Command menu <kbd>esc</kbd>
      </button>
    </footer>
  );
}
