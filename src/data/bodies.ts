import type { BodyInfo, CelestialBody } from "./types";

export const BODIES: Record<CelestialBody, BodyInfo> = {
  earth: {
    id: "earth",
    name: "Earth",
    shortName: "Earth",
    solarFactor: 1,
    color: "#58b5ff",
    blurb: "Home orbit. Abundant sunlight, short light-time delay, and a well-surveyed environment.",
  },
  moon: {
    id: "moon",
    name: "Luna",
    shortName: "Moon",
    solarFactor: 1,
    color: "#d8e1ec",
    blurb: "Three days away. Permanently shadowed craters guard ancient volatile deposits.",
  },
  mars: {
    id: "mars",
    name: "Mars",
    shortName: "Mars",
    color: "#ff9261",
    solarFactor: 0.43,
    blurb: "Thin atmosphere, 43% of Earth's sunlight, and a record of ancient water locked in ice.",
  },
  venus: {
    id: "venus",
    name: "Venus",
    shortName: "Venus",
    solarFactor: 1.9,
    color: "#ffd27a",
    blurb: "Nearly twice Earth's solar flux and a hostile atmosphere. Power is easy; survival is not.",
  },
  europa: {
    id: "europa",
    name: "Europa",
    shortName: "Europa",
    color: "#9bd7ff",
    solarFactor: 0.04,
    blurb: "An ice moon over a global ocean. Sunlight is a rumour; radiation is not.",
  },
  asteroid: {
    id: "asteroid",
    name: "Near-Earth Asteroid",
    shortName: "Asteroid",
    color: "#c7b393",
    solarFactor: 0.12,
    blurb: "A low-gravity worldlet rich in metals and water. Arrival is only half the problem.",
  },
};

export const BODY_ORDER: CelestialBody[] = [
  "earth",
  "moon",
  "mars",
  "venus",
  "europa",
  "asteroid",
];
