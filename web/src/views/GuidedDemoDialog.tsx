import { ActivityIcon, ArrowRightIcon, CheckCircleIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import type { Theme } from "../design/theme";
import { ThemeToggle } from "../design/ThemeToggle";
import type { Scenario } from "../contracts";
export function GuidedDemoDialog({ scenarios, choose, goChapter, onClose, theme, toggleTheme }: { scenarios: Scenario[]; choose: (scenario: Scenario) => void; goChapter: (index: number) => void; onClose: () => void; theme: Theme; toggleTheme: () => void; }) { return (

        <div className="modal-scrim" onClick={() => onClose()}>
          <section
            className="guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close guided demo"
              onClick={() => onClose()}
              autoFocus
            >
              <XIcon size={23} />
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} className="modal-theme-toggle" />
            <span className="eyebrow">Choose a story</span>
            <h2 id="guide-title">
              Don’t just watch.
              <br />
              Interrogate the explanation.
            </h2>
            <p>
              Choose a source-isolated scenario, seek through the match, then
              open a sentence’s Proof Lens.
            </p>
            <button
              className="evidence-button start-story"
              onClick={() => goChapter(0)}
              disabled={!scenarios.length}
            >
              <PlayIcon size={20} />
              Watch the story · 76 seconds
              <ArrowRightIcon size={20} />
            </button>
            {scenarios.map((s) => (
              <button
                className="guide-scenario"
                key={s.id}
                onClick={() => choose(s)}
              >
                <div>
                  <strong>{s.title}</strong>
                  <small>{s.subtitle}</small>
                </div>
                <ArrowRightIcon size={22} />
              </button>
            ))}
          </section>
        </div>

); }
