import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  aside?: ReactNode;
  tone?: "default" | "accent" | "warm";
  as?: "section" | "div" | "article";
}

export function Panel({
  children,
  className = "",
  eyebrow,
  title,
  aside,
  tone = "default",
  as: Element = "section",
}: PanelProps) {
  return (
    <Element className={`panel panel--${tone} ${className}`.trim()}>
      {eyebrow || title || aside ? (
        <header className="panel__header">
          <div>
            {eyebrow ? <div className="panel__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
          </div>
          {aside ? <div className="panel__aside">{aside}</div> : null}
        </header>
      ) : null}
      <div className="panel__body">{children}</div>
    </Element>
  );
}
