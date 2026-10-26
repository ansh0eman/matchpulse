import { ClubChoices } from "../clubs/Clubs";
import { useRef } from "react";
import { ActivityIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { Scenario } from "../contracts";

export function SourceDisclosure({ scenario, provenance }: { scenario?: Scenario; provenance?: string }) {
  const details = useRef<HTMLDetailsElement>(null);
  return <details ref={details} className="synthetic-disclosure" onKeyDown={(event) => {
    if (event.key === "Escape" && details.current?.open) {
      event.stopPropagation(); details.current.open = false;
      details.current.querySelector("summary")?.focus();
    }
  }}>
    <summary><ActivityIcon size={16} aria-hidden="true" /><span>Synthetic replay</span><CaretRightIcon size={13} aria-hidden="true" /></summary>
    <div className="synthetic-disclosure-content">
      <strong>{scenario?.title ?? "Loading scenario"}</strong>
      <span>{scenario?.subtitle ?? "Source-scoped synthetic replay."}</span>
      <small>{provenance ?? (scenario ? `Match ${scenario.match_id}` : "Fixture metadata loads from the source catalog.")}</small>
      {scenario && <small>Source match {scenario.match_id}</small>}
      <ClubChoices />
    </div>
  </details>;
}
