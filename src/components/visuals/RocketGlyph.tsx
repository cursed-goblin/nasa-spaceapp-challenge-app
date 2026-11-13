import type { LaunchVehicleSpec } from "../../data/types";

interface RocketGlyphProps {
  vehicle: LaunchVehicleSpec;
  size?: number;
  selected?: boolean;
}

const CONFIG: Record<string, { coreW: number; coreH: number; boosters: number; boosterW: number; boosterH: number; fairingW: number; fairingH: number }> = {
  "lv-electron": { coreW: 18, coreH: 86, boosters: 0, boosterW: 0, boosterH: 0, fairingW: 20, fairingH: 24 },
  "lv-falcon9": { coreW: 24, coreH: 120, boosters: 0, boosterW: 0, boosterH: 0, fairingW: 28, fairingH: 28 },
  "lv-falconheavy": { coreW: 22, coreH: 120, boosters: 2, boosterW: 14, boosterH: 98, fairingW: 28, fairingH: 28 },
  "lv-ariane64": { coreW: 24, coreH: 132, boosters: 2, boosterW: 14, boosterH: 104, fairingW: 30, fairingH: 36 },
  "lv-atlasv": { coreW: 24, coreH: 132, boosters: 2, boosterW: 11, boosterH: 90, fairingW: 30, fairingH: 32 },
  "lv-sls": { coreW: 32, coreH: 146, boosters: 2, boosterW: 18, boosterH: 120, fairingW: 38, fairingH: 42 },
};

export function RocketGlyph({ vehicle, size = 130, selected = false }: RocketGlyphProps) {
  const config = CONFIG[vehicle.id] ?? CONFIG["lv-falcon9"];
  const { coreW, coreH, boosters, boosterW, boosterH, fairingW, fairingH } = config;
  const cx = 70;
  const baseY = 178;
  const coreTop = baseY - coreH;
  const fairingY = coreTop - fairingH;
  const gradientId = `rocket-${vehicle.id}`;

  return (
    <svg
      className="rocket-glyph"
      width={size}
      height={size * 1.55}
      viewBox="0 0 140 218"
      role="img"
      aria-label={`${vehicle.name} launch vehicle`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#293846" />
          <stop offset="35%" stopColor="#d8e2ea" />
          <stop offset="55%" stopColor="#91a4b5" />
          <stop offset="100%" stopColor="#1c2833" />
        </linearGradient>
        <linearGradient id={`${gradientId}-fairing`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a2834" />
          <stop offset="35%" stopColor="#c6d7e4" />
          <stop offset="100%" stopColor="#536678" />
        </linearGradient>
        {selected ? (
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}
      </defs>

      <g opacity="0.5" stroke="#7398b5" strokeWidth="0.5">
        <line x1="18" y1="178" x2="122" y2="178" />
        <line x1="18" y1="188" x2="122" y2="188" strokeDasharray="2 3" />
        <line x1="28" y1="178" x2="28" y2="130" strokeDasharray="2 4" opacity="0.55" />
        <line x1="112" y1="178" x2="112" y2="130" strokeDasharray="2 4" opacity="0.55" />
        <path d="M28 160h-8M28 146h-5M112 154h8M112 138h5" />
      </g>

      {boosters === 2 ? (
        <>
          <Booster x={cx - coreW / 2 - boosterW - 5} y={baseY - boosterH} width={boosterW} height={boosterH} id={`${gradientId}-b1`} />
          <Booster x={cx + coreW / 2 + 5} y={baseY - boosterH} width={boosterW} height={boosterH} id={`${gradientId}-b2`} />
        </>
      ) : null}

      <rect x={cx - coreW / 2} y={coreTop} width={coreW} height={coreH} rx={coreW / 2.8} fill={`url(#${gradientId})`} stroke={vehicle.accent} strokeOpacity="0.4" strokeWidth="0.6" />
      <rect x={cx - fairingW / 2} y={fairingY} width={fairingW} height={fairingH} rx={fairingW / 2.2} fill={`url(#${gradientId}-fairing)`} stroke={vehicle.accent} strokeOpacity="0.45" strokeWidth="0.6" />
      <path
        d={`M ${cx - fairingW / 2 + 2} ${fairingY + 2} Q ${cx} ${fairingY - 15} ${cx + fairingW / 2 - 2} ${fairingY + 2}`}
        fill={`url(#${gradientId}-fairing)`}
        stroke={vehicle.accent}
        strokeOpacity="0.5"
        strokeWidth="0.7"
      />
      <rect x={cx - fairingW / 2 + 3} y={fairingY + 4} width={fairingW - 6} height={fairingH - 8} rx="2" fill="none" stroke="rgba(5, 14, 22, 0.16)" strokeWidth="0.5" />
      <line x1={cx - fairingW / 2 + 2} y1={coreTop} x2={cx + fairingW / 2 - 2} y2={coreTop} stroke={vehicle.accent} strokeOpacity="0.5" strokeWidth="0.7" />
      <path d={`M ${cx - coreW / 2} ${baseY - 18} l -7 12 h 7 M ${cx + coreW / 2} ${baseY - 18} l 7 12 h -7`} fill="#4f6374" />
      <rect x={cx - coreW / 2 + 3} y={baseY - 10} width={coreW - 6} height="7" rx="2" fill="#101a23" stroke="#7e94a5" strokeWidth="0.5" />
      <text x={cx} y={baseY - coreH + 16} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="4" letterSpacing="1" fill="rgba(255,255,255,0.5)">
        {vehicle.provider.toUpperCase()}
      </text>
      <text x={cx} y="207" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5.2" letterSpacing="1.5" fill={vehicle.accent} opacity="0.9">
        {vehicle.name.toUpperCase()}
      </text>
      {selected ? (
        <g filter={`url(#${gradientId}-glow)`} opacity="0.9">
          <circle cx={cx} cy={fairingY + fairingH / 2} r="1" fill={vehicle.accent} />
        </g>
      ) : null}
    </svg>
  );
}

function Booster({ x, y, width, height, id }: { x: number; y: number; width: number; height: number; id: string }) {
  return (
    <>
      <rect x={x} y={y} width={width} height={height} rx={width / 2.5} fill="#334453" stroke="#8da0af" strokeOpacity="0.5" strokeWidth="0.5" />
      <rect x={x + 2} y={y + 5} width={width - 4} height={height - 18} rx="1" fill="none" stroke="#b7c8d5" strokeOpacity="0.18" strokeWidth="0.4" />
      <path d={`M ${x + width / 2 - 3} ${y} Q ${x + width / 2} ${y - 6} ${x + width / 2 + 3} ${y}`} fill="#91a4b3" opacity="0.65" />
      <path d={`M ${x} ${y + height - 14} l -4 8 h 4 M ${x + width} ${y + height - 14} l 4 8 h -4`} fill="#4f6374" />
      <rect x={x + 2} y={y + height - 7} width={width - 4} height="5" rx="1.5" fill="#101a23" />
      <circle cx={x + width / 2} cy={y + 10} r="1" fill={id.endsWith("b1") ? "#6ce7ff" : "#ffb05c"} opacity="0.8" />
    </>
  );
}
