import type {
  DailyTelemetry,
  DesignState,
  MissionEvent,
  SimulationResult,
} from "../data/types";
import {
  downlinkPerDay,
  getDifficulty,
  getLaunchVehicle,
  getObjective,
  getOrbit,
  limitingComponent,
  resolveSelection,
  scienceTargetFor,
  calculateTotals,
} from "./design";
import { fmtData, fmtMonths, fmtPower } from "./format";
import { clamp, round } from "./math";

const STEPS_PER_HOUR = 4;
const HOURS_PER_DAY = 24;

interface WindowOverlap {
  start: number;
  end: number;
}

export function simulateMission(design: DesignState): SimulationResult | null {
  const objective = getObjective(design.objectiveId);
  const orbit = getOrbit(design.orbitId);
  const difficulty = getDifficulty(design.difficulty);
  const vehicle = getLaunchVehicle(design.launchVehicleId);
  if (!objective || !orbit) return null;

  const systems = resolveSelection(design.selection);
  const totals = calculateTotals(design.selection, difficulty, objective.body);
  if (!systems.power || !systems.comms || !systems.computer || !systems.battery) {
    return null;
  }

  const durationDays = objective.requiredLifetimeMonths * 30;
  const scienceTarget = scienceTargetFor(objective, difficulty);
  const dataPerDay = totals.dataGbPerDay;
  const scienceDensity =
    dataPerDay > 0 ? totals.sciencePerDay / dataPerDay : 0;
  const downlinkCapacity = downlinkPerDay(systems.comms, orbit);
  const batteryCapacity = systems.battery.capacityWh;

  const limiting = limitingComponent(systems, orbit);
  const instrumentFailureDay =
    limiting.component &&
    limiting.component.category === "instruments" &&
    limiting.lifetimeMonths < objective.requiredLifetimeMonths
      ? Math.floor(limiting.lifetimeMonths * 30)
      : null;
  const anyFailureDay =
    limiting.component && limiting.lifetimeMonths < objective.requiredLifetimeMonths
      ? Math.floor(limiting.lifetimeMonths * 30)
      : null;

  const eclipseFraction = clamp(orbit.eclipseHours / orbit.periodHours, 0, 0.95);
  const powerDegradation = systems.power.degradationPerYear;
  const isSolar = systems.power.kind === "solar";
  const loadW = totals.powerUseW;

  let batteryWh = batteryCapacity;
  let bufferGb = 0;
  let science = 0;
  let totalDownlinkedGb = 0;
  let totalGeneratedGb = 0;
  let totalLostGb = 0;
  let totalGeneratedWh = 0;
  let totalLoadWh = 0;
  let powerDeficitHours = 0;
  let minBatteryPct = 100;
  let batteryCycles = 0;
  let lastNetPower = 0;
  let failed = false;

  const events: MissionEvent[] = [];
  const daily: DailyTelemetry[] = [];

  let dayBatteryMin = 100;
  let dayGeneratedWh = 0;
  let dayLoadWh = 0;
  let dayDownlinkGb = 0;
  let dayLostGb = 0;
  let dayDeficitWh = 0;
  let daySolarW = 0;
  let dayLoadWSample = 0;
  let daySamples = 0;

  let firstDeficitDay: number | null = null;
  let firstOverflowDay: number | null = null;
  let firstLowBatteryDay: number | null = null;
  let scienceMilestoneDay: number | null = null;

  events.push({
    day: 0,
    severity: "info",
    title: "Launch and orbit insertion",
    detail: `${vehicle?.name ?? "Launch vehicle"} delivers the spacecraft to ${orbit.name}.`,
  });
  events.push({
    day: 0,
    severity: "info",
    title: isSolar ? "Solar arrays deployed" : "Radioisotope source online",
    detail: isSolar
      ? `${fmtPower(totals.powerGenW)} beginning-of-life generation at the target.`
      : `${fmtPower(totals.powerGenW)} of constant thermal power, independent of eclipse.`,
  });

  const totalSteps = Math.round(durationDays * HOURS_PER_DAY * STEPS_PER_HOUR);
  const dtHours = 1 / STEPS_PER_HOUR;

  for (let step = 0; step < totalSteps; step += 1) {
    const tHours = step * dtHours;
    const day = Math.floor(tHours / HOURS_PER_DAY);
    const hourOfDay = tHours % HOURS_PER_DAY;
    const phase = (tHours % orbit.periodHours) / orbit.periodHours;
    const illuminated = phase >= eclipseFraction;
    const degradation = Math.pow(1 - powerDegradation, tHours / (365 * 24));

    if (anyFailureDay !== null && day >= anyFailureDay && !failed) {
      failed = true;
      events.push({
        day,
        severity: "critical",
        title: "Payload safed",
        detail: `${limiting.component?.name ?? "A critical component"} reached its qualified lifetime. Science operations have stopped.`,
      });
    }

    const generate = !failed;
    const solarGen = isSolar
      ? illuminated
        ? totals.powerGenW * degradation
        : 0
      : totals.powerGenW * degradation;
    const generatedW = generate ? solarGen : solarGen;
    totalGeneratedWh += generatedW * dtHours;
    totalLoadWh += loadW * dtHours;

    const netW = generatedW - loadW;
    let deficitWh = 0;
    if (netW >= 0) {
      batteryWh = Math.min(batteryCapacity, batteryWh + netW * dtHours);
      if (lastNetPower < 0) batteryCycles += 1;
    } else {
      const drainWh = -netW * dtHours;
      const delivered = Math.min(batteryWh, drainWh);
      batteryWh -= delivered;
      deficitWh = drainWh - delivered;
      if (deficitWh > 0.001) {
        powerDeficitHours += dtHours;
        if (firstDeficitDay === null) {
          firstDeficitDay = day;
          events.push({
            day,
            severity: "warning",
            title: "Battery depleted",
            detail: `Load exceeded stored energy. Instruments were safed for the first time; ${fmtPower(deficitWh / dtHours)} of demand went unmet.`,
          });
        }
      }
    }
    lastNetPower = netW;

    const batteryPct = batteryCapacity > 0 ? (batteryWh / batteryCapacity) * 100 : 0;
    if (batteryPct < minBatteryPct) minBatteryPct = batteryPct;
    if (batteryPct < dayBatteryMin) dayBatteryMin = batteryPct;
    if (
      firstLowBatteryDay === null &&
      batteryPct < 20 &&
      batteryCapacity > 0 &&
      firstDeficitDay === null
    ) {
      firstLowBatteryDay = day;
      events.push({
        day,
        severity: "warning",
        title: "Battery margin low",
        detail: `State of charge fell to ${batteryPct.toFixed(0)}%. A larger battery or lower load would restore the reserve.`,
      });
    }

    const activeFraction = deficitWh > 0 ? 0 : generate ? 1 : 0;
    const dataGenerated = (dataPerDay / HOURS_PER_DAY) * dtHours * activeFraction;
    totalGeneratedGb += dataGenerated;
    bufferGb += dataGenerated;

    if (bufferGb > totals.storageGb) {
      const overflow = bufferGb - totals.storageGb;
      bufferGb = totals.storageGb;
      totalLostGb += overflow;
      dayLostGb += overflow;
      if (firstOverflowDay === null) {
        firstOverflowDay = day;
        events.push({
          day,
          severity: "warning",
          title: "Data buffer overflow",
          detail: `${fmtData(overflow)} of data was lost when the ${fmtData(totals.storageGb)} buffer filled. Add storage or downlink capacity.`,
        });
      }
    }

    const windows = buildWindows(tHours, day, hourOfDay, orbit);
    let overlapHours = 0;
    for (const window of windows) {
      overlapHours += Math.max(
        0,
        Math.min(tHours + dtHours, window.end) - Math.max(tHours, window.start),
      );
    }
    if (overlapHours > 0 && bufferGb > 0 && systems.comms) {
      const downlinkGb = Math.min(
        bufferGb,
        systems.comms.downlinkMbps * 3.6 * overlapHours,
      );
      bufferGb -= downlinkGb;
      totalDownlinkedGb += downlinkGb;
      dayDownlinkGb += downlinkGb;
      const gained = downlinkGb * scienceDensity;
      science += gained;
      if (
        scienceMilestoneDay === null &&
        science >= scienceTarget &&
        scienceTarget > 0
      ) {
        scienceMilestoneDay = day;
        events.push({
          day,
          severity: "success",
          title: "Science target reached",
          detail: `${Math.round(science).toLocaleString("en-US")} science points returned. The primary objective is met.`,
        });
      }
    }

    dayGeneratedWh += generatedW * dtHours;
    dayLoadWh += loadW * dtHours;
    dayDeficitWh += deficitWh;
    daySolarW += generatedW;
    dayLoadWSample += loadW;
    daySamples += 1;

    const isDayEnd = (step + 1) % (HOURS_PER_DAY * STEPS_PER_HOUR) === 0;
    if (isDayEnd) {
      daily.push({
        // Daily samples are labelled at the end of the simulated day so the
        // final sample lands on the mission's full duration.
        day: day + 1,
        batteryPct: round(dayBatteryMin, 1),
        bufferGb: round(bufferGb, 2),
        science: round(science, 1),
        dataDownlinkedGb: round(dayDownlinkGb, 2),
        dataLostGb: round(dayLostGb, 2),
        solarW: round(daySamples > 0 ? daySolarW / daySamples : 0, 1),
        loadW: round(daySamples > 0 ? dayLoadWSample / daySamples : 0, 1),
        powerDeficitWh: round(dayDeficitWh, 1),
      });
      dayBatteryMin = batteryPct;
      dayGeneratedWh = 0;
      dayLoadWh = 0;
      dayDownlinkGb = 0;
      dayLostGb = 0;
      dayDeficitWh = 0;
      daySolarW = 0;
      dayLoadWSample = 0;
      daySamples = 0;
    }
  }

  if (instrumentFailureDay !== null && eventDayMissing(events, instrumentFailureDay)) {
    events.push({
      day: instrumentFailureDay,
      severity: "critical",
      title: "Instrument end of life",
      detail: `${limiting.component?.name ?? "The instrument"} exceeded its rated life. The remaining suite continues.`,
    });
  }

  const coverageOk = orbit.coveragePct >= objective.minCoveragePct;
  const scienceOk = science >= scienceTarget;
  const downlinkCoveragePct =
    totalGeneratedGb > 0 ? (totalDownlinkedGb / totalGeneratedGb) * 100 : 0;
  const averagePowerMarginPct =
    loadW > 0 ? ((totalGeneratedWh / (totalHours(totalSteps) || 1) - loadW) / loadW) * 100 : 0;
  const averageDataMarginPct =
    dataPerDay > 0 ? ((downlinkCapacity - dataPerDay) / dataPerDay) * 100 : 100;

  const gaps: string[] = [];
  if (!scienceOk) {
    gaps.push(
      `Science return of ${Math.round(science).toLocaleString("en-US")} is below the ${scienceTarget.toLocaleString("en-US")} target.`,
    );
  }
  if (!coverageOk) {
    gaps.push(
      `${orbit.name} provides ${orbit.coveragePct}% coverage against the ${objective.minCoveragePct}% requirement.`,
    );
  }
  if (totalLostGb > 0) {
    gaps.push(
      `${fmtData(totalLostGb)} of instrument data was lost before downlink.`,
    );
  }
  if (powerDeficitHours > 0) {
    gaps.push(
      `The power system was in deficit for ${powerDeficitHours.toFixed(1)} hours, safing instruments.`,
    );
  }
  if (anyFailureDay !== null && anyFailureDay < durationDays) {
    gaps.push(
      `A critical component reached its lifetime limit at ${fmtMonths(limiting.lifetimeMonths)}.`,
    );
  }
  if (gaps.length === 0) {
    gaps.push("All primary science and engineering requirements were met.");
  }

  const lifetimeOk = anyFailureDay === null || anyFailureDay >= durationDays;
  const success =
    scienceOk &&
    coverageOk &&
    powerDeficitHours === 0 &&
    totalLostGb < totalGeneratedGb * 0.05 &&
    lifetimeOk;

  events.push({
    day: durationDays,
    severity: success ? "success" : "warning",
    title: success ? "Mission complete" : "Mission complete with gaps",
    detail: success
      ? `${Math.round(science).toLocaleString("en-US")} science points returned over ${fmtMonths(objective.requiredLifetimeMonths)}.`
      : `${Math.round(science).toLocaleString("en-US")} science points returned; review the post-mission analysis.`,
  });

  events.sort((a, b) => a.day - b.day);

  return {
    success,
    daysSimulated: durationDays,
    durationDays,
    scienceReturn: round(science, 0),
    scienceRequired: scienceTarget,
    dataDownlinkedGb: round(totalDownlinkedGb, 1),
    dataGeneratedGb: round(totalGeneratedGb, 1),
    dataLostGb: round(totalLostGb, 2),
    powerDeficitHours: round(powerDeficitHours, 1),
    minBatteryPct: round(minBatteryPct, 1),
    batteryCycles,
    averagePowerMarginPct: round(averagePowerMarginPct, 1),
    averageDataMarginPct: round(averageDataMarginPct, 1),
    downlinkCoveragePct: round(downlinkCoveragePct, 1),
    endReason: success
      ? "Primary objective met. Spacecraft remains healthy at end of commissioning."
      : "Mission ended with open science or engineering gaps.",
    events,
    daily,
    gaps,
  };
}

function totalHours(totalSteps: number): number {
  return totalSteps / STEPS_PER_HOUR;
}

function eventDayMissing(events: MissionEvent[], day: number): boolean {
  return !events.some((event) => event.day === day && event.severity === "critical");
}

function buildWindows(
  tHours: number,
  day: number,
  hourOfDay: number,
  orbit: {
    commsWindowsPerDay: number;
    commsWindowHours: number;
  },
): WindowOverlap[] {
  const windows: WindowOverlap[] = [];
  const stride = HOURS_PER_DAY / orbit.commsWindowsPerDay;
  const dayStart = day * HOURS_PER_DAY;
  for (let index = 0; index < orbit.commsWindowsPerDay; index += 1) {
    const start =
      dayStart + index * stride + Math.max(0, (stride - orbit.commsWindowHours) / 2);
    const end = start + orbit.commsWindowHours;
    if (end < tHours || start > tHours + 1 / STEPS_PER_HOUR) continue;
    if (hourOfDay >= 0) windows.push({ start, end });
  }
  return windows;
}

export function dataLossPercent(result: SimulationResult): number {
  if (result.dataGeneratedGb <= 0) return 0;
  return (result.dataLostGb / result.dataGeneratedGb) * 100;
}

export function sciencePercent(result: SimulationResult): number {
  if (result.scienceRequired <= 0) return 100;
  return (result.scienceReturn / result.scienceRequired) * 100;
}
