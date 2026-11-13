import type { ReactNode } from "react";

type Tone = "cyan" | "amber" | "green" | "red" | "muted" | "ice";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = "muted", dot = false, className = "" }: BadgeProps) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      {dot ? <span className="badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
