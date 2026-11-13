import { BODIES } from "../../data/bodies";
import type { CelestialBody } from "../../data/types";
import { seededRandom } from "../../engine/math";

interface MissionPatchProps {
  seed: number;
  body: CelestialBody;
  codename: string;
  size?: number;
  difficulty?: string;
  className?: string;
}

export function MissionPatch({
  seed,
  body,
  codename,
  size = 160,
  difficulty,
  className = "",
}: MissionPatchProps) {
  const bodyInfo = BODIES[body];
  const random = seededRandom(seed);
  const stars = Array.from({ length: 12 }, () => ({
    x: 50 + (random() - 0.5) * 64,
    y: 46 + (random() - 0.5) * 50,
    r: 0.35 + random() * 0.85,
    opacity: 0.35 + random() * 0.55,
  }));
  const orbitRotation = -24 + random() * 48;
  const accent = bodyInfo.color;
  const uid = `patch-${seed.toString(36)}`;
  const initials = codename.slice(0, 3).toUpperCase();

  return (
    <svg
      className={`mission-patch ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${codename} mission patch`}
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#132132" />
          <stop offset="100%" stopColor="#05080e" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="55%" stopColor="#e8f4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id={`${uid}-planet`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="35%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#071019" stopOpacity="0.98" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="45.5" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="48" fill="#03060b" stroke={`url(#${uid}-rim)`} strokeWidth="1.4" />
      <g clipPath={`url(#${uid}-clip)`}>
        <circle cx="50" cy="50" r="45.5" fill={`url(#${uid}-bg)`} />
        <g opacity="0.28" stroke={accent} strokeWidth="0.35" fill="none">
          <circle cx="50" cy="50" r="38" strokeDasharray="1.4 3.6" />
          <circle cx="50" cy="50" r="31" strokeDasharray="0.6 4.2" />
        </g>

        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#e9f6ff"
            opacity={star.opacity}
          />
        ))}

        <g transform={`rotate(${orbitRotation} 50 50)`}>
          <ellipse
            cx="50"
            cy="50"
            rx="31"
            ry="12"
            fill="none"
            stroke={accent}
            strokeWidth="0.8"
            opacity="0.8"
          />
          <circle cx="79" cy="50" r="2.3" fill="#f5fbff" />
          <circle cx="79" cy="50" r="4.6" fill="none" stroke={accent} strokeWidth="0.5" opacity="0.55" />
        </g>

        <circle cx="48" cy="52" r="17" fill={`url(#${uid}-planet)`} />
        <path
          d="M34 47c6-4 15-5 22-2M35 58c7 3 17 3 23-2M43 36c-2 6-2 10-1 15"
          stroke="#041019"
          strokeWidth="0.8"
          opacity="0.45"
          fill="none"
        />
        <circle cx="48" cy="52" r="17" fill="none" stroke="#dff5ff" strokeWidth="0.35" opacity="0.3" />

        <path
          d="M17 82 Q50 92 83 82"
          fill="none"
          stroke={accent}
          strokeWidth="0.55"
          opacity="0.6"
        />
        <text
          x="50"
          y="87.5"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="5.2"
          letterSpacing="1.8"
          fill="#f0f8ff"
        >
          {codename.slice(0, 12).toUpperCase()}
        </text>
        <text
          x="50"
          y="93.5"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="2.9"
          letterSpacing="1.1"
          fill={accent}
          opacity="0.9"
        >
          {initials} · {difficulty ? difficulty.toUpperCase() : "MISSION"}
        </text>
        <path d="M28 20l1.2 3.2L32.5 24l-3.3 1.2L28 28.5l-1.2-3.3L23.5 24l3.3-0.8z" fill="#ffffff" opacity="0.85" />
      </g>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="#f4fbff" strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}
