import type { LaunchVehicleSpec } from "./types";

export const LAUNCH_VEHICLES: LaunchVehicleSpec[] = [
  {
    id: "lv-electron",
    name: "Electron",
    provider: "Rocket Lab",
    costMusd: 8,
    fairingDiameterM: 1.2,
    fairingHeightM: 2.5,
    reliabilityPct: 95,
    payloadKg: { leo: 300, sso: 200, geo: 0, lunar: 0, interplanetary: 0 },
    description:
      "A dedicated smallsat launcher. Cheap, frequent and precise, but the fairing and payload capacity enforce a genuinely small spacecraft.",
    accent: "#8bd6ff",
  },
  {
    id: "lv-falcon9",
    name: "Falcon 9",
    provider: "SpaceX",
    costMusd: 67,
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    reliabilityPct: 99,
    payloadKg: { leo: 22800, sso: 17000, geo: 5500, lunar: 4000, interplanetary: 2500 },
    description:
      "The workhorse of the medium-lift market. A large fairing and generous capacity make it the default for a capable science spacecraft.",
    accent: "#6ce7ff",
  },
  {
    id: "lv-ariane64",
    name: "Ariane 64",
    provider: "ArianeGroup",
    costMusd: 130,
    fairingDiameterM: 5.4,
    fairingHeightM: 20,
    reliabilityPct: 97,
    payloadKg: { leo: 21650, sso: 15000, geo: 11500, lunar: 6000, interplanetary: 4200 },
    description:
      "A tall, roomy dual-launch vehicle. The long fairing accommodates large deployed antennas and stacked payloads.",
    accent: "#ffcc7a",
  },
  {
    id: "lv-atlasv",
    name: "Atlas V 551",
    provider: "United Launch Alliance",
    costMusd: 160,
    fairingDiameterM: 5.4,
    fairingHeightM: 13.1,
    reliabilityPct: 98,
    payloadKg: { leo: 18850, sso: 14000, geo: 8900, lunar: 5500, interplanetary: 3500 },
    description:
      "A high-energy medium-lift vehicle with a strong deep-space record. Expensive, reliable, and well matched to outer-planet trajectories.",
    accent: "#b8c7ff",
  },
  {
    id: "lv-falconheavy",
    name: "Falcon Heavy",
    provider: "SpaceX",
    costMusd: 150,
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    reliabilityPct: 98,
    payloadKg: { leo: 63800, sso: 40000, geo: 26700, lunar: 16000, interplanetary: 16000 },
    description:
      "Heavy-lift capacity at a medium-lift price. Unlocks flagship payloads without the institutional cost of a super-heavy rocket.",
    accent: "#9fffc4",
  },
  {
    id: "lv-sls",
    name: "SLS Block 1B",
    provider: "NASA",
    costMusd: 950,
    fairingDiameterM: 8.4,
    fairingHeightM: 18.3,
    reliabilityPct: 95,
    payloadKg: { leo: 105000, sso: 70000, geo: 45000, lunar: 42000, interplanetary: 38000 },
    description:
      "A super-heavy institutional launcher. Enormous capacity and an 8.4-metre fairing, at a cost that consumes most mission budgets.",
    accent: "#ffb05c",
  },
];

export const LAUNCH_VEHICLES_BY_ID = Object.fromEntries(
  LAUNCH_VEHICLES.map((vehicle) => [vehicle.id, vehicle]),
) as Record<string, LaunchVehicleSpec>;
