"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "matchcv.theme";
const CHANGE_EVENT = "matchcv:themechange";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * The script that runs before React does.
 *
 * <p>Injected into <head> by the root layout. Without it the page paints with
 * the default dark theme and then snaps to light for anyone who chose light --
 * a flash that is impossible to undo once it has happened, because by the time
 * a component could read localStorage the browser has already drawn a frame.
 *
 * <p>Written as a string rather than a module because it has to be inline and
 * synchronous. It is self-contained and reads nothing but its own storage key.
 */
export const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

/**
 * The applied theme lives on the <html> element, not in React state.
 *
 * <p>That is not an accident of implementation -- the inline script above sets
 * it before React exists, so the DOM is genuinely the source of truth and
 * React is the thing that has to catch up. `useSyncExternalStore` is built for
 * exactly this shape: it reads the live value on the client and the
 * server-rendered default during hydration, so there is no mismatch and no
 * effect writing state on mount.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Another tab changing the theme should move this one too.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/** What the server renders with, and what hydration starts from. */
function serverTheme(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing with storage denied. The theme still applies to this
      // page; it just will not be remembered.
    }
    // Tells every subscriber in this tab to re-read the attribute. The
    // storage event only fires in *other* tabs, so this is what updates the
    // one the person is actually looking at.
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
