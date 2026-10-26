(() => {
  let saved = null;
  try {
    const value = localStorage.getItem("turn-of-play.theme");
    if (value === "light" || value === "dark") saved = value;
  } catch {
    // Fall back to the operating-system preference.
  }
  const theme = saved || (matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#130A1B" : "#F7F3FF",
  );
})();
