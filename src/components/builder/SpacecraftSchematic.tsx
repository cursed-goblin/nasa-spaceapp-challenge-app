import { useMemo, useState } from "react";
import { CATEGORY_META } from "../../data/components";
import { BODIES } from "../../data/bodies";
import type { CategoryId, CelestialBody, SpacecraftComponent } from "../../data/types";
import type { SelectedSystems } from "../../engine/design";
import {
  fmtArcsec,
  fmtEnergy,
  fmtMass,
  fmtPower,
} from "../../engine/format";
import { seededRandom } from "../../engine/math";
import { componentSpecs } from "./componentSpecs";

interface SpacecraftSchematicProps {
  systems: SelectedSystems;
  body: CelestialBody;
  activeCategory: CategoryId;
  onSelectCategory: (category: CategoryId) => void;
}

interface Callout {
  category: CategoryId;
  label: string;
  value: string;
  x: number;
  y: number;
  anchor: "start" | "end";
  target: { x: number; y: number };
}

export function SpacecraftSchematic({
  systems,
  body,
  activeCategory,
  onSelectCategory,
}: SpacecraftSchematicProps) {
  const [hovered, setHovered] = useState<CategoryId | null>(null);
  const highlighted = hovered ?? activeCategory;

  const structure = systems.structure;
  const busW = structure ? (structure.id.includes("flagship") ? 176 : structure.id.includes("explorer") ? 138 : 104) : 118;
  const busH = structure ? (structure.id.includes("flagship") ? 112 : structure.id.includes("explorer") ? 92 : 76) : 82;
  const centerX = 380;
  const centerY = 208;
  const panelSpan = 108;
  const panelH = Math.max(38, busH * 0.48);
  const dishRadius = systems.comms
    ? Math.max(7, Math.min(36, systems.comms.antennaDiameterM * 14))
    : 9;
  const isRtg = systems.power?.kind === "rtg";
  const stars = useMemo(
    () => {
      const random = seededRandom(8821 + busW);
      return Array.from({ length: 42 }, () => ({
        x: 16 + random() * 728,
        y: 18 + random() * 384,
        r: 0.3 + random() * 1,
        o: 0.2 + random() * 0.55,
      }));
    },
    [busW],
  );

  const callouts: Callout[] = [
    {
      category: "power",
      label: "POWER",
      value: systems.power ? fmtPower(systems.power.generationW) : "UNASSIGNED",
      x: 22,
      y: 104,
      anchor: "start",
      target: { x: centerX - busW / 2 - panelSpan + 30, y: centerY },
    },
    {
      category: "comms",
      label: "COMMS",
      value: systems.comms ? `${systems.comms.band} · ${systems.comms.downlinkMbps} Mbps` : "UNASSIGNED",
      x: 630,
      y: 64,
      anchor: "end",
      target: { x: centerX, y: centerY - busH / 2 - dishRadius * 1.6 },
    },
    {
      category: "structure",
      label: "STRUCTURE",
      value: structure ? fmtMass(structure.massKg) : "UNASSIGNED",
      x: 22,
      y: 306,
      anchor: "start",
      target: { x: centerX - busW / 2 + 10, y: centerY + 18 },
    },
    {
      category: "instruments",
      label: "PAYLOAD",
      value: `${systems.instruments.length}/${structure?.instrumentSlots ?? 0} SLOTS`,
      x: 618,
      y: 356,
      anchor: "end",
      target: { x: centerX + 24, y: centerY + busH / 2 + 28 },
    },
    {
      category: "computer",
      label: "C&DH",
      value: systems.computer ? `${systems.computer.storageGb} GB` : "UNASSIGNED",
      x: 632,
      y: 176,
      anchor: "end",
      target: { x: centerX + busW / 2 - 18, y: centerY - 14 },
    },
    {
      category: "battery",
      label: "BATTERY",
      value: systems.battery ? fmtEnergy(systems.battery.capacityWh) : "UNASSIGNED",
      x: 104,
      y: 372,
      anchor: "start",
      target: { x: centerX - busW / 2 + 20, y: centerY + busH / 2 - 12 },
    },
    {
      category: "adcs",
      label: "ADCS",
      value: systems.adcs ? fmtArcsec(systems.adcs.pointingArcsec) : "UNASSIGNED",
      x: 620,
      y: 280,
      anchor: "end",
      target: { x: centerX + busW / 2 + 12, y: centerY + 30 },
    },
  ];

  const selectedInstruments = systems.instruments;
  const instrumentBoxes = Math.min(5, selectedInstruments.length);

  const inspectorComponent: SpacecraftComponent | undefined =
    highlighted === "instruments" ? undefined : systems[highlighted];

  const subtitle = (() => {
    if (highlighted === "instruments") {
      if (selectedInstruments.length === 0) return "No instruments selected";
      if (selectedInstruments.length === 1) return selectedInstruments[0].name;
      return `${selectedInstruments[0].name} +${selectedInstruments.length - 1}`;
    }
    const component = systems[highlighted];
    return component?.name ?? "No component selected";
  })();

  return (
    <div className="schematic">
      <div className="schematic__canvas">
        <svg viewBox="0 0 760 420" role="img" aria-label="Interactive spacecraft configuration schematic">
          <defs>
            <radialGradient id="schematic-bg" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="#0b1826" />
              <stop offset="100%" stopColor="#05080f" />
            </radialGradient>
            <linearGradient id="bus-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c7d6e5" />
              <stop offset="24%" stopColor="#7f95a9" />
              <stop offset="54%" stopColor="#4b6073" />
              <stop offset="78%" stopColor="#95aabd" />
              <stop offset="100%" stopColor="#3c4d5d" />
            </linearGradient>
            <linearGradient id="panel-cell" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a4d72" />
              <stop offset="50%" stopColor="#2b7fae" />
              <stop offset="100%" stopColor="#10283e" />
            </linearGradient>
            <linearGradient id="rtg-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5f6870" />
              <stop offset="50%" stopColor="#c4c9cc" />
              <stop offset="100%" stopColor="#474e55" />
            </linearGradient>
            <filter id="schematic-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="760" height="420" fill="url(#schematic-bg)" />
          {stars.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#d8eeff" opacity={star.o} />
          ))}
          <g opacity="0.12" stroke="#6fb6e8" strokeWidth="0.5">
            {Array.from({ length: 16 }, (_, index) => (
              <line key={`v-${index}`} x1={index * 50} y1="0" x2={index * 50} y2="420" />
            ))}
            {Array.from({ length: 9 }, (_, index) => (
              <line key={`h-${index}`} x1="0" y1={index * 52} x2="760" y2={index * 52} />
            ))}
          </g>
          <g opacity="0.35" stroke="#5ca6d6" fill="none">
            <ellipse cx="380" cy="208" rx="300" ry="139" strokeDasharray="2 8" strokeWidth="0.8" />
            <ellipse cx="380" cy="208" rx="252" ry="108" strokeDasharray="1 10" strokeWidth="0.6" opacity="0.6" />
          </g>

          <g fontFamily="'JetBrains Mono', monospace" fontSize="7.5" letterSpacing="1.7" fill="#7e9ab0">
            <text x="22" y="26">CONFIGURATION // {structure ? structure.name.toUpperCase() : "UNASSIGNED BUS"}</text>
            <text x="738" y="26" textAnchor="end">
              TARGET // {BODIES[body].name.toUpperCase()}
            </text>
          </g>

          <g transform={`translate(${centerX} ${centerY})`}>
            {/* Solar arrays / RTG */}
            {isRtg ? (
              <g
                className={`schematic-part ${highlighted === "power" ? "is-hot" : ""}`}
                onMouseEnter={() => setHovered("power")}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectCategory("power")}
                role="presentation"
              >
                <line x1={busW / 2} y1={-4} x2={busW / 2 + 28} y2={-4} stroke="#8ba0b2" strokeWidth="2" />
                <rect x={busW / 2 + 28} y="-18" width="22" height="28" rx="3" fill="url(#rtg-metal)" stroke="#d9e4ec" strokeWidth="0.6" />
                {Array.from({ length: 5 }, (_, index) => (
                  <line key={index} x1={busW / 2 + 28} y1={-14 + index * 5} x2={busW / 2 + 50} y2={-14 + index * 5} stroke="#303a42" strokeWidth="0.8" />
                ))}
                <rect x={busW / 2 + 28} y="-18" width="22" height="28" rx="3" fill="transparent" stroke={highlighted === "power" ? "#ffb05c" : "transparent"} strokeWidth="1.2" strokeDasharray="2 2" />
              </g>
            ) : (
              <>
                <SolarPanel side="left" busW={busW} span={panelSpan} height={panelH} selected={Boolean(systems.power)} hot={highlighted === "power"} onHover={() => setHovered("power")} onLeave={() => setHovered(null)} onClick={() => onSelectCategory("power")} />
                <SolarPanel side="right" busW={busW} span={panelSpan} height={panelH} selected={Boolean(systems.power)} hot={highlighted === "power"} onHover={() => setHovered("power")} onLeave={() => setHovered(null)} onClick={() => onSelectCategory("power")} />
              </>
            )}

            {/* Antenna */}
            <g
              className={`schematic-part ${highlighted === "comms" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("comms")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("comms")}
            >
              <line x1="0" y1={-busH / 2} x2="0" y2={-busH / 2 - 18 - dishRadius * 0.7} stroke={systems.comms ? "#b7c8d6" : "#4a5a68"} strokeWidth="1.4" strokeDasharray={systems.comms ? undefined : "2 3"} />
              <path
                d={`M ${-dishRadius} ${-busH / 2 - 18 - dishRadius * 0.7} Q 0 ${-busH / 2 - 38 - dishRadius} ${dishRadius} ${-busH / 2 - 18 - dishRadius * 0.7}`}
                fill={systems.comms ? "rgba(139, 214, 255, 0.16)" : "none"}
                stroke={systems.comms ? "#bfe9ff" : "#4a5a68"}
                strokeWidth="1.3"
                strokeDasharray={systems.comms ? undefined : "2 3"}
              />
              {systems.comms ? (
                <>
                  <line x1="0" y1={-busH / 2 - 18 - dishRadius * 0.7} x2="0" y2={-busH / 2 - 37 - dishRadius} stroke="#bfe9ff" strokeWidth="0.7" />
                  <circle cx="0" cy={-busH / 2 - 38 - dishRadius} r="1.8" fill="#ffb05c" />
                  <circle cx="0" cy={-busH / 2 - 38 - dishRadius} r="4" fill="none" stroke="#ffb05c" strokeWidth="0.6" opacity="0.55" />
                </>
              ) : null}
            </g>

            {/* Bus */}
            <g
              className={`schematic-part ${highlighted === "structure" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("structure")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("structure")}
            >
              <rect x={-busW / 2} y={-busH / 2} width={busW} height={busH} rx="5" fill={structure ? "url(#bus-metal)" : "rgba(93, 115, 133, 0.12)"} stroke={structure ? "#d7e6f2" : "#4a5a68"} strokeWidth="1" strokeDasharray={structure ? undefined : "4 4"} />
              <rect x={-busW / 2 + 8} y={-busH / 2 + 8} width={busW - 16} height={busH - 16} rx="2" fill="none" stroke="rgba(10, 22, 33, 0.35)" strokeWidth="0.7" />
              <line x1={-busW / 2} y1={-busH / 2 + 12} x2={busW / 2} y2={-busH / 2 + 12} stroke="rgba(255,255,255,0.24)" strokeWidth="0.6" />
              <line x1={-busW / 2} y1={busH / 2 - 15} x2={busW / 2} y2={busH / 2 - 15} stroke="rgba(5,13,20,0.4)" strokeWidth="0.6" />
              <text x="0" y={busH / 2 - 24} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5.8" letterSpacing="1.6" fill="rgba(10, 27, 40, 0.7)">
                {structure ? structure.name.toUpperCase() : "NO BUS"}
              </text>
              <circle cx={-busW / 2 + 19} cy={-busH / 2 + 24} r="5.5" fill="#0b2538" stroke="#6ce7ff" strokeWidth="0.6" />
              <circle cx={-busW / 2 + 19} cy={-busH / 2 + 24} r="2" fill="#ffb05c" />
              <rect x={busW / 2 - 38} y={-busH / 2 + 16} width="23" height="15" rx="1.5" fill="#1e3243" stroke="#7d95a8" strokeWidth="0.5" />
              {Array.from({ length: 3 }, (_, index) => (
                <line key={index} x1={busW / 2 - 36} y1={-busH / 2 + 20 + index * 3.5} x2={busW / 2 - 18} y2={-busH / 2 + 20 + index * 3.5} stroke="#8fbfe0" strokeWidth="0.5" opacity="0.7" />
              ))}
            </g>

            {/* Battery */}
            <g
              className={`schematic-part ${highlighted === "battery" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("battery")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("battery")}
            >
              <rect x={-busW / 2 + 12} y={busH / 2 - 30} width="27" height="14" rx="2" fill={systems.battery ? "#17332b" : "transparent"} stroke={systems.battery ? "#7bf1a8" : "#4a5a68"} strokeWidth="0.8" strokeDasharray={systems.battery ? undefined : "2 2"} />
              {systems.battery ? (
                <>
                  <rect x={-busW / 2 + 15} y={busH / 2 - 27} width="5" height="8" fill="#7bf1a8" opacity="0.8" />
                  <rect x={-busW / 2 + 22} y={busH / 2 - 27} width="5" height="8" fill="#7bf1a8" opacity="0.55" />
                  <rect x={-busW / 2 + 29} y={busH / 2 - 27} width="5" height="8" fill="#7bf1a8" opacity="0.35" />
                </>
              ) : null}
            </g>

            {/* Computer */}
            <g
              className={`schematic-part ${highlighted === "computer" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("computer")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("computer")}
            >
              <rect x={busW / 2 - 42} y={busH / 2 - 30} width="30" height="14" rx="2" fill={systems.computer ? "#1b2c45" : "transparent"} stroke={systems.computer ? "#9db7ff" : "#4a5a68"} strokeWidth="0.8" strokeDasharray={systems.computer ? undefined : "2 2"} />
              {systems.computer ? (
                <g stroke="#9db7ff" strokeWidth="0.5" opacity="0.8">
                  <line x1={busW / 2 - 38} y1={busH / 2 - 26} x2={busW / 2 - 16} y2={busH / 2 - 26} />
                  <line x1={busW / 2 - 38} y1={busH / 2 - 23} x2={busW / 2 - 16} y2={busH / 2 - 23} />
                  <line x1={busW / 2 - 38} y1={busH / 2 - 20} x2={busW / 2 - 16} y2={busH / 2 - 20} />
                </g>
              ) : null}
            </g>

            {/* ADCS */}
            <g
              className={`schematic-part ${highlighted === "adcs" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("adcs")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("adcs")}
            >
              {[
                [-busW / 2 - 5, -busH / 2 + 6],
                [busW / 2 + 5, -busH / 2 + 6],
                [-busW / 2 - 5, busH / 2 - 6],
                [busW / 2 + 5, busH / 2 - 6],
              ].map(([x, y], index) => (
                <g key={index}>
                  <circle cx={x} cy={y} r="3.2" fill={systems.adcs ? "#3b4d60" : "transparent"} stroke={systems.adcs ? "#ffb05c" : "#4a5a68"} strokeWidth="0.7" />
                  <path d={`M ${x - 2.5} ${y + 2.5} l -2 4 h 5 z`} fill={systems.adcs ? "#d9e6f1" : "#4a5a68"} opacity="0.8" />
                </g>
              ))}
              {systems.adcs ? (
                <g opacity="0.8">
                  <circle cx="0" cy="0" r="8" fill="none" stroke="#ffb05c" strokeWidth="0.6" strokeDasharray="1.5 2" />
                  <circle cx="0" cy="0" r="2.2" fill="#ffb05c" />
                </g>
              ) : null}
            </g>

            {/* Instruments */}
            <g
              className={`schematic-part ${highlighted === "instruments" ? "is-hot" : ""}`}
              onMouseEnter={() => setHovered("instruments")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCategory("instruments")}
            >
              <line x1={-Math.max(36, instrumentBoxes * 22)} y1={busH / 2 + 4} x2={Math.max(36, instrumentBoxes * 22)} y2={busH / 2 + 4} stroke="#849aab" strokeWidth="1" />
              {instrumentBoxes === 0 ? (
                <g>
                  <rect x="-34" y={busH / 2 + 10} width="68" height="24" rx="2" fill="transparent" stroke="#4a5a68" strokeDasharray="3 3" />
                  <text x="0" y={busH / 2 + 25} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5.5" fill="#5a6d7d" letterSpacing="1">
                    PAYLOAD BAY
                  </text>
                </g>
              ) : (
                selectedInstruments.slice(0, 5).map((instrument, index) => {
                  const boxW = 28;
                  const gap = 6;
                  const total = instrumentBoxes * boxW + (instrumentBoxes - 1) * gap;
                  const x = -total / 2 + index * (boxW + gap);
                  return (
                    <g key={instrument.id} transform={`translate(${x} ${busH / 2 + 10})`}>
                      <rect width={boxW} height="24" rx="2" fill="#16293a" stroke="#86a8c2" strokeWidth="0.6" />
                      <circle cx={boxW / 2} cy="9" r={instrument.measurements.includes("imaging") ? 4.2 : 3.4} fill="#07131f" stroke="#6ce7ff" strokeWidth="0.7" />
                      <circle cx={boxW / 2} cy="9" r="1.3" fill={instrument.measurements.includes("subsurface") ? "#ffb05c" : "#6ce7ff"} />
                      <line x1="5" y1="18" x2={boxW - 5} y2="18" stroke="#57748b" strokeWidth="0.7" />
                      <line x1="5" y1="20.5" x2={boxW - 9} y2="20.5" stroke="#57748b" strokeWidth="0.7" opacity="0.6" />
                    </g>
                  );
                })
              )}
            </g>
          </g>

          {/* Callouts */}
          {callouts.map((callout) => {
            const active = highlighted === callout.category;
            return (
              <g
                key={callout.category}
                className={`schematic-callout ${active ? "is-active" : ""}`}
                onMouseEnter={() => setHovered(callout.category)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectCategory(callout.category)}
              >
                <line x1={callout.x + (callout.anchor === "end" ? 0 : 0)} y1={callout.y - 4} x2={callout.target.x} y2={callout.target.y} stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 3" />
                <circle cx={callout.target.x} cy={callout.target.y} r="2" fill="currentColor" />
                <rect
                  x={callout.anchor === "start" ? callout.x - 2 : callout.x - 138}
                  y={callout.y - 22}
                  width="138"
                  height="27"
                  rx="2"
                  fill={active ? "rgba(108, 231, 255, 0.08)" : "rgba(4, 9, 15, 0.7)"}
                  stroke={active ? "rgba(108, 231, 255, 0.45)" : "rgba(116, 151, 177, 0.15)"}
                  strokeWidth="0.7"
                />
                <text
                  x={callout.anchor === "start" ? callout.x + 6 : callout.x - 10}
                  y={callout.y - 11}
                  textAnchor={callout.anchor}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="6"
                  letterSpacing="1.4"
                  fill={active ? "#6ce7ff" : "#7e9ab0"}
                >
                  {callout.label}
                </text>
                <text
                  x={callout.anchor === "start" ? callout.x + 6 : callout.x - 10}
                  y={callout.y - 2}
                  textAnchor={callout.anchor}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontSize="7.5"
                  fill={active ? "#e7f6ff" : "#b9cbd9"}
                >
                  {callout.value}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="schematic__scan" aria-hidden="true" />
        <div className="schematic__badge">
          <span className="status-dot" /> LIVE CONFIG
        </div>
      </div>

      <div className="schematic__inspector" onMouseLeave={() => setHovered(null)}>
        <div className="schematic__inspector-head">
          <span className="eyebrow">{CATEGORY_META[highlighted].label}</span>
          <strong>{subtitle}</strong>
          <span className="schematic__inspector-hint">hover the schematic · click a subsystem</span>
        </div>
        {inspectorComponent ? (
          <>
            <p>{inspectorComponent.description}</p>
            <div className="schematic__specs">
              {componentSpecs(inspectorComponent, body)
                .slice(0, 4)
                .map((spec) => (
                  <span key={spec.label}>
                    <em>{spec.label}</em>
                    <strong>{spec.value}</strong>
                  </span>
                ))}
            </div>
          </>
        ) : highlighted === "instruments" && selectedInstruments.length > 0 ? (
          <>
            <p className="schematic__inspector-copy">
              Together these instruments define what the mission can measure and how much data
              the downlink must move.
            </p>
            <div className="schematic__instrument-list">
              {selectedInstruments.map((instrument) => (
                <span key={instrument.id}>
                  <strong>{instrument.name}</strong>
                  <em>
                    {instrument.sciencePerDay.toLocaleString()} pts/day ·{" "}
                    {instrument.dataGbPerDay.toFixed(1)} Gb/day
                  </em>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="schematic__empty">
            No {CATEGORY_META[highlighted].label.toLowerCase()} selected. Pick an option below to
            bring this part of the spacecraft online.
          </p>
        )}
      </div>
    </div>
  );
}

interface SolarPanelProps {
  side: "left" | "right";
  busW: number;
  span: number;
  height: number;
  selected: boolean;
  hot: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function SolarPanel({
  side,
  busW,
  span,
  height,
  selected,
  hot,
  onHover,
  onLeave,
  onClick,
}: SolarPanelProps) {
  const direction = side === "left" ? -1 : 1;
  const startX = direction * (busW / 2 + 12);
  const endX = direction * (busW / 2 + span);
  const x = Math.min(startX, endX);
  const cellWidth = (span - 10) / 4;
  const cellHeight = (height - 8) / 2;

  return (
    <g
      className={`schematic-part ${hot ? "is-hot" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <line x1={startX} y1="0" x2={endX} y2="0" stroke={selected ? "#b8c9d8" : "#4a5a68"} strokeWidth="1.4" />
      <rect
        x={x}
        y={-height / 2}
        width={span}
        height={height}
        rx="2"
        fill={selected ? "url(#panel-cell)" : "transparent"}
        stroke={selected ? "#9fd9ff" : "#4a5a68"}
        strokeWidth="0.8"
        strokeDasharray={selected ? undefined : "3 3"}
        opacity={selected ? 0.95 : 0.6}
      />
      {selected ? (
        <g stroke="rgba(190, 235, 255, 0.35)" strokeWidth="0.45">
          {Array.from({ length: 5 }, (_, index) => (
            <line key={index} x1={x + 5 + index * cellWidth} y1={-height / 2 + 4} x2={x + 5 + index * cellWidth} y2={height / 2 - 4} />
          ))}
          <line x1={x + 5} y1="0" x2={x + span - 5} y2="0" />
          {Array.from({ length: 4 }, (_, index) =>
            Array.from({ length: 2 }, (_, row) => {
              const cellX = x + 7 + index * cellWidth;
              const cellY = -height / 2 + 6 + row * (cellHeight + 2);
              return (
                <rect
                  key={`${index}-${row}`}
                  x={cellX}
                  y={cellY}
                  width={cellWidth - 4}
                  height={cellHeight - 3}
                  fill="rgba(12, 40, 61, 0.6)"
                  stroke="rgba(143, 207, 243, 0.35)"
                  strokeWidth="0.4"
                />
              );
            }),
          )}
        </g>
      ) : null}
      {hot ? (
        <rect x={x - 2} y={-height / 2 - 2} width={span + 4} height={height + 4} fill="none" stroke="#ffb05c" strokeWidth="1" strokeDasharray="3 2" />
      ) : null}
    </g>
  );
}
