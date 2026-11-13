import { useId, useMemo } from "react";
import { BODIES } from "../../data/bodies";
import type { CelestialBody, OrbitSpec } from "../../data/types";
import { seededRandom } from "../../engine/math";

interface FlightTrackProps {
  body: CelestialBody;
  orbit: OrbitSpec;
  progress: number;
  day: number;
  alert?: boolean;
  complete?: boolean;
}

export function FlightTrack({ body, orbit, progress, day, alert = false, complete = false }: FlightTrackProps) {
  const uid = useId().replaceAll(":", "");
  const info = BODIES[body];
  const stars = useMemo(() => {
    const random = seededRandom(9384 + body.length * 31);
    return Array.from({ length: 58 }, () => ({
      x: 14 + random() * 692,
      y: 12 + random() * 406,
      r: 0.3 + random() * 1.1,
      o: 0.2 + random() * 0.65,
    }));
  }, [body.length]);

  const angle = progress * Math.PI * 2 - Math.PI / 2;
  const rx = 258;
  const ry = 96;
  const rotation = -14;
  const satelliteX = 360 + Math.cos(angle) * rx;
  const satelliteY = 220 + Math.sin(angle) * ry;
  const trailAngle = angle - 0.55;
  const trailX = 360 + Math.cos(trailAngle) * rx;
  const trailY = 220 + Math.sin(trailAngle) * ry;
  const tone = alert ? "#ff8f9d" : complete ? "#9fffc4" : "#6ce7ff";

  return (
    <div className="flight-track">
      <svg viewBox="0 0 720 440" role="img" aria-label={`Spacecraft in ${orbit.name} around ${info.name}`}>
        <defs>
          <radialGradient id={`${uid}-bg`} cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#07131f" />
            <stop offset="100%" stopColor="#03060b" />
          </radialGradient>
          <radialGradient id={`${uid}-planet`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f5fbff" stopOpacity="0.85" />
            <stop offset="26%" stopColor={info.color} />
            <stop offset="76%" stopColor={info.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#020509" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={info.color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={info.color} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-trail`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tone} stopOpacity="0" />
            <stop offset="100%" stopColor={tone} stopOpacity="0.8" />
          </linearGradient>
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id={`${uid}-soft`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <rect width="720" height="440" fill={`url(#${uid}-bg)`} />
        {stars.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#e3f3ff" opacity={star.o} />
        ))}

        <g opacity="0.13" stroke="#71b8e6" strokeWidth="0.5">
          {Array.from({ length: 15 }, (_, index) => (
            <line key={`v-${index}`} x1={index * 50} y1="0" x2={index * 50} y2="440" />
          ))}
          {Array.from({ length: 9 }, (_, index) => (
            <line key={`h-${index}`} x1="0" y1={index * 55} x2="720" y2={index * 55} />
          ))}
        </g>

        <circle cx="360" cy="220" r="182" fill={`url(#${uid}-glow)`} filter={`url(#${uid}-blur)`} />

        <g transform={`rotate(${rotation} 360 220)`}>
          <ellipse cx="360" cy="220" rx={rx} ry={ry} fill="none" stroke={tone} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 7" />
          <ellipse cx="360" cy="220" rx={rx * 0.72} ry={ry * 0.72} fill="none" stroke="rgba(145, 190, 221, 0.16)" strokeWidth="0.6" strokeDasharray="1 8" />
          <path
            d={`M ${trailX} ${trailY} Q ${360 + Math.cos(angle - 0.28) * rx} ${220 + Math.sin(angle - 0.28) * ry} ${satelliteX} ${satelliteY}`}
            fill="none"
            stroke={`url(#${uid}-trail)`}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </g>

        <circle cx="360" cy="220" r="78" fill={`url(#${uid}-planet)`} />
        <ellipse cx="338" cy="196" rx="22" ry="11" fill="#ffffff" opacity="0.11" />
        <circle cx="360" cy="220" r="78" fill="none" stroke="#f0fbff" strokeOpacity="0.24" strokeWidth="0.8" />
        <circle cx="360" cy="220" r="90" fill="none" stroke={info.color} strokeOpacity="0.2" strokeWidth="0.8" strokeDasharray="1 6" />
        {body === "earth" ? (
          <path d="M307 196c18-9 37-11 53-4 11 5 20 4 28 11-15 12-31 19-50 16-9-2-19-10-31-23Z" fill="#1f6f56" opacity="0.35" />
        ) : null}
        {body === "mars" ? (
          <path d="M314 239c14-7 31-8 46-4 9 3 15 1 24 5-12 10-29 15-47 12-8-1-15-6-23-13Z" fill="#55271b" opacity="0.32" />
        ) : null}

        <g transform={`translate(${satelliteX} ${satelliteY}) rotate(${(progress * 360 + 90) % 360})`}>
          <circle r="15" fill={tone} opacity="0.12" filter={`url(#${uid}-soft)`} />
          <rect x="-9" y="-3.5" width="9" height="7" rx="1" fill="#6b8da5" />
          <rect x="0" y="-3.5" width="9" height="7" rx="1" fill="#6b8da5" />
          <rect x="-3" y="-4.5" width="6" height="9" rx="1.4" fill="#e7f8ff" />
          <circle cx="0.5" cy="0" r="1.2" fill="#07131f" />
          <path d="M0 -9l2.8 4h-5.6z" fill={tone} />
        </g>

        <g fontFamily="'JetBrains Mono', monospace" fontSize="8" letterSpacing="1.5" fill="#8ba7bc">
          <text x="28" y="34">FLIGHT // {info.shortName.toUpperCase()} ORBIT</text>
          <text x="692" y="34" textAnchor="end" fill={tone}>
            {complete ? "MISSION COMPLETE" : alert ? "CONTINGENCY" : "NOMINAL"}
          </text>
          <text x="28" y="414">ORBIT {orbit.shortName.toUpperCase()}</text>
          <text x="692" y="414" textAnchor="end">DAY {day}</text>
        </g>

        <g opacity="0.55" stroke="#8eb6d2" strokeWidth="0.6" fill="none">
          <path d="M568 80h30v30" />
          <path d="M596 80h20M568 110v20" strokeDasharray="2 3" />
          <circle cx="604" cy="104" r="2" fill="#6ce7ff" />
        </g>

        <g transform="translate(96 342)" opacity="0.7">
          <circle r="4" fill="none" stroke={tone} strokeWidth="0.8" />
          <circle r="9" fill="none" stroke={tone} strokeWidth="0.5" opacity="0.5" />
          <path d="M-3 0h6M0-3v6" stroke={tone} strokeWidth="0.6" />
          <text x="16" y="3" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="#8ba7bc" letterSpacing="1">TRACKING</text>
        </g>
      </svg>
      <div className="flight-track__scan" aria-hidden="true" />
    </div>
  );
}
