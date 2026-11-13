export type CelestialBody =
  | "earth"
  | "moon"
  | "mars"
  | "venus"
  | "europa"
  | "asteroid";

export type Destination = "leo" | "sso" | "geo" | "lunar" | "interplanetary";

export type DifficultyId = "easy" | "medium" | "hard" | "sandbox";

export type Tier = "simple" | "advanced";

export type CategoryId =
  | "structure"
  | "power"
  | "battery"
  | "comms"
  | "computer"
  | "adcs"
  | "instruments";

export type MeasurementTag =
  | "imaging"
  | "subsurface"
  | "composition"
  | "mineralogy"
  | "fields"
  | "geophysics"
  | "water"
  | "biosignature"
  | "atmosphere";

export interface BodyInfo {
  id: CelestialBody;
  name: string;
  shortName: string;
  solarFactor: number;
  color: string;
  blurb: string;
}

export interface DifficultySpec {
  id: DifficultyId;
  label: string;
  tagline: string;
  description: string;
  budgetMultiplier: number;
  advancedCostMultiplier: number;
  powerMargin: number;
  dataMargin: number;
  scienceTargetMultiplier: number;
  scoreMultiplier: number;
  ranked: boolean;
  hintLevel: "full" | "standard" | "minimal";
}

export interface ObjectiveSpec {
  id: string;
  name: string;
  codename: string;
  body: CelestialBody;
  category: string;
  summary: string;
  narrative: string;
  measurementsRequired: MeasurementTag[];
  minScience: number;
  minCoveragePct: number;
  requiredLifetimeMonths: number;
  pointingRequirementArcsec: number;
  baseBudgetMusd: number;
  allowedOrbits: string[];
  scienceGoal: string;
  successCriteria: string[];
  hazards: string[];
  analogue: {
    name: string;
    agency: string;
    note: string;
    url: string;
  };
}

export interface ComponentBase {
  id: string;
  category: CategoryId;
  name: string;
  tier: Tier;
  description: string;
  massKg: number;
  costMusd: number;
  volumeM3: number;
  /** Continuous electrical load while operating, in watts. */
  powerW: number;
  lifetimeMonths: number;
  radToleranceKrad: number;
  heritage: string;
}

export interface StructureSpec extends ComponentBase {
  category: "structure";
  diameterM: number;
  heightM: number;
  instrumentSlots: number;
}

export interface PowerSpec extends ComponentBase {
  category: "power";
  kind: "solar" | "rtg";
  /** Rated generation at 1 AU, in watts. */
  generationW: number;
  degradationPerYear: number;
}

export interface BatterySpec extends ComponentBase {
  category: "battery";
  capacityWh: number;
  depthOfDischarge: number;
}

export interface CommsSpec extends ComponentBase {
  category: "comms";
  band: "UHF" | "S" | "X" | "Ka";
  downlinkMbps: number;
  antennaDiameterM: number;
}

export interface ComputerSpec extends ComponentBase {
  category: "computer";
  storageGb: number;
  autonomy: 1 | 2 | 3 | 4 | 5;
  /** Multiplier on science recovered from each downlinked gigabit. */
  scienceEfficiency: number;
}

export interface AdcsSpec extends ComponentBase {
  category: "adcs";
  pointingArcsec: number;
  deltaVms: number;
}

export interface InstrumentSpec extends ComponentBase {
  category: "instruments";
  sciencePerDay: number;
  dataGbPerDay: number;
  pointingArcsec: number;
  measurements: MeasurementTag[];
}

export type SpacecraftComponent =
  | StructureSpec
  | PowerSpec
  | BatterySpec
  | CommsSpec
  | ComputerSpec
  | AdcsSpec
  | InstrumentSpec;

export interface OrbitSpec {
  id: string;
  name: string;
  shortName: string;
  body: CelestialBody;
  destination: Destination;
  altitudeLabel: string;
  inclinationDeg: number;
  periodHours: number;
  eclipseHours: number;
  coveragePct: number;
  revisitHours: number;
  commsWindowsPerDay: number;
  commsWindowHours: number;
  radiationKradPerYear: number;
  stationKeepingMpsPerYear: number;
  description: string;
  tradeoff: string;
}

export interface LaunchVehicleSpec {
  id: string;
  name: string;
  provider: string;
  costMusd: number;
  fairingDiameterM: number;
  fairingHeightM: number;
  reliabilityPct: number;
  payloadKg: Record<Destination, number>;
  description: string;
  accent: string;
}

export interface DatasetMeta {
  version: string;
  status: "provisional" | "official" | "mixed";
  updated: string;
  summary: string;
  pendingSources: string[];
}

export interface Selection {
  structure?: string;
  power?: string;
  battery?: string;
  comms?: string;
  computer?: string;
  adcs?: string;
  instruments: string[];
}

export interface DesignState {
  objectiveId: string;
  difficulty: DifficultyId;
  selection: Selection;
  orbitId?: string;
  launchVehicleId?: string;
}

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface FeasibilityCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  requirement?: string;
  actual?: string;
}

export interface CompatibilityReport {
  checks: FeasibilityCheck[];
  passed: boolean;
  failures: number;
  warnings: number;
  checksRun: number;
}

export interface Totals {
  massKg: number;
  spacecraftCostMusd: number;
  powerUseW: number;
  powerGenW: number;
  batteryWh: number;
  usableBatteryWh: number;
  storageGb: number;
  dataGbPerDay: number;
  sciencePerDay: number;
  instrumentSlotsUsed: number;
  instrumentSlots: number;
  minLifetimeMonths: number;
  minRadToleranceKrad: number;
  minPointingArcsec: number;
  maxAntennaDiameterM: number;
  scienceEfficiency: number;
  componentCount: number;
}

export interface DailyTelemetry {
  day: number;
  batteryPct: number;
  bufferGb: number;
  science: number;
  dataDownlinkedGb: number;
  dataLostGb: number;
  solarW: number;
  loadW: number;
  powerDeficitWh: number;
}

export interface MissionEvent {
  day: number;
  severity: "info" | "success" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface SimulationResult {
  success: boolean;
  daysSimulated: number;
  durationDays: number;
  scienceReturn: number;
  scienceRequired: number;
  dataDownlinkedGb: number;
  dataGeneratedGb: number;
  dataLostGb: number;
  powerDeficitHours: number;
  minBatteryPct: number;
  batteryCycles: number;
  averagePowerMarginPct: number;
  averageDataMarginPct: number;
  downlinkCoveragePct: number;
  endReason: string;
  events: MissionEvent[];
  daily: DailyTelemetry[];
  gaps: string[];
}

export interface ScoreBreakdown {
  science: number;
  cost: number;
  margins: number;
  successBonus: number;
  difficultyMultiplier: number;
  total: number;
  rankEligible: boolean;
}

export interface MissionRun {
  id: string;
  createdAt: string;
  objectiveId: string;
  objectiveName: string;
  body: CelestialBody;
  difficulty: DifficultyId;
  design: DesignState;
  simulation: SimulationResult;
  score: ScoreBreakdown;
  costMusd: number;
  budgetMusd: number;
  patchSeed: number;
}

export interface SavedDesign {
  id: string;
  name: string;
  savedAt: string;
  design: DesignState;
  summary: {
    objectiveName: string;
    massKg: number;
    costMusd: number;
    sciencePerDay: number;
  };
}

export type StepId =
  | "briefing"
  | "spacecraft"
  | "orbit"
  | "launch"
  | "review"
  | "flight"
  | "report";
