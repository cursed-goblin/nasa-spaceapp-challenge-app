import type {
  CelestialBody,
  DesignState,
  LaunchVehicleSpec,
  ObjectiveSpec,
  OrbitSpec,
  Totals,
} from "../data/types";
import { DATASET } from "../data/dataset";
import { hashString } from "./math";

const BODY_RADIUS_KM: Record<CelestialBody, number> = {
  earth: 6378.137,
  moon: 1737.4,
  mars: 3389.5,
  venus: 6051.8,
  europa: 1560.8,
  asteroid: 0.25,
};

const GMAT_BODIES: Partial<
  Record<CelestialBody, { centralBody: string; coordinateSystem: string }>
> = {
  earth: { centralBody: "Earth", coordinateSystem: "EarthMJ2000Eq" },
  moon: { centralBody: "Luna", coordinateSystem: "LunaMJ2000Eq" },
  mars: { centralBody: "Mars", coordinateSystem: "MarsMJ2000Eq" },
  venus: { centralBody: "Venus", coordinateSystem: "VenusMJ2000Eq" },
};

interface GmatHandoffInput {
  objective: ObjectiveSpec;
  orbit: OrbitSpec;
  totals: Totals;
  design: DesignState;
  vehicle?: LaunchVehicleSpec;
}

export interface GmatHandoff {
  filename: string;
  content: string;
  format: "script" | "json";
  supported: boolean;
  note: string;
}

interface OrbitElements {
  periapsisKm: number;
  apoapsisKm: number;
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  raanDeg: number;
  argumentOfPeriapsisDeg: number;
  trueAnomalyDeg: number;
}

/**
 * Build a GMAT handoff for the selected orbit. GMAT is NASA's open-source
 * General Mission Analysis Tool (Apache 2.0). The generated script is a
 * starting point: the game uses a deliberately reduced orbit model, so the
 * elements must be re-validated in GMAT before any engineering use.
 *
 * For Europa and asteroid targets GMAT needs a custom central-body definition,
 * so the handoff falls back to a JSON element set.
 */
export function buildGmatHandoff(input: GmatHandoffInput): GmatHandoff {
  const { objective, orbit, totals, design, vehicle } = input;
  const body = objective.body;
  const gmatBody = GMAT_BODIES[body];
  const elements = orbitElements(orbit, body);
  const seed = hashString(`${objective.id}:${orbit.id}:${design.difficulty}`);
  const epoch = "01 Jan 2027 00:00:00.000";
  const mass = Math.max(1, Math.round(totals.massKg));
  const dragArea = Math.max(0.5, Math.round((totals.massKg / 300) * 10) / 10);
  const safeName = `${objective.codename}-${orbit.shortName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const payload = {
    schema: "tradeoff-gmat-handoff/v1",
    generatedAt: new Date().toISOString(),
    dataset: `${DATASET.version} (${DATASET.status})`,
    mission: {
      codename: objective.codename,
      name: objective.name,
      targetBody: body,
      difficulty: design.difficulty,
      orbit: orbit.name,
      orbitId: orbit.id,
      launchVehicle: vehicle?.name ?? null,
    },
    spacecraft: {
      dryMassKg: mass,
      dragAreaM2: dragArea,
      srpAreaM2: dragArea,
    },
    orbitElements: {
      centralBody: gmatBody?.centralBody ?? null,
      coordinateSystem: gmatBody?.coordinateSystem ?? null,
      epoch,
      ...elements,
    },
    gmatNotes: gmatBody
      ? "Import the .script into GMAT R2026a or later. The force model is intentionally simple; enable harmonics, drag and SRP for high-fidelity analysis."
      : "GMAT does not ship a standard central-body definition for this target. Use the element set with a custom central-body file or a local-frame transformation.",
  };

  if (!gmatBody) {
    return {
      filename: `tradeoff-${safeName}-gmat-handoff.json`,
      content: JSON.stringify(payload, null, 2),
      format: "json",
      supported: false,
      note: `GMAT has no bundled central body for ${body}. Downloaded the element set as JSON instead.`,
    };
  }

  const script = `%----------------------------------------------------------------
% TRADEOFF // GMAT trajectory handoff
% Mission: ${objective.codename} — ${objective.name}
% Target: ${body} · Orbit: ${orbit.name}
% Generated: ${new Date().toISOString()}
% Dataset: ${DATASET.version} (${DATASET.status}) — game-grade elements
%----------------------------------------------------------------
% This is a starting script for NASA's General Mission Analysis Tool.
% It is not a flight dynamics product. Re-validate the state, force model
% and coordinate frame before using it for any engineering analysis.
%
% GMAT R2026a · Apache License 2.0 · https://sourceforge.net/projects/gmat/
%----------------------------------------------------------------

Create Spacecraft TradeoffSC;
GMAT TradeoffSC.DateFormat = UTCGregorian;
GMAT TradeoffSC.Epoch = '${epoch}';
GMAT TradeoffSC.CoordinateSystem = ${gmatBody.coordinateSystem};
GMAT TradeoffSC.DisplayStateType = Keplerian;
GMAT TradeoffSC.SMA = ${elements.semiMajorAxisKm.toFixed(3)};
GMAT TradeoffSC.ECC = ${elements.eccentricity.toFixed(7)};
GMAT TradeoffSC.INC = ${elements.inclinationDeg.toFixed(4)};
GMAT TradeoffSC.RAAN = ${elements.raanDeg.toFixed(4)};
GMAT TradeoffSC.AOP = ${elements.argumentOfPeriapsisDeg.toFixed(4)};
GMAT TradeoffSC.TA = ${elements.trueAnomalyDeg.toFixed(4)};
GMAT TradeoffSC.DryMass = ${mass};
GMAT TradeoffSC.Cd = 2.2;
GMAT TradeoffSC.Cr = 1.8;
GMAT TradeoffSC.DragArea = ${dragArea.toFixed(1)};
GMAT TradeoffSC.SRPArea = ${dragArea.toFixed(1)};

Create ForceModel TradeoffFM;
GMAT TradeoffFM.CentralBody = ${gmatBody.centralBody};
GMAT TradeoffFM.PrimaryBodies = {${gmatBody.centralBody}};
GMAT TradeoffFM.Drag.AtmosphereModel = JacchiaRoberts;
GMAT TradeoffFM.SRP = On;

Create Propagator TradeoffProp;
GMAT TradeoffProp.FM = TradeoffFM;
GMAT TradeoffProp.Type = RungeKutta89;
GMAT TradeoffProp.InitialStepSize = 60;
GMAT TradeoffProp.Accuracy = 9.999999999999999e-12;
GMAT TradeoffProp.MinStep = 0.001;
GMAT TradeoffProp.MaxStep = 2700;

BeginMissionSequence;
Propagate TradeoffProp(TradeoffSC) {TradeoffSC.ElapsedSecs = 86400};

% Handoff metadata:
%   mission objective : ${objective.id}
%   orbit             : ${orbit.id} (${orbit.altitudeLabel})
%   launch vehicle    : ${vehicle?.name ?? "unassigned"}
%   dry mass          : ${mass} kg
%   game orbit period : ${orbit.periodHours} h
%   element seed      : ${seed.toString(36)}
%   notes             : ${gmatBody.centralBody} central body; verify JGM/gravity
%                       file availability in your GMAT installation.
%----------------------------------------------------------------
`;

  return {
    filename: `tradeoff-${safeName}-gmat.script`,
    content: script,
    format: "script",
    supported: true,
    note: `GMAT script generated for ${gmatBody.centralBody}. Validate the force model before use.`,
  };
}

export function orbitElements(orbit: OrbitSpec, body: CelestialBody): OrbitElements {
  const radius = BODY_RADIUS_KM[body];
  const { periapsis, apoapsis } = parseAltitudeRange(orbit);
  const semiMajorAxisKm = radius + (periapsis + apoapsis) / 2;
  const eccentricity =
    (apoapsis - periapsis) / (apoapsis + periapsis + 2 * radius);
  const seed = hashString(orbit.id);
  return {
    periapsisKm: radius + periapsis,
    apoapsisKm: radius + apoapsis,
    semiMajorAxisKm,
    eccentricity: Math.max(0, Math.min(0.95, eccentricity)),
    inclinationDeg: orbit.inclinationDeg,
    raanDeg: seed % 360,
    argumentOfPeriapsisDeg: (seed >>> 8) % 360,
    trueAnomalyDeg: (seed >>> 16) % 360,
  };
}

function parseAltitudeRange(orbit: OrbitSpec): { periapsis: number; apoapsis: number } {
  if (orbit.id === "moon-nrho") {
    return { periapsis: 3000, apoapsis: 71000 };
  }
  const cleaned = orbit.altitudeLabel.replaceAll(",", "");
  const numbers = [...cleaned.matchAll(/([\d.]+)\s*km/g)].map((match) =>
    Number.parseFloat(match[1]),
  );
  if (numbers.length >= 2) {
    return { periapsis: numbers[0], apoapsis: numbers[1] };
  }
  const altitude = numbers[0] ?? 500;
  return { periapsis: altitude, apoapsis: altitude };
}
