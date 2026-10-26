import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import type { Theme } from "./theme";

export function ThemeToggle({
  theme,
  onToggle,
  className,
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      className={`theme-toggle ${className ?? ""}`}
      type="button"
      aria-label={`Switch to ${next} theme`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${next} theme`}
      onClick={onToggle}
    >
      <Icon size={19} weight="bold" aria-hidden="true" />
      <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
