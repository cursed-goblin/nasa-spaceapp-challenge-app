import { beforeAll, describe, expect, it } from "vitest";
import { BODIES } from "../data/bodies";
import { COMPONENTS, COMPONENTS_BY_ID, CATEGORY_ORDER } from "../data/components";
import type { MissionRun, SimulationResult } from "../data/types";
import { LAUNCH_VEHICLES } from "../data/launchVehicles";
import { OBJECTIVES } from "../data/objectives";
import { ORBITS } from "../data/orbits";
import { evaluateDesign, readinessScore } from "./compatibility";
import {
  calculateTotals,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  GROUND_SEGMENT_COST_MUSD,
  totalMissionCost,
} from "./design";
import { buildGmatHandoff, orbitElements } from "./gmat";
import { conceptMaturity } from "./maturity";
import { buildMissionReportJson, buildMissionReportMarkdown } from "./report";
import { createMissionRun } from "./scoring";
import { simulateMission } from "./simulation";
import { VALID_DESIGN, cloneValidDesign } from "../test/fixtures";

describe("reference dataset", () => {
  it("uses unique IDs and valid cross-references", () => {
    expect(new Set(COMPONENTS.map((item) => item.id)).size).toBe(COMPONENTS.length);
    expect(new Set(OBJECTIVES.map((item) => item.id)).size).toBe(OBJECTIVES.length);
    expect(new Set(ORBITS.map((item) => item.id)).size).toBe(ORBITS.length);
    expect(new Set(LAUNCH_VEHICLES.map((item) => item.id)).size).toBe(
      LAUNCH_VEHICLES.length,
    );

    for (const component of COMPONENTS) {
      expect(CATEGORY_ORDER).toContain(component.category);
      expect(BODIES.earth).toBeDefined();
    }

    for (const objective of OBJECTIVES) {
      expect(BODIES[objective.body]).toBeDefined();
      expect(objective.allowedOrbits.length).toBeGreaterThan(0);
      for (const orbitId of objective.allowedOrbits) {
        expect(ORBITS.find((orbit) => orbit.id === orbitId)?.body).toBe(
          objective.body,
        );
      }
      expect(objective.analogue.url).toMatch(/^https:\/\//);
    }

    for (const vehicle of LAUNCH_VEHICLES) {
      expect(Object.keys(vehicle.payloadKg).sort()).toEqual(
        ["geo", "interplanetary", "leo", "lunar", "sso"].sort(),
      );
    }
  });
});

describe("mission design math", () => {
  it("computes totals and programme cost for the reference design", () => {
    const objective = getObjective(VALID_DESIGN.objectiveId);
    expect(objective).toBeDefined();
    const totals = calculateTotals(
      VALID_DESIGN.selection,
      getDifficulty(VALID_DESIGN.difficulty),
      objective!.body,
    );
    const vehicle = getLaunchVehicle(VALID_DESIGN.launchVehicleId);

    expect(totals.componentCount).toBe(8);
    expect(totals.massKg).toBe(367);
    expect(totals.spacecraftCostMusd).toBe(186);
    expect(totals.instrumentSlotsUsed).toBe(2);
    expect(totals.instrumentSlots).toBe(4);
    expect(totalMissionCost(totals, vehicle)).toBe(
      totals.spacecraftCostMusd + vehicle!.costMusd + GROUND_SEGMENT_COST_MUSD,
    );
  });

  it("requires every mandatory subsystem and a payload", () => {
    const incomplete = cloneValidDesign();
    incomplete.selection = {
      ...incomplete.selection,
      structure: undefined,
      instruments: [],
    };
    const report = evaluateDesign(incomplete);
    expect(report.passed).toBe(false);
    expect(report.checks.find((check) => check.id === "subsystems")?.status).toBe(
      "fail",
    );
    expect(report.checks.find((check) => check.id === "instruments")?.status).toBe(
      "fail",
    );
  });

  it("warns when an instrument does not address the brief", () => {
    const offBrief = cloneValidDesign();
    offBrief.selection.instruments = [
      "inst-camera",
      "inst-mass-spec",
      "inst-magnetometer",
    ];
    const report = evaluateDesign(offBrief);
    expect(report.passed).toBe(true);
    expect(report.checks.find((check) => check.id === "payload-focus")?.status).toBe(
      "warn",
    );
  });

  it("relaxes failed checks in sandbox mode", () => {
    const sandbox = cloneValidDesign();
    sandbox.difficulty = "sandbox";
    sandbox.launchVehicleId = "lv-electron";
    const report = evaluateDesign(sandbox);
    expect(report.failures).toBe(0);
    expect(report.warnings).toBeGreaterThan(0);
    expect(report.checks.every((check) => check.status !== "fail")).toBe(true);
  });
});

describe("deterministic mission simulation", () => {
  let simulation: SimulationResult | null = null;
  let report = evaluateDesign(VALID_DESIGN);
  let run: MissionRun | null = null;

  beforeAll(() => {
    const objective = getObjective(VALID_DESIGN.objectiveId)!;
    const totals = calculateTotals(
      VALID_DESIGN.selection,
      getDifficulty(VALID_DESIGN.difficulty),
      objective.body,
    );
    report = evaluateDesign(VALID_DESIGN);
    simulation = simulateMission(VALID_DESIGN);
    run = createMissionRun(VALID_DESIGN, totals, simulation!, report);
  });

  it("meets the reference mission's science and engineering gates", () => {
    expect(simulation).not.toBeNull();
    expect(report.passed).toBe(true);
    expect(simulation!.success).toBe(true);
    expect(simulation!.scienceReturn).toBeGreaterThanOrEqual(
      simulation!.scienceRequired,
    );
    expect(simulation!.powerDeficitHours).toBe(0);
    expect(simulation!.endReason).toContain("Primary objective");
    expect(readinessScore(report)).toBe(100);
  });

  it("produces one daily sample per simulated day", () => {
    expect(simulation!.daily).toHaveLength(simulation!.durationDays);
    expect(simulation!.daily[0].day).toBe(1);
    expect(simulation!.daily.at(-1)?.day).toBe(simulation!.durationDays);
  });

  it("is deterministic for a given design", () => {
    const repeat = simulateMission(VALID_DESIGN);
    expect(repeat).toEqual(simulation);
  });

  it("creates a ranked run with a complete score breakdown", () => {
    expect(run).not.toBeNull();
    expect(run!.score.rankEligible).toBe(true);
    expect(run!.score.successBonus).toBe(10);
    expect(run!.score.total).toBeGreaterThan(90);
    expect(run!.costMusd).toBe(273);
    expect(run!.budgetMusd).toBe(340);
    expect(run!.score.science).toBeGreaterThan(0);
    expect(
      run!.score.science +
        run!.score.cost +
        run!.score.margins +
        run!.score.successBonus,
    ).toBeCloseTo(run!.score.total, 0);
  });

  it("reports harder maturity for a successful point design", () => {
    expect(conceptMaturity(VALID_DESIGN, report, simulation).level).toBe(4);
  });
});

describe("GMAT handoff", () => {
  it("generates a script for supported central bodies", () => {
    const objective = getObjective(VALID_DESIGN.objectiveId)!;
    const orbit = getOrbit(VALID_DESIGN.orbitId)!;
    const totals = calculateTotals(
      VALID_DESIGN.selection,
      getDifficulty(VALID_DESIGN.difficulty),
      objective.body,
    );
    const handoff = buildGmatHandoff({
      objective,
      orbit,
      totals,
      design: VALID_DESIGN,
      vehicle: getLaunchVehicle(VALID_DESIGN.launchVehicleId),
    });

    expect(handoff.supported).toBe(true);
    expect(handoff.format).toBe("script");
    expect(handoff.filename.endsWith("-gmat.script")).toBe(true);
    expect(handoff.content).toContain("Create Spacecraft TradeoffSC");
    expect(handoff.content).toContain("CentralBody = Earth");
    expect(handoff.content).toContain("SMA =");
    expect(orbitElements(orbit, "earth").semiMajorAxisKm).toBeGreaterThan(6378);
  });

  it("falls back to JSON for Europa where no stock central body exists", () => {
    const objective = getObjective("obj-europa-habitability")!;
    const orbit = getOrbit(objective.allowedOrbits[0])!;
    const totals = calculateTotals(
      VALID_DESIGN.selection,
      getDifficulty(VALID_DESIGN.difficulty),
      objective.body,
    );
    const handoff = buildGmatHandoff({
      objective,
      orbit,
      totals,
      design: { ...VALID_DESIGN, objectiveId: objective.id, orbitId: orbit.id },
    });

    expect(handoff.supported).toBe(false);
    expect(handoff.format).toBe("json");
    expect(handoff.filename.endsWith(".json")).toBe(true);
    expect(handoff.content).toContain('"centralBody": null');
  });
});

describe("mission report export", () => {
  it("renders Markdown with provenance, score and telemetry", () => {
    const objective = getObjective(VALID_DESIGN.objectiveId)!;
    const totals = calculateTotals(
      VALID_DESIGN.selection,
      getDifficulty(VALID_DESIGN.difficulty),
      objective.body,
    );
    const report = evaluateDesign(VALID_DESIGN);
    const simulation = simulateMission(VALID_DESIGN)!;
    const run = createMissionRun(VALID_DESIGN, totals, simulation, report)!;
    const markdown = buildMissionReportMarkdown(run);
    const json = JSON.parse(buildMissionReportJson(run)) as MissionRun;

    expect(markdown).toContain("# TRADEOFF mission report");
    expect(markdown.toLowerCase()).toContain("not an official nasa product");
    expect(markdown).toContain("## 5. Mass equipment list");
    expect(markdown.toLowerCase()).toContain("provisional");
    expect(json.id).toBe(run.id);
    expect(json.simulation.daily).toHaveLength(run.simulation.durationDays);
    expect(COMPONENTS_BY_ID[VALID_DESIGN.selection.structure!]).toBeDefined();
  });
});
