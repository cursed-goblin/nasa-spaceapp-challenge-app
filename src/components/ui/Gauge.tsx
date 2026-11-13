interface GaugeProps {
  label: string;
  value: number;
  max?: number;
  display: string;
  sublabel?: string;
  tone?: "cyan" | "amber" | "green" | "red";
  size?: number;
}

export function Gauge({
  label,
  value,
  max = 100,
  display,
  sublabel,
  tone = "cyan",
  size = 128,
}: GaugeProps) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75;
  const dash = arc * ratio;

  return (
    <div className={`gauge gauge--${tone}`} style={{ width: size }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(120, 163, 200, 0.14)"
          strokeWidth="8"
          strokeDasharray={`${arc} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
          className="gauge__value-ring"
        />
        <circle cx="60" cy="60" r="38" fill="rgba(7, 13, 22, 0.74)" stroke="rgba(147, 183, 216, 0.08)" />
      </svg>
      <div className="gauge__content">
        <span className="gauge__value">{display}</span>
        <span className="gauge__label">{label}</span>
        {sublabel ? <span className="gauge__sub">{sublabel}</span> : null}
      </div>
    </div>
  );
}
