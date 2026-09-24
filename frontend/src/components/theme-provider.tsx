import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_FADE_MS = 500;

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function applyThemeClass(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
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

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "lockify-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    applyThemeClass(theme);
  }, []);

  const value = {
    theme,
    setTheme: (next: Theme) => {
      runThemeChange(() => {
        applyThemeClass(next);
        localStorage.setItem(storageKey, next);
        setThemeState(next);
      });
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
