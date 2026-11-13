import type {
  CompatibilityReport,
  DesignState,
  LaunchVehicleSpec,
  MissionRun,
  ScoreBreakdown,
  SimulationResult,
  Totals,
} from "../data/types";
import {
  budgetFor,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  resolveSelection,
  totalMissionCost,
} from "./design";
import { clamp, hashString, round } from "./math";

export function scoreMission(
  design: DesignState,
  totals: Totals,
  simulation: SimulationResult,
  compatibility: CompatibilityReport,
): ScoreBreakdown {
  const objective = getObjective(design.objectiveId);
  const difficulty = getDifficulty(design.difficulty);
  if (!objective) {
    return {
      science: 0,
      cost: 0,
      margins: 0,
      successBonus: 0,
      difficultyMultiplier: difficulty.scoreMultiplier,
      total: 0,
      rankEligible: false,
    };
  }

  const budget = budgetFor(objective, difficulty);
  const vehicle = getLaunchVehicle(design.launchVehicleId);
  const missionCost = totalMissionCost(totals, vehicle);
  const orbit = getOrbit(design.orbitId);
  const systems = resolveSelection(design.selection);

  const scienceRatio = clamp(
    simulation.scienceReturn / Math.max(simulation.scienceRequired, 1),
    0,
    1.1,
  );
  const science = (scienceRatio / 1.1) * 55;

  const costEfficiency = Number.isFinite(budget) && budget > 0
    ? clamp((budget - missionCost) / (budget * 0.25), 0, 1)
    : 0;
  const cost = costEfficiency * 25;

  const massCapacity = vehicle && orbit ? vehicle.payloadKg[orbit.destination] : 0;
  const massMargin =
    massCapacity > 0 ? clamp((massCapacity - totals.massKg) / (massCapacity * 0.5), 0, 1) : 0;
  const powerMargin =
    totals.powerUseW > 0
      ? clamp((totals.powerGenW - totals.powerUseW) / (totals.powerUseW * 0.5), 0, 1)
      : 1;
  const downlink = orbit && systems.comms
    ? systems.comms.downlinkMbps * 3.6 * orbit.commsWindowsPerDay * orbit.commsWindowHours
    : 0;
  const dataMargin =
    totals.dataGbPerDay > 0
      ? clamp((downlink - totals.dataGbPerDay) / (totals.dataGbPerDay * 0.5), 0, 1)
      : 1;
  const margins = massMargin * 8 + powerMargin * 6 + dataMargin * 6;

  const successBonus = simulation.success && compatibility.passed ? 10 : 0;
  const raw = science + cost + margins + successBonus;
  const total = round(raw * difficulty.scoreMultiplier, 0);

  return {
    science: round(science, 1),
    cost: round(cost, 1),
    margins: round(margins, 1),
    successBonus,
    difficultyMultiplier: difficulty.scoreMultiplier,
    total,
    rankEligible: difficulty.ranked && simulation.success && compatibility.passed,
  };
}

export function createMissionRun(
  design: DesignState,
  totals: Totals,
  simulation: SimulationResult,
  compatibility: CompatibilityReport,
): MissionRun | null {
  const objective = getObjective(design.objectiveId);
  if (!objective) return null;
  const score = scoreMission(design, totals, simulation, compatibility);
  const seed = hashString(
    `${design.objectiveId}:${design.difficulty}:${design.orbitId ?? "none"}:${design.launchVehicleId ?? "none"}:${totals.massKg}:${score.total}`,
  );

  return {
    id: `run-${Date.now().toString(36)}-${seed.toString(36)}`,
    createdAt: new Date().toISOString(),
    objectiveId: design.objectiveId,
    objectiveName: objective.name,
    body: objective.body,
    difficulty: design.difficulty,
    design: cloneDesign(design),
    simulation,
    score,
    costMusd: totalMissionCost(totals, getLaunchVehicle(design.launchVehicleId)),
    budgetMusd: budgetFor(objective, getDifficulty(design.difficulty)),
    patchSeed: seed,
  };
}

export function describeVehicle(vehicle: LaunchVehicleSpec | undefined): string {
  return vehicle ? `${vehicle.name} · ${vehicle.provider}` : "No launch vehicle selected";
}

export function missionSuccessLabel(run: MissionRun): string {
  return run.simulation.success ? "Mission success" : "Partial success";
}

export function cloneDesign(design: DesignState): DesignState {
  return {
    ...design,
    selection: {
      ...design.selection,
      instruments: [...design.selection.instruments],
    },
  };
}
