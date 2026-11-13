import { useId } from "react";
import { BODIES } from "../../data/bodies";
import type { CelestialBody, OrbitSpec } from "../../data/types";
import { seededRandom } from "../../engine/math";

interface OrbitDiagramProps {
  body: CelestialBody;
  orbit?: OrbitSpec;
  className?: string;
  compact?: boolean;
  animated?: boolean;
}

function parseAltitude(label: string): number {
  const match = label.replaceAll(",", "").match(/([\d.]+)\s*km/);
  if (!match) return 800;
  return Number.parseFloat(match[1]) || 800;
}

export function OrbitDiagram({
  body,
  orbit,
  className = "",
  compact = false,
  animated = true,
}: OrbitDiagramProps) {
  const uid = useId().replaceAll(":", "");
  const info = BODIES[body];
  const altitude = orbit ? parseAltitude(orbit.altitudeLabel) : 550;
  const radius = Math.max(150, Math.min(258, 118 + Math.log10(altitude + 60) * 38));
  const ry = radius * 0.36;
  const rotation = body === "earth" ? -16 : body === "mars" ? 12 : -24;
  const path = `M ${300 - radius} 200 a ${radius} ${ry} 0 1,0 ${radius * 2} 0 a ${radius} ${ry} 0 1,0 ${-radius * 2} 0`;
  const random = seededRandom(4102 + radius);
  const stars = Array.from({ length: 34 }, () => ({
    x: 20 + random() * 560,
    y: 15 + random() * 370,
    r: 0.4 + random() * 1.1,
    o: 0.25 + random() * 0.65,
  }));

  return (
    <div className={`orbit-diagram ${compact ? "orbit-diagram--compact" : ""} ${className}`.trim()}>
      <svg viewBox="0 0 600 400" role="img" aria-label={`${orbit?.name ?? "Orbit"} around ${info.name}`}>
        <defs>
          <radialGradient id={`${uid}-planet`} cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="28%" stopColor={info.color} stopOpacity="0.98" />
            <stop offset="72%" stopColor={info.color} stopOpacity="0.55" />
            <stop offset="100%" stopColor="#020509" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={info.color} stopOpacity="0.3" />
            <stop offset="70%" stopColor={info.color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={info.color} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4c7fa8" />
            <stop offset="100%" stopColor="#b9f0ff" />
          </linearGradient>
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect width="600" height="400" fill="transparent" />
        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#dceeff"
            opacity={star.o}
          />
        ))}

        <g opacity="0.55" stroke="rgba(120, 170, 210, 0.25)" strokeWidth="0.7" fill="none">
          <circle cx="300" cy="200" r="185" strokeDasharray="2 8" />
          <circle cx="300" cy="200" r="224" strokeDasharray="1 10" />
          <path d="M52 200h38M510 200h38M300 28v30M300 342v30" />
        </g>

        <circle cx="300" cy="200" r={radius} fill={`url(#${uid}-glow)`} filter={`url(#${uid}-blur)`} />

        <g transform={`rotate(${rotation} 300 200)`}>
          <ellipse
            cx="300"
            cy="200"
            rx={radius}
            ry={ry}
            fill="none"
            stroke={info.color}
            strokeOpacity="0.28"
            strokeWidth="1.2"
            strokeDasharray="3 7"
          />
          <ellipse
            cx="300"
            cy="200"
            rx={radius * 0.76}
            ry={ry * 0.76}
            fill="none"
            stroke="rgba(154, 198, 228, 0.16)"
            strokeWidth="0.8"
            strokeDasharray="1 9"
          />
          <g>
            {animated ? (
              <animateMotion dur="16s" repeatCount="indefinite" path={path} rotate="auto" />
            ) : null}
            <g transform="translate(-8 -5)">
              <rect x="-9" y="-2" width="8" height="4" rx="0.8" fill={`url(#${uid}-panel)`} opacity="0.9" />
              <rect x="3" y="-2" width="8" height="4" rx="0.8" fill={`url(#${uid}-panel)`} opacity="0.9" />
              <rect x="-2.2" y="-2.6" width="5.4" height="5.2" rx="1" fill="#dff6ff" />
              <circle cx="0.5" cy="0" r="1.1" fill="#07131f" />
              <path d="M0.5 -6l2 3h-4z" fill="#ffb05c" />
            </g>
          </g>
        </g>

        <circle cx="300" cy="200" r="62" fill={`url(#${uid}-planet)`} />
        <ellipse cx="284" cy="185" rx="17" ry="9" fill="#ffffff" opacity="0.12" />
        <circle cx="300" cy="200" r="62" fill="none" stroke="#dff5ff" strokeOpacity="0.25" strokeWidth="0.7" />
        <circle cx="300" cy="200" r="72" fill="none" stroke={info.color} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="1 5" />

        <g fontFamily="'JetBrains Mono', monospace" fill="#90a9be" fontSize="8" letterSpacing="1.6">
          <text x="34" y="38">ORBITAL PROFILE // {info.shortName.toUpperCase()}</text>
          <text x="34" y="372" fill={info.color}>
            {orbit ? orbit.shortName : "SELECT TARGET ORBIT"}
          </text>
          <text x="566" y="38" textAnchor="end">
            {orbit ? `${orbit.coveragePct}% COVERAGE` : "NO ORBIT LOCKED"}
          </text>
          <text x="566" y="372" textAnchor="end">
            {orbit ? `${orbit.radiationKradPerYear} KRAD / YR` : "AWAITING DESIGN"}
          </text>
        </g>

        <g opacity="0.55">
          <circle cx="300" cy="200" r="94" fill="none" stroke={info.color} strokeWidth="0.6" strokeDasharray="18 6 3 6" />
          <circle cx="394" cy="200" r="2" fill={info.color} />
        </g>
      </svg>
      <div className="orbit-diagram__scan" aria-hidden="true" />
    </div>
  );
}
