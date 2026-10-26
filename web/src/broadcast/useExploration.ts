import { useCallback, useEffect, useState } from "react";

export type ExplorationStep = "watch" | "compare" | "explain";
type State = { scope: string; explored: ExplorationStep[] };

/** Ephemeral, match-and-incident-scoped UI exploration. It is not a score. */
export function useExploration(scope: string) {
  const [state, setState] = useState<State>({ scope, explored: [] });
  useEffect(() => {
    setState((current) => current.scope === scope ? current : { scope, explored: [] });
  }, [scope]);
  const mark = useCallback((step: ExplorationStep) => {
    setState((current) => {
      const scoped = current.scope === scope ? current : { scope, explored: [] };
      return scoped.explored.includes(step)
        ? scoped
        : { ...scoped, explored: [...scoped.explored, step] };
    });
  }, [scope]);
  const explored = state.scope === scope ? state.explored : [];
  return { explored, count: explored.length, mark };
}
