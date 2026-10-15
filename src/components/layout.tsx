import {
  BarChart3,
  BookOpen,
  Keyboard,
  Moon,
  Settings2,
  Sun,
  UserRound,
  Waves,
  Command,
} from "lucide-react";
import type { Page, Theme } from "../types";
const links = [
  { page: "practice", title: "Practice", icon: Keyboard },
  { page: "stats", title: "Stats", icon: BarChart3 },
  { page: "words", title: "Words", icon: BookOpen },
  { page: "settings", title: "Settings", icon: Settings2 },
] as const;
export function Navbar({
  page,
  theme,
  navigate,
  toggleTheme,
  openProfile,
}: {
  page: Page;
  theme: Theme;
  navigate: (page: Page) => void;
  toggleTheme: () => void;
  openProfile: () => void;
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
        <Waves size={29} strokeWidth={1.8} />
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
            <Icon className="nav-link-icon" size={16} />
            {title}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <span className="nav-note">A space to focus.</span>
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
export function BackgroundLandscape({ visible }: { visible: boolean }) {
  return visible ? (
    <div className="landscape" aria-hidden="true">
      <img
        src={`${import.meta.env.BASE_URL}landscape.svg`}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  ) : null;
}
export function Footer({ openCommands }: { openCommands: () => void }) {
  return (
    <footer className="footer">
      <span className="footer-signature">
        <Waves size={14} /> A little practice. A little progress.
      </span>
      <span className="footer-center">Find your flow, not your hurry.</span>
      <button onClick={openCommands} className="footer-command">
        <Command size={12} /> Command menu <kbd>esc</kbd>
      </button>
    </footer>
  );
}
