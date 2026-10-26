import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function Surface({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`surface ${className}`} {...props} />;
}
export function TactileButton({ variant = "secondary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" }) {
  return <button className={`tactile-button tactile-${variant} ${className}`} {...props} />;
}
export function StatusBanner({ kind = "info", className = "", ...props }: HTMLAttributes<HTMLDivElement> & { kind?: "info" | "success" | "warning" | "error" }) {
  return <div role="status" className={`status-banner status-${kind} ${className}`} {...props} />;
}
