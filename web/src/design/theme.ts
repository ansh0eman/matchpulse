export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "turn-of-play.theme";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#130A1B" : "#F7F3FF",
  );
}

export function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

export function preferredTheme(): Theme {
  return readSavedTheme() ??
    (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
