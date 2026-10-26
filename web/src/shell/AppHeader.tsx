import type { MouseEventHandler, ReactNode } from "react";
import { PlayIcon } from "@phosphor-icons/react";
import type { Scenario } from "../contracts";
import type { Theme } from "../design/theme";
import { ThemeToggle } from "../design/ThemeToggle";
import { SourceDisclosure } from "./SourceDisclosure";

export function AppShell({ className, children, onClickCapture }: { className: string; children: ReactNode; onClickCapture: MouseEventHandler<HTMLDivElement> }) {
  return <div className={className} onClickCapture={onClickCapture} tabIndex={-1}>{children}</div>;
}
export function AppHeader(p: { mode: string; room: boolean; scenario?: Scenario; provenance?: string; theme: Theme; toggleTheme: () => void; navigate: (mode: string) => void; openStudio: () => void; openGuide: () => void }) {
  return <header className="app-header">
    <a href="/" className="brand" aria-label="Turn of Play home">Turn of Play</a>
    <nav aria-label="Studio navigation">
      <button data-dialog-fallback className={p.mode === "theatre" && !p.room ? "active" : ""} aria-current={p.mode === "theatre" && !p.room ? "page" : undefined} onClick={() => p.navigate("theatre")}>Matchday</button>
      <button className={p.mode === "studio" && !p.room ? "active" : ""} aria-current={p.mode === "studio" && !p.room ? "page" : undefined} onClick={() => p.navigate("studio")}>Investigate</button>
      <button className={p.room ? "active" : ""} aria-current={p.room ? "page" : undefined} onClick={p.openStudio}>Studio</button>
    </nav>
    <SourceDisclosure scenario={p.scenario} provenance={p.provenance} />
    <div className="header-right">
      <button className="outline-button guide-button" onClick={p.openGuide}><PlayIcon size={14} weight="fill" aria-hidden="true" />Guided demo</button>
      <ThemeToggle theme={p.theme} onToggle={p.toggleTheme} />
    </div>
  </header>;
}
