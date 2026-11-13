import { BODIES } from "../data/bodies";
import { COMPONENTS_BY_ID, isComms } from "../data/components";
import { DIFFICULTY_BY_ID } from "../data/difficulties";
import { LAUNCH_VEHICLES_BY_ID } from "../data/launchVehicles";
import { OBJECTIVES_BY_ID } from "../data/objectives";
import { ORBITS_BY_ID } from "../data/orbits";
import type {
  AdcsSpec,
  BatterySpec,
  CategoryId,
  CommsSpec,
  ComputerSpec,
  DifficultyId,
  DifficultySpec,
  InstrumentSpec,
  LaunchVehicleSpec,
  ObjectiveSpec,
  OrbitSpec,
  PowerSpec,
  Selection,
  SpacecraftComponent,
  StructureSpec,
  Totals,
} from "../data/types";

export interface SelectedSystems {
  structure?: StructureSpec;
  power?: PowerSpec;
  battery?: BatterySpec;
  comms?: CommsSpec;
  computer?: ComputerSpec;
  adcs?: AdcsSpec;
  instruments: InstrumentSpec[];
  all: SpacecraftComponent[];
}

export function resolveSelection(selection: Selection): SelectedSystems {
  const get = (id: string | undefined): SpacecraftComponent | undefined =>
    id ? COMPONENTS_BY_ID[id] : undefined;

  const structure = get(selection.structure);
  const power = get(selection.power);
  const battery = get(selection.battery);
  const comms = get(selection.comms);
  const computer = get(selection.computer);
  const adcs = get(selection.adcs);

  const instruments = selection.instruments
    .map((id) => get(id))
    .filter((component): component is InstrumentSpec => component?.category === "instruments");

  return {
    structure: structure?.category === "structure" ? structure : undefined,
    power: power?.category === "power" ? power : undefined,
    battery: battery?.category === "battery" ? battery : undefined,
    comms: comms?.category === "comms" ? comms : undefined,
    computer: computer?.category === "computer" ? computer : undefined,
    adcs: adcs?.category === "adcs" ? adcs : undefined,
    instruments,
    all: [structure, power, battery, comms, computer, adcs, ...instruments].filter(
      (component): component is SpacecraftComponent => Boolean(component),
    ),
  };
}

export const REQUIRED_CATEGORIES: CategoryId[] = [
  "structure",
  "power",
  "battery",
  "comms",
  "computer",
  "adcs",
];

export function missingCategories(systems: SelectedSystems): CategoryId[] {
  return REQUIRED_CATEGORIES.filter((category) => !systems[category]);
}

export function getObjective(id: string | undefined): ObjectiveSpec | undefined {
  return id ? OBJECTIVES_BY_ID[id] : undefined;
}

export function getOrbit(id: string | undefined): OrbitSpec | undefined {
  return id ? ORBITS_BY_ID[id] : undefined;
}

export function getLaunchVehicle(id: string | undefined): LaunchVehicleSpec | undefined {
  return id ? LAUNCH_VEHICLES_BY_ID[id] : undefined;
}

export function getDifficulty(id: DifficultyId): DifficultySpec {
  return DIFFICULTY_BY_ID[id];
}

export function componentCost(component: SpacecraftComponent, difficulty: DifficultySpec): number {
  const multiplier =
    component.tier === "advanced" ? difficulty.advancedCostMultiplier : 1;
  return component.costMusd * multiplier;
}

export function effectivePowerGen(power: PowerSpec | undefined, bodyId: string): number {
  if (!power) return 0;
  if (power.kind === "rtg") return power.generationW;
  const body = BODIES[bodyId as keyof typeof BODIES];
  return power.generationW * (body?.solarFactor ?? 1);
}

export function downlinkPerDay(comms: CommsSpec | undefined, orbit: OrbitSpec | undefined): number {
  if (!comms || !orbit) return 0;
  // Mbps × 3.6 = Gb per hour at full rate.
  return (
    comms.downlinkMbps *
    3.6 *
    orbit.commsWindowsPerDay *
    orbit.commsWindowHours
  );
}

export function effectivePointingRequirement(
  objective: ObjectiveSpec,
  instruments: InstrumentSpec[],
): number {
  const instrumentFloor = instruments.reduce(
    (tightest, instrument) => Math.min(tightest, instrument.pointingArcsec),
    Number.POSITIVE_INFINITY,
  );
  return Math.min(objective.pointingRequirementArcsec, instrumentFloor);
}

export function radiationLimitedMonths(
  component: SpacecraftComponent,
  orbit: OrbitSpec | undefined,
): number {
  if (!orbit || orbit.radiationKradPerYear <= 0) return Number.POSITIVE_INFINITY;
  return (component.radToleranceKrad / orbit.radiationKradPerYear) * 12;
}

export function limitingComponent(
  systems: SelectedSystems,
  orbit: OrbitSpec | undefined,
): { component?: SpacecraftComponent; lifetimeMonths: number } {
  let limiting: SpacecraftComponent | undefined;
  let lifetime = Number.POSITIVE_INFINITY;

  for (const component of systems.all) {
    const effective = Math.min(
      component.lifetimeMonths,
      radiationLimitedMonths(component, orbit),
    );
    if (effective < lifetime) {
      lifetime = effective;
      limiting = component;
    }
  }

  return {
    component: limiting,
    lifetimeMonths: limiting ? lifetime : 0,
  };
}

export function calculateTotals(
  selection: Selection,
  difficulty: DifficultySpec,
  bodyId: string,
): Totals {
  const systems = resolveSelection(selection);
  const powerGenW = effectivePowerGen(systems.power, bodyId);
  const powerUseW = systems.all.reduce((sum, component) => sum + component.powerW, 0);
  const batteryWh = systems.battery?.capacityWh ?? 0;
  const sciencePerDayRaw = systems.instruments.reduce(
    (sum, instrument) => sum + instrument.sciencePerDay,
    0,
  );
  const scienceEfficiency = systems.computer?.scienceEfficiency ?? 1;

  return {
    massKg: systems.all.reduce((sum, component) => sum + component.massKg, 0),
    spacecraftCostMusd: systems.all.reduce(
      (sum, component) => sum + componentCost(component, difficulty),
      0,
    ),
    powerUseW,
    powerGenW,
    batteryWh,
    usableBatteryWh: batteryWh * (systems.battery?.depthOfDischarge ?? 0),
    storageGb: systems.computer?.storageGb ?? 0,
    dataGbPerDay: systems.instruments.reduce(
      (sum, instrument) => sum + instrument.dataGbPerDay,
      0,
    ),
    sciencePerDay: sciencePerDayRaw * scienceEfficiency,
    instrumentSlotsUsed: systems.instruments.length,
    instrumentSlots: systems.structure?.instrumentSlots ?? 0,
    minLifetimeMonths: systems.all.reduce(
      (min, component) => Math.min(min, component.lifetimeMonths),
      systems.all.length ? Number.POSITIVE_INFINITY : 0,
    ),
    minRadToleranceKrad: systems.all.reduce(
      (min, component) => Math.min(min, component.radToleranceKrad),
      systems.all.length ? Number.POSITIVE_INFINITY : 0,
    ),
    minPointingArcsec: systems.adcs?.pointingArcsec ?? 0,
    maxAntennaDiameterM: systems.comms?.antennaDiameterM ?? 0,
    scienceEfficiency,
    componentCount: systems.all.length,
  };
}

/**
 * Fixed ground-segment cost: ground station time, mission operations and the
 * science data archive. Modelled as a programme-level line item rather than a
 * selectable subsystem.
 */
export const GROUND_SEGMENT_COST_MUSD = 20;

export const GROUND_SEGMENT = {
  name: "Ground segment",
  description:
    "Ground station time, mission operations, navigation support and the science data archive. Assumed at a fixed programme cost for this game.",
  costMusd: GROUND_SEGMENT_COST_MUSD,
};

export function budgetFor(objective: ObjectiveSpec, difficulty: DifficultySpec): number {
  return objective.baseBudgetMusd * difficulty.budgetMultiplier;
}

export function scienceTargetFor(objective: ObjectiveSpec, difficulty: DifficultySpec): number {
  return Math.round(objective.minScience * difficulty.scienceTargetMultiplier);
}

export function totalMissionCost(totals: Totals, lv: LaunchVehicleSpec | undefined): number {
  return totals.spacecraftCostMusd + (lv?.costMusd ?? 0) + GROUND_SEGMENT_COST_MUSD;
}

export function powerMarginPct(totals: Totals): number {
  if (totals.powerUseW <= 0) return 100;
  return ((totals.powerGenW - totals.powerUseW) / totals.powerUseW) * 100;
}

export function dataMarginPct(totals: Totals, orbit: OrbitSpec | undefined, comms: CommsSpec | undefined): number {
  const capacity = downlinkPerDay(comms, orbit);
  if (totals.dataGbPerDay <= 0) return 100;
  return ((capacity - totals.dataGbPerDay) / totals.dataGbPerDay) * 100;
}

export function isCommsComponent(component: SpacecraftComponent | undefined): component is CommsSpec {
  return component ? isComms(component) : false;
}
