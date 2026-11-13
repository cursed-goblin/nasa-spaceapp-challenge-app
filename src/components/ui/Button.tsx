import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "warm" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailing?: ReactNode;
  full?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  trailing,
  full = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${full ? "btn--full" : ""} ${className}`.trim()}
      {...props}
    >
      {icon ? <span className="btn__icon">{icon}</span> : null}
      <span className="btn__label">{children}</span>
      {trailing ? <span className="btn__icon btn__icon--trailing">{trailing}</span> : null}
    </button>
  );
}
