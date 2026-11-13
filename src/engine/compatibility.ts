import { BODIES } from "../data/bodies";
import { MEASUREMENTS } from "../data/measurements";
import type {
  CompatibilityReport,
  DesignState,
  FeasibilityCheck,
} from "../data/types";
import {
  budgetFor,
  calculateTotals,
  downlinkPerDay,
  effectivePointingRequirement,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  limitingComponent,
  missingCategories,
  resolveSelection,
  scienceTargetFor,
  totalMissionCost,
} from "./design";
import {
  fmtArcsec,
  fmtData,
  fmtDataRate,
  fmtEnergy,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPercent,
  fmtPower,
} from "./format";
import { clamp, round } from "./math";

function check(
  id: string,
  label: string,
  status: FeasibilityCheck["status"],
  detail: string,
  requirement?: string,
  actual?: string,
): FeasibilityCheck {
  return { id, label, status, detail, requirement, actual };
}

export function evaluateDesign(
  design: DesignState,
  options: { sandboxRelax?: boolean } = {},
): CompatibilityReport {
  const objective = getObjective(design.objectiveId);
  const difficulty = getDifficulty(design.difficulty);
  const orbit = getOrbit(design.orbitId);
  const vehicle = getLaunchVehicle(design.launchVehicleId);
  const systems = resolveSelection(design.selection);
  const totals = objective
    ? calculateTotals(design.selection, difficulty, objective.body)
    : calculateTotals(design.selection, difficulty, "earth");

  const checks: FeasibilityCheck[] = [];

  if (!objective) {
    checks.push(
      check("objective", "Mission objective", "fail", "No mission objective has been selected."),
    );
    return finalise(checks);
  }

  const missing = missingCategories(systems);
  checks.push(
    check(
      "subsystems",
      "Required subsystems",
      missing.length === 0 ? "pass" : "fail",
      missing.length === 0
        ? "All six mandatory subsystem categories are installed."
        : `Install the missing subsystems: ${missing.join(", ")}.`,
      "Structure, power, battery, comms, avionics, ADCS",
      missing.length === 0 ? "Complete" : `${missing.length} missing`,
    ),
  );

  checks.push(
    check(
      "instruments",
      "Science payload",
      systems.instruments.length > 0 ? "pass" : "fail",
      systems.instruments.length > 0
        ? `${systems.instruments.length} instrument${systems.instruments.length > 1 ? "s" : ""} installed.`
        : "At least one science instrument is required.",
      "≥ 1 instrument",
      `${systems.instruments.length} installed`,
    ),
  );

  if (systems.structure) {
    const used = systems.instruments.length;
    checks.push(
      check(
        "slots",
        "Instrument slots",
        used <= systems.structure.instrumentSlots ? "pass" : "fail",
        used <= systems.structure.instrumentSlots
          ? `${used} of ${systems.structure.instrumentSlots} slots occupied on the ${systems.structure.name}.`
          : `${systems.structure.name} has only ${systems.structure.instrumentSlots} slots for ${used} instruments.`,
        `${systems.structure.instrumentSlots} slots`,
        `${used} used`,
      ),
    );
  }

  const coveredTags = new Set(
    systems.instruments.flatMap((instrument) => instrument.measurements),
  );
  const missingTags = objective.measurementsRequired.filter((tag) => !coveredTags.has(tag));
  checks.push(
    check(
      "measurements",
      "Required measurements",
      missingTags.length === 0 ? "pass" : "fail",
      missingTags.length === 0
        ? "The instrument suite covers every required measurement."
        : `No selected instrument covers: ${missingTags
            .map((tag) => MEASUREMENTS[tag].label)
            .join(", ")}.`,
      objective.measurementsRequired.map((tag) => MEASUREMENTS[tag].short).join(" · "),
      missingTags.length === 0 ? "Complete" : `Missing ${missingTags.length}`,
    ),
  );

  if (systems.instruments.length > 0) {
    const offBrief = systems.instruments.filter(
      (instrument) =>
        !instrument.measurements.some((tag) =>
          objective.measurementsRequired.includes(tag),
        ),
    );
    checks.push(
      check(
        "payload-focus",
        "Payload relevance",
        offBrief.length === 0 ? "pass" : "warn",
        offBrief.length === 0
          ? "Every instrument contributes directly to a required measurement."
          : `${offBrief.map((instrument) => instrument.name).join(", ")} do not address a required measurement. Their mass, power and data are overhead.`,
        "Every instrument contributes to the brief",
        offBrief.length === 0 ? "Focused" : `${offBrief.length} off-brief`,
      ),
    );
  }

  if (!orbit) {
    checks.push(
      check(
        "orbit",
        "Orbit selection",
        "fail",
        "Select an orbit around the target body.",
      ),
    );
  } else {
    const allowed = objective.allowedOrbits.includes(orbit.id);
    checks.push(
      check(
        "orbit",
        "Target-body orbit",
        allowed ? "pass" : "fail",
        allowed
          ? `${orbit.name} is a valid orbit for ${BODIES[objective.body].name}.`
          : `${orbit.name} is not a valid orbit for this mission.`,
        BODIES[objective.body].name,
        orbit.name,
      ),
    );

    checks.push(
      check(
        "coverage",
        "Surface coverage",
        orbit.coveragePct >= objective.minCoveragePct ? "pass" : "fail",
        orbit.coveragePct >= objective.minCoveragePct
          ? `${orbit.coveragePct}% coverage meets the ${objective.minCoveragePct}% requirement.`
          : `${orbit.name} covers ${orbit.coveragePct}% of the target, short of the ${objective.minCoveragePct}% requirement.`,
        `${objective.minCoveragePct}%`,
        `${orbit.coveragePct}%`,
      ),
    );
  }

  if (vehicle && orbit) {
    const capacity = vehicle.payloadKg[orbit.destination];
    if (capacity <= 0) {
      checks.push(
        check(
          "mass",
          "Launch capacity",
          "fail",
          `${vehicle.name} cannot deliver a payload to ${orbit.destination === "lunar" ? "lunar transfer" : orbit.destination.toUpperCase()} orbit.`,
          "Positive payload capacity",
          "0 kg",
        ),
      );
    } else {
      const marginPct = ((capacity - totals.massKg) / capacity) * 100;
      const fits = totals.massKg <= capacity;
      checks.push(
        check(
          "mass",
          "Launch capacity",
          fits ? "pass" : "fail",
          fits
            ? `${fmtMass(totals.massKg)} spacecraft fits within ${fmtMass(capacity)} of ${orbit.destination === "lunar" ? "lunar transfer" : orbit.destination.toUpperCase()} capacity.`
            : `${fmtMass(totals.massKg)} exceeds the ${fmtMass(capacity)} capacity of ${vehicle.name}.`,
          `${fmtMass(capacity)} capacity`,
          `${fmtMass(totals.massKg)} (${fmtPercent(clamp(marginPct, -999, 100))} margin)`,
        ),
      );
    }
  } else if (!vehicle) {
    checks.push(
      check("mass", "Launch vehicle", "fail", "Select a launch vehicle."),
    );
  }

  if (systems.structure && systems.comms) {
    const envelopeDiameter = Math.max(
      systems.structure.diameterM,
      systems.comms.antennaDiameterM + 0.2,
    );
    const envelopeHeight =
      systems.structure.heightM + systems.comms.antennaDiameterM * 0.35 + 0.4;
    if (vehicle) {
      const diameterFits = envelopeDiameter <= vehicle.fairingDiameterM;
      const heightFits = envelopeHeight <= vehicle.fairingHeightM;
      const fits = diameterFits && heightFits;
      checks.push(
        check(
          "fairing",
          "Fairing envelope",
          fits ? "pass" : "fail",
          fits
            ? `Stowed envelope fits inside the ${vehicle.name} fairing.`
            : `Stowed spacecraft does not fit the ${vehicle.name} fairing: ${[
                !diameterFits ? `diameter ${envelopeDiameter.toFixed(2)} m > ${vehicle.fairingDiameterM} m` : "",
                !heightFits ? `height ${envelopeHeight.toFixed(2)} m > ${vehicle.fairingHeightM} m` : "",
              ]
                .filter(Boolean)
                .join(", ")}.`,
          `${vehicle.fairingDiameterM} m × ${vehicle.fairingHeightM} m`,
          `${envelopeDiameter.toFixed(2)} m × ${envelopeHeight.toFixed(2)} m`,
        ),
      );
    }
  } else if (!vehicle) {
    checks.push(
      check("fairing", "Fairing envelope", "info", "Select a launch vehicle to check the stowed envelope."),
    );
  }

  const requiredPower = totals.powerUseW * (1 + difficulty.powerMargin);
  const powerFits = totals.powerGenW >= requiredPower && totals.powerGenW > 0;
  checks.push(
    check(
      "power",
      "Power margin",
      totals.powerUseW === 0
        ? "info"
        : powerFits
          ? "pass"
          : "fail",
      totals.powerUseW === 0
        ? "No power-consuming components selected yet."
        : powerFits
          ? `${fmtPower(totals.powerGenW)} generation covers ${fmtPower(requiredPower)} required at ${fmtPercent(difficulty.powerMargin * 100)} margin.`
          : `Generation is ${fmtPower(totals.powerGenW)} against ${fmtPower(requiredPower)} required, including the ${fmtPercent(difficulty.powerMargin * 100)} margin.`,
      `${fmtPower(requiredPower)}`,
      `${fmtPower(totals.powerGenW)} generation`,
    ),
  );

  if (systems.battery && orbit) {
    const reserveFactor = 1.1;
    const requiredEnergy = totals.powerUseW * orbit.eclipseHours * reserveFactor;
    const batteryFits = totals.usableBatteryWh >= requiredEnergy;
    checks.push(
      check(
        "battery",
        "Eclipse energy",
        batteryFits ? "pass" : "fail",
        batteryFits
          ? `${fmtEnergy(totals.usableBatteryWh)} usable storage covers a ${orbit.eclipseHours.toFixed(1)} h eclipse at ${fmtPower(totals.powerUseW)} load.`
          : `${fmtEnergy(totals.usableBatteryWh)} usable storage cannot cover ${fmtEnergy(requiredEnergy)} needed through a ${orbit.eclipseHours.toFixed(1)} h eclipse.`,
        `${fmtEnergy(requiredEnergy)}`,
        `${fmtEnergy(totals.usableBatteryWh)} usable`,
      ),
    );
  } else if (!orbit) {
    checks.push(
      check("battery", "Eclipse energy", "info", "Select an orbit to check the eclipse energy budget."),
    );
  }

  if (systems.comms && orbit) {
    const capacity = downlinkPerDay(systems.comms, orbit);
    const requiredData = totals.dataGbPerDay * (1 + difficulty.dataMargin);
    const dataFits = capacity >= requiredData && totals.dataGbPerDay > 0;
    checks.push(
      check(
        "downlink",
        "Downlink capacity",
        totals.dataGbPerDay === 0
          ? "info"
          : dataFits
            ? "pass"
            : "fail",
        totals.dataGbPerDay === 0
          ? "No data-generating instruments selected yet."
          : dataFits
            ? `${fmtDataRate(capacity)} downlink covers ${fmtDataRate(requiredData)} required with the ${fmtPercent(difficulty.dataMargin * 100)} margin.`
            : `${fmtDataRate(capacity)} downlink cannot carry ${fmtDataRate(requiredData)} of instrument data, including the ${fmtPercent(difficulty.dataMargin * 100)} margin.`,
        `${fmtDataRate(requiredData)}`,
        `${fmtDataRate(capacity)}`,
      ),
    );

    if (totals.dataGbPerDay > 0) {
      const gapHours = 24 / orbit.commsWindowsPerDay - orbit.commsWindowHours;
      const bufferNeedGb = (totals.dataGbPerDay / 24) * Math.max(gapHours, 0);
      const bufferFits = totals.storageGb >= bufferNeedGb;
      checks.push(
        check(
          "storage",
          "Data buffer",
          bufferFits ? "pass" : "warn",
          bufferFits
            ? `${fmtData(totals.storageGb)} storage buffers the ${fmtData(bufferNeedGb)} expected between comms passes.`
            : `${fmtData(totals.storageGb)} storage may overflow between passes; expect data loss until the next downlink.`,
          `${fmtData(bufferNeedGb)} between passes`,
          `${fmtData(totals.storageGb)} storage`,
        ),
      );
    }
  }

  if (systems.adcs) {
    const requirement = effectivePointingRequirement(objective, systems.instruments);
    const pointingFits = systems.adcs.pointingArcsec <= requirement;
    checks.push(
      check(
        "pointing",
        "Pointing accuracy",
        pointingFits ? "pass" : "fail",
        pointingFits
          ? `${fmtArcsec(systems.adcs.pointingArcsec)} pointing meets the ${fmtArcsec(requirement)} requirement.`
          : `${systems.adcs.name} points to ${fmtArcsec(systems.adcs.pointingArcsec)}, coarser than the ${fmtArcsec(requirement)} requirement.`,
        `≤ ${fmtArcsec(requirement)}`,
        fmtArcsec(systems.adcs.pointingArcsec),
      ),
    );
  }

  if (orbit) {
    const limiting = limitingComponent(systems, orbit);
    const lifetimeFits =
      limiting.lifetimeMonths >= objective.requiredLifetimeMonths;
    checks.push(
      check(
        "lifetime",
        "Mission lifetime",
        limiting.component && lifetimeFits ? "pass" : "fail",
        limiting.component
          ? lifespanDetail(
              limiting.component.name,
              limiting.component.lifetimeMonths,
              limiting.lifetimeMonths,
              objective.requiredLifetimeMonths,
            )
          : "Select spacecraft components to estimate mission lifetime.",
        fmtMonths(objective.requiredLifetimeMonths),
        limiting.component ? fmtMonths(limiting.lifetimeMonths) : "—",
      ),
    );

    if (systems.adcs) {
      const requiredDeltaV =
        orbit.stationKeepingMpsPerYear * (objective.requiredLifetimeMonths / 12);
      const dvFits = systems.adcs.deltaVms >= requiredDeltaV;
      checks.push(
        check(
          "delta-v",
          "Station-keeping delta-v",
          dvFits ? "pass" : "fail",
          dvFits
            ? `${systems.adcs.deltaVms} m/s delta-v covers the ${requiredDeltaV.toFixed(0)} m/s required over ${fmtMonths(objective.requiredLifetimeMonths)}.`
            : `${systems.adcs.deltaVms} m/s delta-v is short of the ${requiredDeltaV.toFixed(0)} m/s needed for this orbit and lifetime.`,
          `${requiredDeltaV.toFixed(0)} m/s`,
          `${systems.adcs.deltaVms} m/s`,
        ),
      );
    }
  }

  const budget = budgetFor(objective, difficulty);
  const missionCost = totalMissionCost(totals, vehicle);
  const budgetFits = missionCost <= budget || !Number.isFinite(budget);
  checks.push(
    check(
      "budget",
      "Mission budget",
      budgetFits ? "pass" : "fail",
      !Number.isFinite(budget)
        ? "Sandbox mode: budget constraints are disabled."
        : budgetFits
          ? `${fmtMusd(missionCost)} of ${fmtMusd(budget)} committed, including launch and ground segment.`
          : `${fmtMusd(missionCost)} exceeds the ${fmtMusd(budget)} budget by ${fmtMusd(missionCost - budget)}.`,
      Number.isFinite(budget) ? fmtMusd(budget) : "Unlimited",
      `${fmtMusd(missionCost)} committed`,
    ),
  );

  const target = scienceTargetFor(objective, difficulty);
  const potentialScience = totals.sciencePerDay * objective.requiredLifetimeMonths * 30;
  const potentialFits = potentialScience >= target;
  checks.push(
    check(
      "science-capacity",
      "Science capacity",
      potentialFits ? "pass" : "fail",
      potentialFits
        ? `The payload can theoretically return ${fmtNumberScience(potentialScience)} science points against a target of ${fmtNumberScience(target)}.`
        : `Even at full duty cycle the payload returns about ${fmtNumberScience(potentialScience)} science points, below the ${fmtNumberScience(target)} target.`,
      `${fmtNumberScience(target)} science`,
      `${fmtNumberScience(potentialScience)} maximum`,
    ),
  );

  if (vehicle) {
    checks.push(
      check(
        "reliability",
        "Launch reliability",
        "info",
        `${vehicle.name} has a ${vehicle.reliabilityPct}% demonstrated reliability in this dataset.`,
        "—",
        `${vehicle.reliabilityPct}%`,
      ),
    );
  }

  const relax = options.sandboxRelax ?? difficulty.id === "sandbox";
  const finalChecks = relax
    ? checks.map((item) =>
        item.status === "fail"
          ? {
              ...item,
              status: "warn" as const,
              detail: `Sandbox override — ${item.detail}`,
            }
          : item,
      )
    : checks;

  return finalise(finalChecks);
}

function lifespanDetail(
  componentName: string,
  ratedMonths: number,
  effectiveMonths: number,
  requiredMonths: number,
): string {
  const radiationLimited = effectiveMonths < ratedMonths;
  if (effectiveMonths >= requiredMonths) {
    return `${componentName} limits the mission to ${fmtMonths(effectiveMonths)}${radiationLimited ? " (radiation-limited)" : ""}, meeting the ${fmtMonths(requiredMonths)} requirement.`;
  }
  return `${componentName} limits the mission to ${fmtMonths(effectiveMonths)}${radiationLimited ? " (radiation-limited)" : ""}, short of the ${fmtMonths(requiredMonths)} requirement.`;
}

function fmtNumberScience(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} pts`;
}

function finalise(checks: FeasibilityCheck[]): CompatibilityReport {
  const failures = checks.filter((item) => item.status === "fail").length;
  const warnings = checks.filter((item) => item.status === "warn").length;
  return {
    checks,
    passed: failures === 0,
    failures,
    warnings,
    checksRun: checks.filter((item) => item.status !== "info").length,
  };
}

export function readinessScore(report: CompatibilityReport): number {
  if (report.checksRun === 0) return 0;
  const passed = report.checks.filter((item) => item.status === "pass").length;
  return round(clamp((passed / report.checksRun) * 100, 0, 100));
}
