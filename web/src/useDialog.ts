import { useEffect } from "react";
/** Keep keyboard navigation and scroll inside the visible modal. */
export function useDialog(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const controls = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, summary, a[href]",
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = controls[0],
        last = controls.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          !dialog?.contains(document.activeElement))
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          !dialog?.contains(document.activeElement))
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
}
