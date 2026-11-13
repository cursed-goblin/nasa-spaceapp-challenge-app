import { clamp } from "../../engine/math";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  display?: string;
  hint?: string;
  tone?: "cyan" | "amber" | "green" | "red" | "ice";
  inverse?: boolean;
  compact?: boolean;
}

export function Meter({
  label,
  value,
  max,
  display,
  hint,
  tone = "cyan",
  inverse = false,
  compact = false,
}: MeterProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : value || 1;
  const ratio = clamp(value / safeMax, 0, 1);
  const pct = ratio * 100;
  const resolvedTone =
    tone === "cyan" && ratio > 1 ? "red" : tone;
  const width = inverse ? Math.max(4, 100 - pct) : pct;

  return (
    <div className={`meter meter--${resolvedTone} ${compact ? "meter--compact" : ""}`}>
      <div className="meter__top">
        <span className="meter__label">{label}</span>
        <span className="meter__value">{display ?? `${pct.toFixed(0)}%`}</span>
      </div>
      <div className="meter__track">
        <div className="meter__fill" style={{ width: `${width}%` }} />
        <div className="meter__ticks" aria-hidden="true" />
      </div>
      {hint ? <div className="meter__hint">{hint}</div> : null}
    </div>
  );
}
