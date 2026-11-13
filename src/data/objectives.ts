import type { ObjectiveSpec } from "./types";

export const OBJECTIVES: ObjectiveSpec[] = [
  {
    id: "obj-mars-ice",
    name: "Mars Subsurface Ice Survey",
    codename: "CRYOSCOUT",
    body: "mars",
    category: "Planetary science",
    summary:
      "Map buried water ice in the mid-latitudes and find a landing zone for a future human mission.",
    narrative:
      "Orbital radar and neutron spectroscopy can see what the surface hides. The trick is fitting both instruments, a data pipeline and enough power onto a spacecraft that can survive long enough to survey the target region.",
    measurementsRequired: ["subsurface", "water"],
    minScience: 15000,
    minCoveragePct: 70,
    requiredLifetimeMonths: 24,
    pointingRequirementArcsec: 300,
    baseBudgetMusd: 430,
    allowedOrbits: ["mars-lmo", "mars-sso", "mars-areo"],
    scienceGoal:
      "Characterise the depth, concentration and distribution of subsurface ice across at least 70% of the target latitudes.",
    successCriteria: [
      "Detect and map subsurface hydrogen and dielectric contrasts.",
      "Return at least 70% of the required science volume.",
      "Maintain the instrument suite for 24 months.",
    ],
    hazards: [
      "Thin solar flux at Mars (43% of Earth)",
      "Dust deposition on solar arrays",
      "Long one-way light time complicates operations",
    ],
    analogue: {
      name: "Mars Reconnaissance Orbiter + Mars Odyssey",
      agency: "NASA",
      note: "SHARAD radar sounding and neutron spectroscopy were flown on separate spacecraft; this brief asks whether one architecture can do both jobs.",
      url: "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/",
    },
  },
  {
    id: "obj-lunar-volatiles",
    name: "Lunar South Pole Volatile Atlas",
    codename: "SHACKLETON",
    body: "moon",
    category: "Lunar exploration",
    summary:
      "Find and quantify water ice in permanently shadowed polar craters before the next crewed landing.",
    narrative:
      "The south pole is a patchwork of illuminated ridges and cryogenic shadows. A single orbit cannot see everything; the mission has to trade coverage against resolution and survive the thermal extremes of the terminator.",
    measurementsRequired: ["water", "mineralogy"],
    minScience: 9500,
    minCoveragePct: 80,
    requiredLifetimeMonths: 18,
    pointingRequirementArcsec: 240,
    baseBudgetMusd: 360,
    allowedOrbits: ["moon-polar", "moon-frozen", "moon-nrho"],
    scienceGoal:
      "Produce a high-confidence volatile inventory for the south-polar region and distinguish ice from hydrated minerals.",
    successCriteria: [
      "Identify at least three volatile-bearing regions.",
      "Achieve 80% coverage of the polar survey area.",
      "Operate through 18 months of lunar thermal cycling.",
    ],
    hazards: [
      "Permanently shadowed regions hide the best targets",
      "No continuous Earth visibility from the far side",
      "Extreme thermal gradients across the terminator",
    ],
    analogue: {
      name: "Lunar Reconnaissance Orbiter + LCROSS",
      agency: "NASA",
      note: "LRO mapped the polar terrain and lighting; LCROSS confirmed water in a permanently shadowed crater. Volatile prospecting is a multi-instrument problem.",
      url: "https://science.nasa.gov/mission/lro/",
    },
  },
  {
    id: "obj-europa-habitability",
    name: "Europa Habitability Reconnaissance",
    codename: "THALASSA",
    body: "europa",
    category: "Astrobiology",
    summary:
      "Assess whether Europa's ice shell and subsurface ocean could support life, with direct plume and ice chemistry measurements.",
    narrative:
      "Jupiter's radiation belt is a design constraint before it is a hazard. Solar power is almost useless here. A flagship-class payload needs a radioisotope source, rad-hard avionics and a downlink capable of returning the most valuable data in the outer solar system.",
    measurementsRequired: ["biosignature", "subsurface"],
    minScience: 24000,
    minCoveragePct: 60,
    requiredLifetimeMonths: 30,
    pointingRequirementArcsec: 120,
    baseBudgetMusd: 1100,
    allowedOrbits: ["europa-polar", "europa-ellip"],
    scienceGoal:
      "Characterise the ice–ocean interface, search for biosignatures and map the subsurface structure of the ice shell.",
    successCriteria: [
      "Acquire a statistically robust biosignature survey.",
      "Map the ice shell at three or more bands.",
      "Survive 30 months in the Jovian radiation environment.",
    ],
    hazards: [
      "Severe Jovian radiation",
      "Very low solar flux (4% of Earth)",
      "Deep-space light time and limited downlink",
      "Flagship-scale cost pressure",
    ],
    analogue: {
      name: "Europa Clipper",
      agency: "NASA",
      note: "Radiation-hardened avionics, a large high-gain antenna and a solar-powered outer-planet architecture. Clipper chose solar arrays where an RTG was once the default.",
      url: "https://science.nasa.gov/mission/europa-clipper/",
    },
  },
  {
    id: "obj-venus-climate",
    name: "Venus Atmosphere Climate Probe",
    codename: "AURORA",
    body: "venus",
    category: "Atmospheric science",
    summary:
      "Profile the composition, clouds and energy balance of Venus's super-rotating atmosphere over one Venusian year.",
    narrative:
      "Sunlight is abundant and the atmosphere is a laboratory. But a low orbit brings thermal cycling, a long ellipse brings a long eclipse, and the science payload has to make every downlink count.",
    measurementsRequired: ["atmosphere"],
    minScience: 7000,
    minCoveragePct: 50,
    requiredLifetimeMonths: 12,
    pointingRequirementArcsec: 360,
    baseBudgetMusd: 380,
    allowedOrbits: ["venus-low", "venus-ellip"],
    scienceGoal:
      "Build a vertical profile of atmospheric composition, aerosol structure and cloud dynamics across the mission.",
    successCriteria: [
      "Acquire a continuous 12-month atmospheric record.",
      "Resolve at least two vertical cloud layers.",
      "Cover 50% of the observable atmosphere.",
    ],
    hazards: [
      "Extreme thermal environment",
      "High solar flux stresses power and thermal systems",
      "Long eclipse in elliptical orbits",
    ],
    analogue: {
      name: "Venus Express + Akatsuki",
      agency: "ESA / JAXA",
      note: "Both missions used elliptical or polar orbits to profile the atmosphere. Thermal design, not power generation, was the dominant challenge.",
      url: "https://science.nasa.gov/venus/",
    },
  },
  {
    id: "obj-asteroid-resources",
    name: "Near-Earth Asteroid Resource Survey",
    codename: "MIDAS",
    body: "asteroid",
    category: "Resource prospecting",
    summary:
      "Characterise the metal and volatile content of a near-Earth asteroid and de-risk a future extraction mission.",
    narrative:
      "Asteroid gravity is almost a rounding error, but sunlight is weak and the target is small. Resource surveys are won by instruments that can distinguish composition and by mission architectures that can reach the object at all.",
    measurementsRequired: ["mineralogy", "composition"],
    minScience: 9000,
    minCoveragePct: 40,
    requiredLifetimeMonths: 18,
    pointingRequirementArcsec: 180,
    baseBudgetMusd: 520,
    allowedOrbits: ["asteroid-prox"],
    scienceGoal:
      "Determine the bulk composition, hydration state and extractable volatile inventory of the target asteroid.",
    successCriteria: [
      "Identify at least two distinct mineralogical units.",
      "Quantify the hydrated phase fraction.",
      "Maintain proximity operations for 18 months.",
    ],
    hazards: [
      "Very low solar flux",
      "Weak gravity makes proximity operations sensitive",
      "Limited launch windows and long cruise",
    ],
    analogue: {
      name: "OSIRIS-REx",
      agency: "NASA",
      note: "A proximity-operations tour that mapped composition and volatiles before sampling. The mission design is dominated by navigation and weak-gravity dynamics.",
      url: "https://science.nasa.gov/mission/osiris-rex/",
    },
  },
  {
    id: "obj-earth-climate",
    name: "Earth Climate Observatory",
    codename: "SENTINEL",
    body: "earth",
    category: "Earth observation",
    summary:
      "Deliver a five-year, global record of cloud, water vapour and surface temperature for climate model validation.",
    narrative:
      "Earth is the easiest place to fly and the hardest place to be patient. A five-year climate record demands long-life hardware, precise pointing and enough downlink to bring home a continuous global dataset.",
    measurementsRequired: ["atmosphere", "imaging"],
    minScience: 22000,
    minCoveragePct: 90,
    requiredLifetimeMonths: 60,
    pointingRequirementArcsec: 60,
    baseBudgetMusd: 340,
    allowedOrbits: ["earth-leo", "earth-sso", "earth-geo"],
    scienceGoal:
      "Produce a globally consistent, five-year climate data record with well-characterised inter-band calibration.",
    successCriteria: [
      "Achieve 90% global coverage.",
      "Maintain calibration and pointing for 60 months.",
      "Return a continuous, gap-free climate record.",
    ],
    hazards: [
      "Long-life hardware qualification",
      "Pointing stability drives image quality",
      "Sustained data volume and ground-station scheduling",
    ],
    analogue: {
      name: "Aqua + Suomi NPP",
      agency: "NASA / NOAA",
      note: "Long-lived polar observatories that combine atmospheric sounding with imaging. The hard part is a five-year calibrated data record, not the launch.",
      url: "https://science.nasa.gov/mission/aqua/",
    },
  },
];

export const OBJECTIVES_BY_ID = Object.fromEntries(
  OBJECTIVES.map((objective) => [objective.id, objective]),
) as Record<string, ObjectiveSpec>;

export const OBJECTIVE_ORDER = OBJECTIVES.map((objective) => objective.id);
