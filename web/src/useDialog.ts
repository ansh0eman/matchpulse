import { useEffect, useRef, type MouseEvent } from "react";

const usable = (element: HTMLElement | null): element is HTMLElement =>
  !!element?.isConnected && !element.matches(":disabled, [aria-disabled='true']") &&
  !element.closest("[inert]") && element.getClientRects().length > 0 &&
  getComputedStyle(element).visibility !== "hidden";

/** Keep keyboard navigation and scroll inside the visible modal. */
export function useDialog(open: boolean) {
  const invoker = useRef<HTMLElement | null>(null);
  // The app's capture phase runs before an opening handler and modal autofocus.
  // Keyboard activation dispatches the same click event as pointer activation.
  const rememberInvoker = (event: MouseEvent<HTMLElement>) => {
    const target = (event.target as Element).closest<HTMLElement>("button, a[href], input, select, summary");
    if (target && !target.closest('[role="dialog"]')) invoker.current = target;
  };
  useEffect(() => {
    if (!open) return;
    const previous = invoker.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
      const controls = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, summary, a[href]",
        ) ?? [],
      ).filter(usable);
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
      const fallback = document.querySelector<HTMLElement>("[data-dialog-fallback]");
      const destination = usable(previous) ? previous : usable(fallback)
        ? fallback : document.querySelector<HTMLElement>(".app-shell");
      if (usable(destination)) destination.focus();
    };
  }, [open]);
  return rememberInvoker;
}
