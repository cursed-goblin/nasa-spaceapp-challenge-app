import { BODIES } from "../data/bodies";
import { CATEGORY_META } from "../data/components";
import { DATASET } from "../data/dataset";
import type { MissionRun } from "../data/types";
import {
  budgetFor,
  calculateTotals,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  resolveSelection,
} from "./design";
import { evaluateDesign } from "./compatibility";
import {
  fmtArcsec,
  fmtData,
  fmtDate,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPercent,
  fmtPower,
} from "./format";

export function buildMissionReportMarkdown(run: MissionRun): string {
  const objective = getObjective(run.design.objectiveId);
  if (!objective) return "# TRADEOFF mission report\n\nMission objective unavailable.";
  const difficulty = getDifficulty(run.design.difficulty);
  const orbit = getOrbit(run.design.orbitId);
  const vehicle = getLaunchVehicle(run.design.launchVehicleId);
  const systems = resolveSelection(run.design.selection);
  const totals = calculateTotals(run.design.selection, difficulty, objective.body);
  const compatibility = evaluateDesign(run.design, { sandboxRelax: false });
  const budget = budgetFor(objective, difficulty);

  const lines: string[] = [
    `# TRADEOFF mission report — ${objective.codename}`,
    "",
    `**Mission:** ${objective.name}`,
    `**Target:** ${BODIES[objective.body].name}`,
    `**Difficulty:** ${difficulty.label}`,
    `**Created:** ${fmtDate(run.createdAt)}`,
    `**Result:** ${run.simulation.success ? "Mission success" : "Partial success"}`,
    `**Score:** ${run.score.total}${run.score.rankEligible ? " (ranked)" : " (unranked)"}`,
    "",
    "> Independent NASA Space Apps Challenge 2026 prototype. Generated from a provisional gameplay dataset. Not an official NASA product or flight-qualified analysis.",
    "",
    "## 1. Mission summary",
    "",
    objective.summary,
    "",
    `- Orbit: ${orbit?.name ?? "unassigned"} (${orbit?.altitudeLabel ?? "—"})`,
    `- Launch vehicle: ${vehicle?.name ?? "unassigned"} (${vehicle?.provider ?? "—"})`,
    `- Spacecraft mass: ${fmtMass(totals.massKg)}`,
    `- Programme cost: ${fmtMusd(run.costMusd)} of ${Number.isFinite(budget) ? fmtMusd(budget) : "unlimited"} budget`,
    `- Mission duration: ${fmtMonths(objective.requiredLifetimeMonths)}`,
    `- Concept maturity: a game adaptation of JPL CML 1–4; this result is illustrative.`,
    "",
    "## 2. Score breakdown",
    "",
    "| Category | Points |",
    "| --- | ---: |",
    `| Science | ${run.score.science.toFixed(1)} |`,
    `| Cost efficiency | ${run.score.cost.toFixed(1)} |`,
    `| Engineering margins | ${run.score.margins.toFixed(1)} |`,
    `| Success bonus | ${run.score.successBonus.toFixed(1)} |`,
    `| Difficulty multiplier | ×${run.score.difficultyMultiplier.toFixed(2)} |`,
    `| **Total** | **${run.score.total}** |`,
    "",
    "## 3. Science closure",
    "",
    `- Science returned: ${run.simulation.scienceReturn.toLocaleString("en-US")} / ${run.simulation.scienceRequired.toLocaleString("en-US")} points`,
    `- Data downlinked: ${fmtData(run.simulation.dataDownlinkedGb)}`,
    `- Data lost: ${fmtData(run.simulation.dataLostGb)}`,
    `- Downlink coverage: ${fmtPercent(run.simulation.downlinkCoveragePct, 1)}`,
    `- End reason: ${run.simulation.endReason}`,
    "",
    "Gaps and findings:",
    ...run.simulation.gaps.map((gap) => `- ${gap}`),
    "",
    "## 4. Engineering budgets",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Power generation | ${fmtPower(totals.powerGenW)} |`,
    `| Power load | ${fmtPower(totals.powerUseW)} |`,
    `| Average power margin | ${fmtPercent(run.simulation.averagePowerMarginPct, 1)} |`,
    `| Average data margin | ${fmtPercent(run.simulation.averageDataMarginPct, 1)} |`,
    `| Minimum battery state | ${fmtPercent(run.simulation.minBatteryPct, 1)} |`,
    `| Power deficit | ${run.simulation.powerDeficitHours.toFixed(1)} h |`,
    `| Pointing capability | ${fmtArcsec(totals.minPointingArcsec)} |`,
    `| Instrument slots | ${totals.instrumentSlotsUsed}/${totals.instrumentSlots} |`,
    "",
    "## 5. Mass equipment list",
    "",
    "| Subsystem | Component | Mass | Power | Cost |",
    "| --- | --- | ---: | ---: | ---: |",
    ...systems.all.map(
      (component) =>
        `| ${CATEGORY_META[component.category].short} | ${component.name} | ${fmtMass(component.massKg)} | ${fmtPower(component.powerW)} | ${fmtMusd(component.costMusd)} |`,
    ),
    `| **Total** | | **${fmtMass(totals.massKg)}** | **${fmtPower(totals.powerUseW)}** | **${fmtMusd(totals.spacecraftCostMusd)}** |`,
    "",
    "## 6. Compatibility findings",
    "",
    ...compatibility.checks.map(
      (check) => `- **${check.label}** [${check.status}] — ${check.detail}`,
    ),
    "",
    "## 7. Mission timeline",
    "",
    ...run.simulation.events.map(
      (event) => `- **D+${event.day}** [${event.severity}] ${event.title}: ${event.detail}`,
    ),
    "",
    "## 8. Flight heritage",
    "",
    `**${objective.analogue.name}** (${objective.analogue.agency})`,
    "",
    objective.analogue.note,
    "",
    objective.analogue.url,
    "",
    "## Data provenance",
    "",
    `${DATASET.summary} Dataset version ${DATASET.version} (${DATASET.status}), updated ${DATASET.updated}.`,
    "",
    "Trajectory analysis can be continued in NASA's General Mission Analysis Tool (GMAT R2026a, Apache 2.0); the game's orbit model is intentionally simplified.",
    "",
  ];

  return lines.join("\n");
}

export function buildMissionReportJson(run: MissionRun): string {
  return JSON.stringify(run, null, 2);
}
