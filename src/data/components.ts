import type {
  AdcsSpec,
  BatterySpec,
  CategoryId,
  CommsSpec,
  ComponentBase,
  ComputerSpec,
  InstrumentSpec,
  PowerSpec,
  SpacecraftComponent,
  StructureSpec,
} from "./types";

export const CATEGORY_ORDER: CategoryId[] = [
  "structure",
  "power",
  "battery",
  "comms",
  "computer",
  "adcs",
  "instruments",
];

export const CATEGORY_META: Record<
  CategoryId,
  { label: string; short: string; blurb: string }
> = {
  structure: {
    label: "Structure",
    short: "BUS",
    blurb: "The pressure vessel, mounting points and instrument slots. Everything else hangs off it.",
  },
  power: {
    label: "Power",
    short: "PWR",
    blurb: "Generation, not storage. Solar arrays scale with sunlight; RTGs do not care about the dark.",
  },
  battery: {
    label: "Battery",
    short: "BAT",
    blurb: "Energy for eclipse and peak loads. Capacity is mass you carry for the whole mission.",
  },
  comms: {
    label: "Communications",
    short: "COM",
    blurb: "Downlink rate sets how much of the science you actually get home.",
  },
  computer: {
    label: "Avionics",
    short: "C&DH",
    blurb: "Storage buffers the data stream. Autonomy decides what survives when bandwidth is scarce.",
  },
  adcs: {
    label: "Attitude Control",
    short: "ADCS",
    blurb: "Pointing accuracy and the delta-v budget for station-keeping.",
  },
  instruments: {
    label: "Instruments",
    short: "SCI",
    blurb: "The reason for the mission. Every instrument adds mass, power, data and science.",
  },
};

const structures: StructureSpec[] = [
  {
    id: "structure-scout",
    category: "structure",
    name: "Scout Bus",
    tier: "simple",
    description:
      "A compact, flight-proven smallsat bus. Two instrument slots and little tolerance for excess.",
    massKg: 95,
    costMusd: 14,
    volumeM3: 0.9,
    powerW: 0,
    lifetimeMonths: 48,
    radToleranceKrad: 80,
    heritage: "SmallSat heritage",
    diameterM: 1.2,
    heightM: 1.3,
    instrumentSlots: 2,
  },
  {
    id: "structure-explorer",
    category: "structure",
    name: "Explorer Bus",
    tier: "advanced",
    description:
      "A modular medium-class bus with deployable panels, four instrument slots and a roomy payload deck.",
    massKg: 210,
    costMusd: 38,
    volumeM3: 2.4,
    powerW: 0,
    lifetimeMonths: 96,
    radToleranceKrad: 160,
    heritage: "Medium-class heritage",
    diameterM: 1.8,
    heightM: 1.9,
    instrumentSlots: 4,
  },
  {
    id: "structure-flagship",
    category: "structure",
    name: "Flagship Bus",
    tier: "advanced",
    description:
      "A heavy, rad-hardened platform built for flagship science. Six slots and enough structure for a large aperture.",
    massKg: 520,
    costMusd: 96,
    volumeM3: 7.5,
    powerW: 0,
    lifetimeMonths: 144,
    radToleranceKrad: 300,
    heritage: "Flagship heritage",
    diameterM: 3,
    heightM: 2.8,
    instrumentSlots: 6,
  },
];

const power: PowerSpec[] = [
  {
    id: "power-solar-fixed",
    category: "power",
    kind: "solar",
    name: "Fixed Solar Array",
    tier: "simple",
    description:
      "Body-mounted panels with no moving parts. Cheap and light, but generation falls with distance from the Sun.",
    massKg: 32,
    costMusd: 9,
    volumeM3: 0.5,
    powerW: 0,
    lifetimeMonths: 60,
    radToleranceKrad: 100,
    heritage: "Flight-proven",
    generationW: 280,
    degradationPerYear: 0.04,
  },
  {
    id: "power-solar-concentrator",
    category: "power",
    kind: "solar",
    name: "Concentrator Array",
    tier: "simple",
    description:
      "Folded panels with a concentrating reflector. More watts per kilogram than fixed arrays, but faster degradation.",
    massKg: 46,
    costMusd: 17,
    volumeM3: 0.8,
    powerW: 5,
    lifetimeMonths: 72,
    radToleranceKrad: 130,
    heritage: "Commercial heritage",
    generationW: 480,
    degradationPerYear: 0.055,
  },
  {
    id: "power-solar-hep",
    category: "power",
    kind: "solar",
    name: "Deployable HEP Array",
    tier: "advanced",
    description:
      "High-efficiency triple-junction cells on a deployable wing. The best watts per kilogram within the inner solar system.",
    massKg: 58,
    costMusd: 32,
    volumeM3: 1.1,
    powerW: 8,
    lifetimeMonths: 108,
    radToleranceKrad: 180,
    heritage: "Flight-proven",
    generationW: 950,
    degradationPerYear: 0.025,
  },
  {
    id: "power-rtg",
    category: "power",
    kind: "rtg",
    name: "MMRTG Bank",
    tier: "advanced",
    description:
      "Radioisotope thermoelectric generation. Constant power in darkness, at a cost and paperwork burden that never sleeps.",
    massKg: 82,
    costMusd: 150,
    volumeM3: 1.1,
    powerW: 0,
    lifetimeMonths: 180,
    radToleranceKrad: 350,
    heritage: "Deep-space heritage",
    generationW: 520,
    degradationPerYear: 0.008,
  },
];

const batteries: BatterySpec[] = [
  {
    id: "battery-compact",
    category: "battery",
    name: "Compact Li-ion",
    tier: "simple",
    description:
      "A small battery sized for short eclipse passes and modest peak loads. Keep the load lean.",
    massKg: 8,
    costMusd: 4,
    volumeM3: 0.12,
    powerW: 2,
    lifetimeMonths: 60,
    radToleranceKrad: 100,
    heritage: "SmallSat heritage",
    capacityWh: 260,
    depthOfDischarge: 0.7,
  },
  {
    id: "battery-modular",
    category: "battery",
    name: "Modular Li-ion Pack",
    tier: "advanced",
    description:
      "Scalable cells with active balancing. The default choice for a capable science platform.",
    massKg: 22,
    costMusd: 12,
    volumeM3: 0.35,
    powerW: 4,
    lifetimeMonths: 96,
    radToleranceKrad: 180,
    heritage: "Flight-proven",
    capacityWh: 1400,
    depthOfDischarge: 0.8,
  },
  {
    id: "battery-radhard",
    category: "battery",
    name: "Rad-Hard Power Core",
    tier: "advanced",
    description:
      "Shielded, high-density cells for long eclipses and high-radiation orbits. Heavy, but it keeps the lights on.",
    massKg: 44,
    costMusd: 34,
    volumeM3: 0.62,
    powerW: 6,
    lifetimeMonths: 156,
    radToleranceKrad: 400,
    heritage: "Flagship heritage",
    capacityWh: 3600,
    depthOfDischarge: 0.85,
  },
];

const comms: CommsSpec[] = [
  {
    id: "comms-uhf",
    category: "comms",
    name: "UHF Beacon",
    tier: "simple",
    description:
      "An omnidirectional beacon for telemetry and commanding. It will not bring home an instrument's data volume.",
    massKg: 3,
    costMusd: 5,
    volumeM3: 0.05,
    powerW: 8,
    lifetimeMonths: 108,
    radToleranceKrad: 150,
    heritage: "Flight-proven",
    band: "UHF",
    downlinkMbps: 0.02,
    antennaDiameterM: 0.3,
  },
  {
    id: "comms-sband",
    category: "comms",
    name: "S-band Omni",
    tier: "simple",
    description:
      "A reliable low-gain antenna. Good coverage of the ground station, but a narrow pipe for science data.",
    massKg: 8,
    costMusd: 13,
    volumeM3: 0.18,
    powerW: 20,
    lifetimeMonths: 120,
    radToleranceKrad: 170,
    heritage: "Flight-proven",
    band: "S",
    downlinkMbps: 1.2,
    antennaDiameterM: 0.8,
  },
  {
    id: "comms-xband",
    category: "comms",
    name: "X-band Medium Gain",
    tier: "advanced",
    description:
      "A steerable medium-gain dish. The workhorse for planetary science downlink; needs pointing and power.",
    massKg: 20,
    costMusd: 32,
    volumeM3: 0.5,
    powerW: 42,
    lifetimeMonths: 132,
    radToleranceKrad: 220,
    heritage: "Deep-space heritage",
    band: "X",
    downlinkMbps: 8,
    antennaDiameterM: 1.6,
  },
  {
    id: "comms-kaband",
    category: "comms",
    name: "Ka-band High Gain",
    tier: "advanced",
    description:
      "A large high-gain aperture for data-hungry instruments. A wide pipe, a big stowed package and a thirsty amplifier.",
    massKg: 36,
    costMusd: 58,
    volumeM3: 0.9,
    powerW: 80,
    lifetimeMonths: 144,
    radToleranceKrad: 260,
    heritage: "Flagship heritage",
    band: "Ka",
    downlinkMbps: 30,
    antennaDiameterM: 2.4,
  },
];

const computers: ComputerSpec[] = [
  {
    id: "computer-basic",
    category: "computer",
    name: "Flight Computer A",
    tier: "simple",
    description:
      "A rad-tolerant single-board computer with 20 GB of solid-state storage. Enough for a focused payload.",
    massKg: 7,
    costMusd: 10,
    volumeM3: 0.1,
    powerW: 16,
    lifetimeMonths: 132,
    radToleranceKrad: 180,
    heritage: "Flight-proven",
    storageGb: 20,
    autonomy: 2,
    scienceEfficiency: 1,
  },
  {
    id: "computer-advanced",
    category: "computer",
    name: "Rad-Hard Quad-Core",
    tier: "advanced",
    description:
      "A high-throughput avionics stack with 160 GB of storage and onboard data triage.",
    massKg: 13,
    costMusd: 27,
    volumeM3: 0.18,
    powerW: 30,
    lifetimeMonths: 156,
    radToleranceKrad: 280,
    heritage: "Flight-proven",
    storageGb: 160,
    autonomy: 4,
    scienceEfficiency: 1.06,
  },
  {
    id: "computer-ai",
    category: "computer",
    name: "Autonomous AI Co-processor",
    tier: "advanced",
    description:
      "Onboard inference selects the highest-value data when the downlink is the bottleneck. Storage-rich and power-hungry.",
    massKg: 18,
    costMusd: 52,
    volumeM3: 0.24,
    powerW: 52,
    lifetimeMonths: 144,
    radToleranceKrad: 300,
    heritage: "Emerging",
    storageGb: 600,
    autonomy: 5,
    scienceEfficiency: 1.12,
  },
];

const adcs: AdcsSpec[] = [
  {
    id: "adcs-spin",
    category: "adcs",
    name: "Spin-Stabilized",
    tier: "simple",
    description:
      "A spinning platform with coarse pointing. Cheap, robust and wholly unsuitable for narrow-field imaging.",
    massKg: 10,
    costMusd: 6,
    volumeM3: 0.14,
    powerW: 5,
    lifetimeMonths: 72,
    radToleranceKrad: 150,
    heritage: "Flight-proven",
    pointingArcsec: 1800,
    deltaVms: 220,
  },
  {
    id: "adcs-reaction",
    category: "adcs",
    name: "3-Axis Reaction Wheels",
    tier: "advanced",
    description:
      "Fine three-axis control with reaction wheels and a small hydrazine budget for station-keeping.",
    massKg: 22,
    costMusd: 25,
    volumeM3: 0.3,
    powerW: 22,
    lifetimeMonths: 120,
    radToleranceKrad: 220,
    heritage: "Flight-proven",
    pointingArcsec: 45,
    deltaVms: 420,
  },
  {
    id: "adcs-cmg",
    category: "adcs",
    name: "CMG Precision Platform",
    tier: "advanced",
    description:
      "Control-moment gyroscopes for arcsecond-class pointing and a generous delta-v reserve.",
    massKg: 40,
    costMusd: 57,
    volumeM3: 0.55,
    powerW: 44,
    lifetimeMonths: 156,
    radToleranceKrad: 280,
    heritage: "Flagship heritage",
    pointingArcsec: 5,
    deltaVms: 700,
  },
];

const instruments: InstrumentSpec[] = [
  {
    id: "inst-camera",
    category: "instruments",
    name: "Multispectral Camera",
    tier: "simple",
    description:
      "A compact visible/near-IR imager for context, landforms and change detection.",
    massKg: 12,
    costMusd: 8,
    volumeM3: 0.16,
    powerW: 18,
    lifetimeMonths: 108,
    radToleranceKrad: 180,
    heritage: "Flight-proven",
    sciencePerDay: 9,
    dataGbPerDay: 6.5,
    pointingArcsec: 120,
    measurements: ["imaging"],
  },
  {
    id: "inst-radar",
    category: "instruments",
    name: "Subsurface Sounding Radar",
    tier: "advanced",
    description:
      "Low-frequency radar that sees through dry regolith and ice. High power, high data, high science.",
    massKg: 42,
    costMusd: 39,
    volumeM3: 0.7,
    powerW: 85,
    lifetimeMonths: 108,
    radToleranceKrad: 220,
    heritage: "Planetary heritage",
    sciencePerDay: 26,
    dataGbPerDay: 18,
    pointingArcsec: 300,
    measurements: ["subsurface", "water"],
  },
  {
    id: "inst-mass-spec",
    category: "instruments",
    name: "Mass Spectrometer",
    tier: "simple",
    description:
      "Measures the composition of gases and aerosols. A light, efficient way to characterise an atmosphere.",
    massKg: 10,
    costMusd: 12,
    volumeM3: 0.14,
    powerW: 24,
    lifetimeMonths: 120,
    radToleranceKrad: 200,
    heritage: "Flight-proven",
    sciencePerDay: 15,
    dataGbPerDay: 3,
    pointingArcsec: 600,
    measurements: ["composition", "atmosphere"],
  },
  {
    id: "inst-ir-spec",
    category: "instruments",
    name: "IR Imaging Spectrometer",
    tier: "advanced",
    description:
      "Maps mineralogy and surface composition across dozens of spectral bands.",
    massKg: 18,
    costMusd: 21,
    volumeM3: 0.26,
    powerW: 36,
    lifetimeMonths: 120,
    radToleranceKrad: 220,
    heritage: "Flight-proven",
    sciencePerDay: 20,
    dataGbPerDay: 11,
    pointingArcsec: 240,
    measurements: ["mineralogy", "composition"],
  },
  {
    id: "inst-magnetometer",
    category: "instruments",
    name: "Fluxgate Magnetometer",
    tier: "simple",
    description:
      "A boom-mounted magnetometer for field structure and space-weather context. Tiny data, tiny power.",
    massKg: 4,
    costMusd: 4,
    volumeM3: 0.06,
    powerW: 5,
    lifetimeMonths: 156,
    radToleranceKrad: 300,
    heritage: "Flight-proven",
    sciencePerDay: 8,
    dataGbPerDay: 0.4,
    pointingArcsec: 1800,
    measurements: ["fields"],
  },
  {
    id: "inst-seismometer",
    category: "instruments",
    name: "Broadband Seismometer",
    tier: "simple",
    description:
      "Listens to the interior. Requires a stable, low-vibration platform and a long listening campaign.",
    massKg: 12,
    costMusd: 9,
    volumeM3: 0.15,
    powerW: 8,
    lifetimeMonths: 120,
    radToleranceKrad: 200,
    heritage: "Planetary heritage",
    sciencePerDay: 14,
    dataGbPerDay: 1.2,
    pointingArcsec: 900,
    measurements: ["geophysics"],
  },
  {
    id: "inst-neutron",
    category: "instruments",
    name: "Neutron Water Mapper",
    tier: "advanced",
    description:
      "Detects hydrogen-bearing material by neutron flux. The sharpest remote signature of buried water ice.",
    massKg: 22,
    costMusd: 27,
    volumeM3: 0.3,
    powerW: 34,
    lifetimeMonths: 108,
    radToleranceKrad: 240,
    heritage: "Planetary heritage",
    sciencePerDay: 22,
    dataGbPerDay: 4,
    pointingArcsec: 600,
    measurements: ["water", "subsurface"],
  },
  {
    id: "inst-life-lab",
    category: "instruments",
    name: "Life Detection Micro-lab",
    tier: "advanced",
    description:
      "A miniaturised wet lab for biosignature analysis. The most demanding payload you can fly, and the most valuable.",
    massKg: 50,
    costMusd: 86,
    volumeM3: 0.85,
    powerW: 118,
    lifetimeMonths: 120,
    radToleranceKrad: 320,
    heritage: "Flagship heritage",
    sciencePerDay: 41,
    dataGbPerDay: 22,
    pointingArcsec: 300,
    measurements: ["biosignature", "composition"],
  },
  {
    id: "inst-lidar",
    category: "instruments",
    name: "Atmospheric Lidar",
    tier: "advanced",
    description:
      "Profiles aerosols and clouds with a pulsed laser. Excellent atmospheric science; expensive to power.",
    massKg: 30,
    costMusd: 33,
    volumeM3: 0.5,
    powerW: 70,
    lifetimeMonths: 108,
    radToleranceKrad: 240,
    heritage: "Flight-proven",
    sciencePerDay: 24,
    dataGbPerDay: 13,
    pointingArcsec: 180,
    measurements: ["atmosphere"],
  },
  {
    id: "inst-radiometer",
    category: "instruments",
    name: "Microwave Radiometer",
    tier: "simple",
    description:
      "Passive microwave sounding of temperature, humidity and water. A steady, low-risk climate workhorse.",
    massKg: 15,
    costMusd: 15,
    volumeM3: 0.22,
    powerW: 28,
    lifetimeMonths: 120,
    radToleranceKrad: 220,
    heritage: "Flight-proven",
    sciencePerDay: 18,
    dataGbPerDay: 8,
    pointingArcsec: 360,
    measurements: ["atmosphere", "water"],
  },
];

export const COMPONENTS: SpacecraftComponent[] = [
  ...structures,
  ...power,
  ...batteries,
  ...comms,
  ...computers,
  ...adcs,
  ...instruments,
];

export const COMPONENTS_BY_ID = Object.fromEntries(
  COMPONENTS.map((component) => [component.id, component]),
) as Record<string, SpacecraftComponent>;

export const COMPONENTS_BY_CATEGORY: Record<CategoryId, SpacecraftComponent[]> = {
  structure: structures,
  power,
  battery: batteries,
  comms,
  computer: computers,
  adcs,
  instruments,
};

export function getComponent(id: string | undefined): SpacecraftComponent | undefined {
  return id ? COMPONENTS_BY_ID[id] : undefined;
}

export function isStructure(component: ComponentBase): component is StructureSpec {
  return component.category === "structure";
}

export function isPower(component: ComponentBase): component is PowerSpec {
  return component.category === "power";
}

export function isBattery(component: ComponentBase): component is BatterySpec {
  return component.category === "battery";
}

export function isComms(component: ComponentBase): component is CommsSpec {
  return component.category === "comms";
}

export function isComputer(component: ComponentBase): component is ComputerSpec {
  return component.category === "computer";
}

export function isAdcs(component: ComponentBase): component is AdcsSpec {
  return component.category === "adcs";
}

export function isInstrument(component: ComponentBase): component is InstrumentSpec {
  return component.category === "instruments";
}
