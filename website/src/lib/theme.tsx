import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "lumora.theme";
const LEGACY_PREFS_KEY = "lumora.preferences.v1";
const THEME_FADE_MS = 500;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0a1a15" : "#f4f6ee");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function runThemeChange(apply: () => void) {
  if (prefersReducedMotion()) {
    apply();
    return;
  }

  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(apply);
    return;
  }

  const root = document.documentElement;
  root.classList.add("theme-changing");
  apply();
  window.setTimeout(() => root.classList.remove("theme-changing"), THEME_FADE_MS);
}

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_PREFS_KEY) || "null") as { theme?: Theme } | null;
    if (legacy?.theme === "dark" || legacy?.theme === "light") return legacy.theme;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* ignore */
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, []);

  const setTheme = (next: Theme) => {
    runThemeChange(() => {
      applyThemeClass(next);
      localStorage.setItem(THEME_KEY, next);
      setThemeState(next);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider is missing");
  return context;
}
