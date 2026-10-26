import { useCallback, useEffect, useRef, useState } from "react";
import { applyTheme, preferredTheme, readSavedTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

export function useTheme() {
  const explicitPreference = useRef(readSavedTheme() !== null);
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = document.documentElement.dataset.theme;
    return initial === "dark" || initial === "light" ? initial : preferredTheme();
  });

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const followSystem = (event: MediaQueryListEvent) => {
      if (explicitPreference.current || readSavedTheme() !== null) return;
      const next: Theme = event.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    explicitPreference.current = true;
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The active session still changes theme when storage is unavailable.
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
}
