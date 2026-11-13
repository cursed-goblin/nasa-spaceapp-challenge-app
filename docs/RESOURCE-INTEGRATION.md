# Official resource integration

TRADEOFF is a single-player, zero-backend mission design game. It is built to be
playable now and to accept an official NASA Space Apps Challenge 2026 resource
pack later without a rewrite. This document is the engineering contract for that
drop-in.

> **Current state:** `v0.3.0 · provisional`. Numerical values are
> gameplay-balanced estimates compiled from public mission literature. They are
> internally consistent but not flight-qualified. The official NASA pack has not
> been supplied in this workspace.

## 1. Integration surfaces

| Surface | File(s) | Official data expected |
| --- | --- | --- |
| Component catalogue | `src/data/components.ts` | Bus, power, battery, comms, avionics, ADCS and instrument specs |
| Mission briefs | `src/data/objectives.ts` | Science goals, measurement tags, coverage, lifetime, budgets, analogue missions |
| Orbits | `src/data/orbits.ts` | Geometry, eclipse, coverage, revisit, comms windows, radiation, station-keeping |
| Launch vehicles | `src/data/launchVehicles.ts` | Cost, fairing envelope, reliability, payload capacity by destination |
| Bodies | `src/data/bodies.ts` | Solar factor, display metadata |
| Measurement taxonomy | `src/data/measurements.ts` | Tag labels and short names |
| Dataset badge | `src/data/dataset.ts` | Version, status, summary, pending-source list |
| Maturity badge | `src/engine/maturity.ts` | Game adaptation of JPL CML 1–4 |
| GMAT handoff | `src/engine/gmat.ts` | Starting script or JSON orbit elements |
| Visualization adapter | `src/components/visuals/OrbitDiagram.tsx`, `FlightTrack.tsx` | Optional future `mission-viz` adapter |

The source register, field mapping and release checklist live in
`resources/manifest.json`. `npm run data:check` validates both sides.

## 2. Drop-in procedure

1. **Place files.** Put official files in `resources/incoming/`. Do not edit
   source data first.
2. **Register files.** Add their paths to `sources[].files` in the manifest and
   record the source URL, licence and access date. A required source changes
   from `pending` to `verified` only after review.
3. **Map fields.** Use `fieldMappings` to connect each field to a target file.
   If a mapping is ambiguous, record the decision in this document before
   changing code.
4. **Translate, don't paste.** Keep the runtime TypeScript types. Apply unit
   conversions and rounding explicitly. Preserve a comment next to any
   gameplay-only transformation.
5. **Update status.** Change `src/data/dataset.ts` and `resources/manifest.json`
   together. Use `mixed` if some fields remain gameplay estimates; use
   `official` only when every numerical source is accounted for.
6. **Validate.**
   ```bash
   npm run data:check
   npm run data:check:strict
   npm test
   npm run build
   ```

### Field map

| Target file | Fields | Notes |
| --- | --- | --- |
| `src/data/components.ts` | `massKg`, `costMusd`, `volumeM3`, `powerW`, `generationW`, `capacityWh`, `downlinkMbps`, `sciencePerDay`, `dataGbPerDay`, `lifetimeMonths`, `radToleranceKrad` | Keep the discriminated `category` field. Instrument measurement tags must exist in `measurements.ts`. |
| `src/data/objectives.ts` | `measurementsRequired`, `minScience`, `minCoveragePct`, `requiredLifetimeMonths`, `pointingRequirementArcsec`, `baseBudgetMusd`, `allowedOrbits` | Allowed orbit IDs must exist in `orbits.ts` and belong to the same body. |
| `src/data/orbits.ts` | `altitudeLabel`, `inclinationDeg`, `periodHours`, `eclipseHours`, `coveragePct`, `revisitHours`, `commsWindowsPerDay`, `commsWindowHours`, `radiationKradPerYear`, `stationKeepingMpsPerYear` | `downlinkPerDay()` assumes Mbps × 3.6 × windows/day × window-hours. Review this conversion if the official source uses a different convention. |
| `src/data/launchVehicles.ts` | `costMusd`, `fairingDiameterM`, `fairingHeightM`, `reliabilityPct`, `payloadKg` | `payloadKg` needs all five destination keys: `leo`, `sso`, `geo`, `lunar`, `interplanetary`. |
| `src/data/bodies.ts` | `solarFactor`, display names, colours | Solar generation is scaled by `solarFactor`. RTGs ignore it. |
| `src/data/dataset.ts` | `version`, `status`, `updated`, `summary`, `pendingSources` | Drives the in-app dataset pill and status modal. |

## 3. Resource-specific decisions

### NASA Space Apps Challenge 2026 pack — pending

The official pack is the preferred source for numerical data. If it is not
available before judging, keep the provisional badge visible. The app must never
imply that gameplay-balanced numbers are official.

### JPL Concept Maturity Levels — adapted reference

`src/engine/maturity.ts` implements a four-level game badge based on:

> Wessen, R. R., Borden, C., Ziemer, J., & Kwok, J. (2013). *Space Mission
> Concept Development Using Concept Maturity Levels.* IEEE Aerospace Conference.

The badge is a **game adaptation**, not an official NASA assessment. The app
states this wherever CML appears. The source PDF was supplied locally as
`/home/dr3/Music/13-3547_A1b.pdf` and is not redistributed in this repository.

### NASA *Design and Develop Science Missions* — process reference

The March 2025 NASA webinar deck (`/home/dr3/Music/250323-design-and-develop-science-mission.pdf`)
informed the segment-level review spine: science, spacecraft, orbit, launch,
ground segment, operations, risk and cost closure. It is a process reference,
not a numerical component catalogue. The game's review groups mirror that
discipline without claiming to reproduce a NASA review.

### NASA *CubeSat 101* — process reference

The CubeSat Launch Initiative guide
(`/home/dr3/Pictures/nasa_csli_cubesat_101_508.pdf`) informed small-spacecraft
process, integration-and-test, risk and review language. It is not used for
component values. It is not redistributed here.

### NASA Goddard Mission Design Lab — framework reference

The review structure borrows the idea of a disciplined MEL, power/data budgets,
orbit analysis, launch accommodations, risk and cost closure from the NASA GSFC
Mission Design Lab:

<https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/>

TRADEOFF is independent and not an official MDL product. Values, feasibility
logic and scoring are the game's own.

### NASA `mission-viz` — deferred visualization adapter

Repository: <https://github.com/nasa/mission-viz>

The current build deliberately uses dependency-light SVG for the orbit orrery
and flight track. It is responsive, printable and works offline. A future
`mission-viz` adapter could:

- read the same `OrbitSpec`, `LaunchVehicleSpec` and `DailyTelemetry` objects;
- render a Three.js scene behind the existing `FlightTrack` component;
- keep the SVG fallback for low-power devices, print and tests;
- preserve the zero-backend single-player path.

No `mission-viz` code or assets are vendored. Review its upstream licence and
asset terms before adding a rendered scene. The integration point is the
`FlightTrack` props contract, not the simulation engine.

### Webb *Build It Yourself* — outreach and analogue reference

<https://science.nasa.gov/mission/webb/game-build-it-yourself/>

The Webb game informed the idea of learning through assembly choices and
trade-offs. Mission analogue notes in `objectives.ts` cite real NASA missions
(Aqua, Mars Reconnaissance Orbiter, etc.) with links. No Webb game code, art or
text is copied. The analogue panel in the report explicitly says an analogue is
not an equivalence claim.

### NASA GMAT — downloadable trajectory handoff

GMAT is NASA's open-source General Mission Analysis Tool (Apache 2.0):
<https://sourceforge.net/projects/gmat/>.

The game does **not** embed GMAT and does not run a high-fidelity propagator.
The orbit screen generates:

- a `.script` starting point for Earth, Moon, Mars and Venus;
- a `.json` orbit-element set for Europa and asteroid targets where GMAT lacks a
  stock central body definition.

The script is generated by `src/engine/gmat.ts`, includes the spacecraft dry
mass, drag/SRP area, Keplerian elements, a simple force model and mission
metadata. It is not validated in a GMAT installation as part of the test suite.
Before use:

1. Open the script in your installed GMAT release and resolve any version
   syntax differences.
2. Verify the central-body gravity file and coordinate frame.
3. Replace the simplified force model with the fidelity your analysis needs.
4. Check that the epoch, state and target body match the intended mission.

The handoff is an educational bridge, not a flight dynamics product.

## 4. Provenance and disclaimers

- The application is **not an official NASA product**.
- Provisional dataset status is visible in the top bar, the data-status modal,
  report exports and the README.
- NASA names, mission names and links are used descriptively. No NASA logo or
  mission patch is copied; mission patches are generated procedural art.
- Fonts are Space Grotesk and JetBrains Mono via Fontsource; icons are
  Lucide. Their licences remain with their authors.
- Third-party PDFs supplied for research are not committed to this repository.

## 5. Acceptance checklist for the official pack

- [ ] Official files are present in `resources/incoming/` and listed in the manifest.
- [ ] Source URL, publisher, access date and usage terms are recorded.
- [ ] Every mapped field has a reviewed value or is explicitly marked as retained gameplay data.
- [ ] `src/data/dataset.ts` version matches the manifest.
- [ ] The dataset status is `official` or `mixed`; the UI badge and README agree.
- [ ] `npm run data:check:strict` passes.
- [ ] `npm test` passes, including the reference mission fixture.
- [ ] `npm run build` passes.
- [ ] Browser smoke test passes on desktop and mobile viewport.
- [ ] Report exports still include provenance and the non-official disclaimer.
